const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config();

// Set OpenSSL configuration before anything else
process.env.OPENSSL_CONF = '/dev/null';

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

// UPI IDs configuration
const UPI_IDS = {
    gpay: 'sirig1703@okhdfcbank',  // Update this with your new GPay UPI ID
    phonepe: 'sirig1703@okhdfcbank'           // Update this with your new PhonePe UPI ID
};

// Create auth client
const getAuthClient = () => {
    try {
        // Check if credentials file exists
        const fs = require('fs');
        const credentialsPath = path.join(__dirname, 'zap-kitchen-dd2ce00e67aa.json');
        
        if (fs.existsSync(credentialsPath)) {
            logger.info('Using zap-kitchen credentials file for authentication');
            return new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else if (process.env.GOOGLE_CREDENTIALS) {
            // Use environment variable if available (for Vercel)
            logger.info('Using environment variable for authentication');
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            return new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else {
            // No authentication method available
            logger.error('No authentication method available');
            throw new Error('No authentication method available');
        }
    } catch (error) {
        logger.error('Auth client creation error:', error);
        throw error;
    }
};

// Test connection on startup
(async () => {
    try {
        const auth = await getAuthClient();
        logger.info('Successfully created auth client');
    } catch (error) {
        logger.error('Google Sheets connection error:', error);
    }
})();

// In-memory fallback storage for registrations
const registrations = [];

// API Endpoints
app.post('/api/register', upload.none(), async (req, res) => {
    try {
        const formData = req.body;
        logger.info('Received registration data:', formData);

        // Basic validation
        const requiredFields = ['name', 'mobile', 'year', 'branch', 'section', 'selectedPackage', 'paymentMethod', 'amount'];
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

        // Create registration record
        const registration = {
            participantId,
            name: formData.name,
            mobile: formData.mobile,
            year: formData.year,
            branch: formData.branch,
            section: formData.section,
            selectedPackage: formData.selectedPackage,
            gameSelection: formData.gameSelection || 'Both Games',
            paymentMethod: formData.paymentMethod,
            amount: formData.amount,
            transactionId: formData.transactionId || 'N/A',
            timestamp: new Date().toISOString()
        };

        // Prepare data for Google Sheets
        const values = [[
            participantId,
            formData.name,
            formData.mobile,
            formData.year,
            formData.branch,
            formData.section,
            formData.selectedPackage,
            formData.paymentMethod,
            formData.amount,
            formData.transactionId || 'N/A',
            new Date().toISOString(),
            formData.gameSelection || 'Both Games' // Add game selection or default to Both Games
        ]];

        // Try to write to Google Sheets
        try {
            const auth = await getAuthClient();
            const client = await auth.getClient();
            logger.info('Successfully created auth client for write operation');

            const sheets = google.sheets({ version: 'v4', auth: client });
            const result = await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Sheet1',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });

            logger.info('Successfully wrote to Google Sheets:', {
                updatedRange: result.data.updates?.updatedRange,
                updatedRows: result.data.updates?.updatedRows
            });
        } catch (error) {
            // If Google Sheets fails, store in memory as fallback
            logger.error('Failed to save to Google Sheets, using memory fallback:', error);
            registrations.push(registration);
        }

        // Generate QR code
        const qrData = JSON.stringify({
            participantId,
            name: formData.name,
            mobile: formData.mobile,
            package: formData.selectedPackage,
            gameSelection: formData.gameSelection || 'Both Games',
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            timestamp: new Date().toISOString()
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData);

        return res.status(200).json({
            success: true,
            message: 'Registration successful',
            participantId,
            participantData: {
                id: participantId,
                name: formData.name,
                package: formData.selectedPackage
            },
            qrCode: qrCodeDataURL
        });
    } catch (error) {
        logger.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: `Registration failed: ${error.message}`
        });
    }
});

app.post('/qr-code', async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body;
        
        if (!amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Generate UPI URL based on payment method
        let upiUrl;
        if (paymentMethod === 'gpay') {
            upiUrl = `upi://pay?pa=${UPI_IDS.gpay}&pn=RITI&am=${amount}&cu=INR`;
        } else if (paymentMethod === 'phonepe') {
            upiUrl = `upi://pay?pa=${UPI_IDS.phonepe}&pn=RITI&am=${amount}&cu=INR`;
        } else {
            // For cash or other payment methods, just create a simple QR with the data
            upiUrl = JSON.stringify({
                amount,
                paymentMethod,
                timestamp: new Date().toISOString()
            });
        }

        const qrCodeDataURL = await QRCode.toDataURL(upiUrl);

        return res.status(200).json({
            success: true,
            qrCode: qrCodeDataURL
        });
    } catch (error) {
        logger.error('QR code generation error:', error);
        return res.status(500).json({
            success: false,
            message: `Failed to generate QR code: ${error.message}`
        });
    }
});

// Get all registrations (for debugging)
app.get('/api/registrations', (req, res) => {
    res.json({
        success: true,
        count: registrations.length,
        registrations
    });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});
