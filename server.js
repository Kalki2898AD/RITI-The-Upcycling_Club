const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Logger setup
const logger = require('./utils/logger');

const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY 
    ? process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: privateKey
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// Initialize Google Sheets
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1wVWWOjFWaSqgR0pHCUvjwdxfscwxN2lK9uA_WW4ZrbU';

// Test Google Sheets connection on startup
(async () => {
    try {
        logger.info('Testing Google Sheets connection...');
        logger.info(`Using spreadsheet ID: ${spreadsheetId}`);
        logger.info(`Using service account: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`);
        
        logger.info('Attempting to get spreadsheet info...');
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'properties.title'
        });
        
        logger.info('Successfully connected to Google Sheets');
        logger.info(`Spreadsheet title: ${response.data.properties.title}`);
        
    } catch (error) {
        logger.error('Error connecting to Google Sheets:', error);
        // Don't exit process on error, just log it
    }
})();

// UPI IDs configuration
const UPI_IDS = {
    gpay: 'rishikeshvarma9854@okaxis',
    phonepe: '6301852709@axl'
};

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
            upiUrl = `upi://pay?pa=rishikeshvarma9854@okaxis&pn=RITI&am=${amount}&cu=INR`;
        } else if (paymentMethod === 'phonepe') {
            upiUrl = `upi://pay?pa=6301852709@axl&pn=RITI&am=${amount}&cu=INR`;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method'
            });
        }

        // Generate QR code
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

// Registration endpoint
app.post('/api/register', upload.none(), async (req, res) => {
    try {
        logger.info('Starting registration process...');
        logger.info('Raw request body:', req.body);

        // Extract form data
        const formData = {
            name: req.body.name,
            hallTicket: req.body.hallTicket,
            mobile: req.body.mobile,
            year: req.body.year,
            branch: req.body.branch,
            section: req.body.section,
            selectedPackage: req.body.selectedPackage,
            paymentMethod: req.body.paymentMethod,
            amount: req.body.amount,
            transactionId: req.body.transactionId || 'N/A'
        };

        logger.info('Parsed form data:', formData);

        // Validate required fields
        const requiredFields = ['name', 'hallTicket', 'mobile', 'year', 'branch', 'section', 'selectedPackage', 'paymentMethod', 'amount'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            logger.error('Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(formData.mobile)) {
            logger.error('Invalid mobile number:', formData.mobile);
            return res.status(400).json({
                success: false,
                message: 'Mobile number must be 10 digits'
            });
        }

        // Validate transaction ID for online payments
        if (formData.paymentMethod !== 'CASH' && (!formData.transactionId || !/^\d{12}$/.test(formData.transactionId))) {
            logger.error('Invalid UTR number:', {
                paymentMethod: formData.paymentMethod,
                transactionId: formData.transactionId
            });
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 12-digit UTR number'
            });
        }

        // Generate unique participant ID
        const participantId = Date.now().toString();
        
        // Create QR code data
        const qrData = {
            id: participantId,
            name: formData.name,
            hallTicket: formData.hallTicket,
            package: formData.selectedPackage,
            payment: formData.paymentMethod
        };
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        
        // Add to Google Sheets
        const values = [
            [
                participantId, // ID
                formData.name,
                formData.hallTicket,
                formData.mobile,
                formData.year,
                formData.branch,
                formData.section,
                formData.selectedPackage,
                formData.paymentMethod,
                formData.amount,
                formData.transactionId,
                new Date().toISOString(), // Registration Date
                formData.paymentMethod === 'CASH' ? 'Pending' : 'Completed' // Payment Status
            ]
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:M',
            valueInputOption: 'RAW',
            resource: { values }
        });

        logger.info('Registration data written to Google Sheets');
        res.json({
            success: true,
            message: 'Registration successful',
            qrCode: qrCode,
            participantData: qrData
        });

    } catch (error) {
        logger.error('Error during registration:', error);
        res.status(500).json(handleError(error, 'registration'));
    }
});

// Get participant details
app.get('/api/participant/:id', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
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
        const errorResponse = handleError(error, 'fetching participant details');
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

// Start server
app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});
