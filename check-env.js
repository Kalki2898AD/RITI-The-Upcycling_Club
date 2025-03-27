// Script to check and configure environment variables for Google Sheets
const fs = require('fs');
const path = require('path');

// Set OpenSSL configuration to resolve decoder issues
process.env.OPENSSL_CONF = '/dev/null';

try {
    // Check if credentials file exists
    const credentialsPath = path.join(__dirname, 'zap-kitchen-dd2ce00e67aa.json');
    if (fs.existsSync(credentialsPath)) {
        console.log('✅ Credentials file found');
        
        // Read the credentials file
        const credentials = require(credentialsPath);
        
        // Set environment variables from credentials file
        if (credentials && credentials.private_key) {
            process.env.GOOGLE_SHEETS_PRIVATE_KEY = credentials.private_key;
            console.log('✅ Private key loaded from credentials file');
        } else {
            console.error('❌ Private key not found in credentials file');
        }
    } else {
        console.log('❌ Credentials file not found at:', credentialsPath);
        console.log('Checking environment variables instead...');
        
        // Check if private key is set in environment variables
        if (process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
            console.log('✅ Private key found in environment variables');
        } else {
            console.error('❌ Private key not found in environment variables');
        }
    }
} catch (error) {
    console.error('Error checking credentials:', error);
}

module.exports = { 
    isConfigured: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY 
};
