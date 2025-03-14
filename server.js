const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config();

// Enable legacy OpenSSL provider
const crypto = require('crypto');
try {
    crypto.setEngine('legacy');
} catch (error) {
    console.error('Failed to set crypto engine:', error);
}

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Logger setup
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args)
};

// Google Sheets Configuration
const SPREADSHEET_ID = '1wVWWOjFWaSqgR0pHCUvjwdxfscwxN2lK9uA_WW4ZrbU';

// Create auth client
const createAuth = () => {
    try {
        const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!privateKey) {
            throw new Error('Private key is missing or invalid');
        }

        return new google.auth.JWT({
            email: 'ritiactivityserviceaccount@zap-kitchen.iam.gserviceaccount.com',
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
    } catch (error) {
        logger.error('Auth creation error:', error);
        throw error;
    }
};

// Test connection on startup
(async () => {
    try {
        const auth = createAuth();
        await auth.authorize();
        logger.info('Successfully connected to Google Sheets API');
    } catch (error) {
        logger.error('Initial connection test failed:', error);
    }
})();

// UPI IDs configuration
const UPI_IDS = {
    gpay: 'rishikeshvarma9854@okaxis',
    phonepe: '6301852709@axl'
};

// Registration endpoint
app.post('/api/register', upload.none(), async (req, res) => {
    try {
        const formData = req.body;
        logger.info('Received registration data:', formData);

        // Basic validation
        const requiredFields = ['name', 'hallTicket', 'mobile', 'year', 'branch', 'section', 'selectedPackage', 'paymentMethod', 'amount'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(formData.mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number'
            });
        }

        // Validate transaction ID for online payments
        if (formData.paymentMethod !== 'CASH' && (!formData.transactionId || !/^\d{12}$/.test(formData.transactionId))) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 12-digit UTR number'
            });
        }

        // Generate unique participant ID
        const timestamp = new Date().getTime();
        const participantId = `RITI${timestamp}`;

        // Prepare data for Google Sheets
        const values = [[
            participantId,
            formData.name,
            formData.hallTicket,
            formData.mobile,
            formData.year,
            formData.branch,
            formData.section,
            formData.selectedPackage,
            formData.paymentMethod,
            formData.amount,
            formData.transactionId || 'N/A',
            new Date().toISOString()
        ]];

        // Write to Google Sheets
        try {
            const auth = createAuth();
            await auth.authorize();
            
            const sheets = google.sheets({ version: 'v4', auth });
            const result = await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Sheet1',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });

            if (!result.data) {
                throw new Error('No response from Google Sheets API');
            }
            
            logger.info('Successfully wrote to Google Sheets:', {
                updatedRange: result.data.updates?.updatedRange,
                updatedRows: result.data.updates?.updatedRows
            });

            // Generate QR code with participant details
            const qrData = JSON.stringify({
                id: participantId,
                name: formData.name,
                package: formData.selectedPackage
            });

            const qrCode = await QRCode.toDataURL(qrData);

            res.json({
                success: true,
                message: 'Registration successful!',
                participantData: {
                    id: participantId,
                    name: formData.name,
                    package: formData.selectedPackage
                },
                qrCode
            });

        } catch (sheetsError) {
            logger.error('Google Sheets error details:', {
                message: sheetsError.message,
                code: sheetsError.code,
                errors: sheetsError.errors,
                response: sheetsError.response?.data
            });
            throw new Error('Failed to save registration data. Please try again.');
        }

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed. Please try again.'
        });
    }
});

// QR code generation endpoint
app.post('/qr-code', async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body;
        
        if (!amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Amount and payment method are required'
            });
        }

        let upiUrl;
        if (paymentMethod === 'gpay') {
            upiUrl = `upi://pay?pa=${UPI_IDS.gpay}&pn=RITI&am=${amount}&cu=INR`;
        } else if (paymentMethod === 'phonepe') {
            upiUrl = `upi://pay?pa=${UPI_IDS.phonepe}&pn=RITI&am=${amount}&cu=INR`;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method'
            });
        }

        const qrCode = await QRCode.toDataURL(upiUrl);
        
        res.json({
            success: true,
            qrCode
        });
    } catch (error) {
        logger.error('Error generating QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code'
        });
    }
});

// Get participant details
app.get('/api/participant/:id', async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth: createAuth() });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:L'
        });

        const rows = response.data.values || [];
        const participant = rows.find(row => row[0] === req.params.id);

        if (participant) {
            res.json({
                success: true,
                participant: {
                    id: participant[0],
                    name: participant[1],
                    hallTicket: participant[2],
                    year: participant[3],
                    branch: participant[4],
                    section: participant[5],
                    amount: participant[6],
                    games: participant[7],
                    paymentMethod: participant[8],
                    transactionId: participant[9],
                    registrationDate: participant[10],
                    paymentStatus: participant[11]
                }
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Participant not found' 
            });
        }
    } catch (error) {
        const errorResponse = {
            success: false,
            message: 'Failed to fetch participant details',
            details: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        };
        logger.error('Error fetching participant details:', error);
        res.status(500).json(errorResponse);
    }
});

// Error handler function
function handleError(error, operation) {
    logger.error(`Error during ${operation}:`, error);
    return {
        success: false,
        message: `Operation failed: ${operation}`,
        details: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    };
}

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve favicon.ico
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});
