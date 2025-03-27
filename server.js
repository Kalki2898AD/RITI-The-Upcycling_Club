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
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => console.log('[DEBUG]', JSON.stringify(args))
};

// Google Sheets Configuration
const SPREADSHEET_ID = '1wVWWOjFWaSqgR0pHCUvjwdxfscwxN2lK9uA_WW4ZrbU';

// Service account credentials
const CREDENTIALS = {
  "type": "service_account",
  "project_id": "zap-kitchen",
  "private_key_id": "dd2ce00e67aab74097bfff2757687be3d5abdb55",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjdq+wKeM7YSXI\ngL5BMWHeatS6Kg2VHQbOq8Vv/LCGya49yM9SESrwSoq9R/d8W88sxnUuMrkIFuEy\nEuwdk9fUKEXadhmSr0MSujT8MvbOCY2tUy+beaT/NB7ZCXyMLVbrpFXLro0C2/tW\ngY/5K8IN0g0xhWH8hO+barv3ZZK9/SjBXIVON+7okT1Lgf1rY1kX2Xq/XAR6B3SX\nD8GUiboplf8lCwS1XV+n8h2jACOfKidy4i4bu7KVlRWkNcSF/eSL47aRTpqrelXi\nZS85IOHsEA8zVpb21w3outlcd+Q+idYBbFQhq3qxKdH1EBHflwlbB7s18llEWLwJ\nst2j2lwvAgMBAAECggEACQxp7kT9m3qls/6PSYvZd2kPfspcJR4pJc5PFcyH3C0U\nj+LYJ6y/wKojGc0Q+JBkLtlmXCs+e49dz78Ai7biTdj4kzWbGlx/tjYsrWT1rTw6\nk0SMNOIcBGzErTv2sxN4ShG3OvRd+AzoUeIPuNU3nvGED+ChgkuYHeMWk5c4l8Rf\nZ3mqR4hgyv8h8bAz7KG88EIY2aE65msj8f7XYRgg6Rg+rUkc90JML5EIBeBj3eVn\noLSmGgplX5AHv7p/BhTcrEMTySm5tW2R1oR/sMEJjyXc1kdAd6KwfSIKCbu2Hl5l\naHjBSdQhhbN4YyAlMfFaiGK/HTfyh4ePmg8SHQtaDQKBgQDc50cQK0kZ70F4u3LI\n2rZu7GJQ6k3eR2Vp8tWkqKlVoW++l3K2/EzgjS6YBsmhm4CSuczGllGN5ULXb/yX\nGhaJK+GB60u03nOKyxPlbJJ9s6PSrLoPxgPw8ANg38wHR5JmvPNhaUTnR9DfO39w\n0Rd03cN3vg/SGY58kAwA2ollIwKBgQC9by5KAFghH7mkUQDAXSpkXa+mNbSbvGQW\nuqG9E5b7q2BW5TPwuvnxv9Vow94JH7QZRO1EAf/3jzPAXFaUr1uz/NhXXD0DXhOP\n7M7GqzFEW02jCKi+c8Qb6RRGDZZQx15Q7Z0hX7wNauusvxT78KUy37zQ93MXUijk\nvQpqHit7hQKBgGdTDlwzwueMj3UnSFNGadqMWpg6X92+S2M5IFD6SuowrpHZSODq\nNhM6NjcJxbn/gC4hFfU1TkQungsi6GTM4QmcKsiYBDs/aY/b2RyQohyFr/TUsdq6\n5hEGUq43P7mP8px3eOdxU7dSUhJ4Q+3C/1O8frc9gSzmo00EG3kyvt09AoGBALTM\n5qsuhO6obvCLd2IiCZHdcQX8ADMbrZOb8T6a8eGmAb8t51L9wgygATmKp+KhZa0w\nghwEpJ9NCCGyf9hNPgMdcgZ/PKR4J8eYRwqK3ezWD9VpMFUF/Mh+vyDVWwAiKLyo\n7O2rh7pusB0iCw8i8SkLLhVr92bsvacDXmtF/E5ZAoGABr3g6GG9DO4dteKbyO4d\nD3ZYwx0F49o4hmQBaWtrZOcKpc4ZdVDG7GBYiBXnrRFodaHxnyx6E94EeUC7Ym+L\nNIcykwO9tsBlCkS6GgRPw2vDOL/eH1YLfSghkWNWzXjFZ9LLodPUsYXG/O4tkXXO\ne6jvPN9kspTNZJ67MzVOiVM=\n-----END PRIVATE KEY-----\n",
  "client_email": "ritiactivityserviceaccount@zap-kitchen.iam.gserviceaccount.com",
  "client_id": "114466122007394410752",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/ritiactivityserviceaccount%40zap-kitchen.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// UPI IDs configuration
const UPI_IDS = {
    gpay: 'sirig1703@okhdfcbank',  // Update this with your new GPay UPI ID
    phonepe: 'sirig1703@okhdfcbank'           // Update this with your new PhonePe UPI ID
};

// Create auth client
const getAuthClient = () => {
    try {
        logger.info('Using direct JWT authentication');
        // Create a JWT client directly
        return new google.auth.JWT(
            CREDENTIALS.client_email,
            null,
            CREDENTIALS.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
    } catch (error) {
        logger.error('Auth client creation error:', error);
        logger.debug('Auth error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Function to save data to Google Sheets
async function saveToGoogleSheets(data) {
    try {
        logger.info('Attempting to save data to Google Sheets');
        const auth = getAuthClient();
        logger.debug('Auth client created successfully');
        
        // With JWT, we don't need to call getClient()
        const sheets = google.sheets({ version: 'v4', auth });
        logger.debug('Created sheets client');
        
        const values = [
            [
                data.id,
                data.name,
                data.phone,
                data.year,
                data.branch,
                data.section,
                data.selectedPackage,
                data.hallTicket || 'N/A',
                data.amount,
                data.paymentMethod,
                data.timestamp,
                data.gameSelection
            ]
        ];
        
        logger.debug('Prepared values for sheets:', values);
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });
        
        logger.debug('Google Sheets response:', {
            updatedRange: response.data.updates?.updatedRange,
            updatedRows: response.data.updates?.updatedRows
        });
        
        logger.info('Data saved to Google Sheets successfully');
        return true;
    } catch (error) {
        logger.error('Failed to save to Google Sheets:', error);
        logger.debug('Google Sheets error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            } : 'No response'
        });
        return false;
    }
}

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
        logger.debug('Registration form data:', formData);

        // Generate a unique ID for the participant
        const participantId = `RITI${Date.now().toString().slice(-6)}`;
        logger.debug('Generated participant ID:', participantId);

        // Create registration data object
        const registrationData = {
            id: participantId,
            name: formData.name,
            phone: formData.mobile,
            year: formData.year,
            branch: formData.branch,
            section: formData.section,
            selectedPackage: formData.selectedPackage,
            hallTicket: formData.transactionId || 'N/A',
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            timestamp: new Date().toISOString(),
            gameSelection: formData.gameSelection || 'Both Games'
        };
        
        logger.debug('Prepared registration data:', registrationData);

        // Try to save to Google Sheets
        const savedToSheets = await saveToGoogleSheets(registrationData);
        
        if (!savedToSheets) {
            // If Google Sheets fails, store in memory as fallback
            logger.info('Using memory fallback for registration');
            if (!global.registrations) {
                global.registrations = [];
            }
            global.registrations.push(registrationData);
        }

        // Generate QR code data
        const qrData = JSON.stringify({
            id: participantId,
            name: formData.name,
            phone: formData.mobile,
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
        logger.debug('Registration error details:', {
            message: error.message,
            stack: error.stack
        });
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
