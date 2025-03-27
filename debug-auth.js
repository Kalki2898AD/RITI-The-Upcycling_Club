// Debug script to check Google Sheets authentication
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Set OpenSSL configuration
process.env.OPENSSL_CONF = '/dev/null';

// Simple logger
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args)
};

// Google Sheets Configuration
const SPREADSHEET_ID = '1wVWWOjFWaSqgR0pHCUvjwdxfscwxN2lK9uA_WW4ZrbU';

// Create auth client
const getAuthClient = () => {
    try {
        // Check if credentials file exists
        const credentialsPath = path.join(__dirname, 'credentials.json');
        
        if (fs.existsSync(credentialsPath)) {
            logger.info('Using credentials file for authentication');
            return new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else if (process.env.GOOGLE_CREDENTIALS) {
            logger.info('Using environment variable for authentication');
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            logger.info('Credentials from env:', {
                type: credentials.type,
                project_id: credentials.project_id,
                client_email: credentials.client_email,
                has_private_key: !!credentials.private_key
            });
            return new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else {
            logger.error('No authentication method available');
            throw new Error('No authentication method available');
        }
    } catch (error) {
        logger.error('Auth client creation error:', error);
        throw error;
    }
};

// Test connection
(async () => {
    try {
        logger.info('Environment variables:', {
            OPENSSL_CONF: process.env.OPENSSL_CONF,
            NODE_ENV: process.env.NODE_ENV,
            has_google_credentials: !!process.env.GOOGLE_CREDENTIALS
        });
        
        const auth = await getAuthClient();
        logger.info('Successfully created auth client');
        
        const client = await auth.getClient();
        logger.info('Successfully created client');
        
        const sheets = google.sheets({ version: 'v4', auth: client });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A1:A1'
        });
        
        logger.info('Successfully connected to Google Sheets');
        logger.info('Response:', response.data);
        
        // Try to append a test row
        const testValues = [[
            'TEST_ID',
            'Test Name',
            '1234567890',
            'Test Year',
            'Test Branch',
            'Test Section',
            'Test Package',
            'TEST',
            '0',
            'N/A',
            new Date().toISOString(),
            'Test Game'
        ]];
        
        const appendResult = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: testValues }
        });
        
        logger.info('Successfully wrote test data to Google Sheets:', {
            updatedRange: appendResult.data.updates?.updatedRange,
            updatedRows: appendResult.data.updates?.updatedRows
        });
        
    } catch (error) {
        logger.error('Google Sheets connection error:', error);
        if (error.response) {
            logger.error('Error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
    }
})();
