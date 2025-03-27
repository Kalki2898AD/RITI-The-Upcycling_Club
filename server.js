const express = require('express');
const cors = require('cors');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Simple logger
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args)
};

// Set up Express
const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for registrations (temporary solution)
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

        // Store registration in memory
        registrations.push(registration);
        logger.info(`Registration saved with ID: ${participantId}`);

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

        const qrData = JSON.stringify({
            amount,
            paymentMethod,
            timestamp: new Date().toISOString()
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData);

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

// Serve favicon.ico
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});
