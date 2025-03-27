// This script checks if all required environment variables are set
const fs = require('fs');
const path = require('path');

// Set OpenSSL configuration to resolve decoder issues
process.env.NODE_OPTIONS = '--openssl-legacy-provider';
process.env.OPENSSL_CONF = '/dev/null';

// Check if .env file exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.error('Error: .env file not found');
  process.exit(1);
}

// Check for required environment variables
require('dotenv').config();

const requiredVars = [
  'GOOGLE_SHEETS_PRIVATE_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

console.log('Environment variables check passed!');

// Function to check if a string is a valid private key
function isValidPrivateKey(key) {
    if (!key) return false;
    const formattedKey = key.replace(/\\n/g, '\n');
    return (
        formattedKey.includes('-----BEGIN PRIVATE KEY-----') &&
        formattedKey.includes('-----END PRIVATE KEY-----')
    );
}

// Check environment variables
console.log('Checking environment variables...');

const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
console.log('GOOGLE_SHEETS_PRIVATE_KEY:', {
    exists: !!privateKey,
    length: privateKey?.length,
    isValid: isValidPrivateKey(privateKey),
    firstChars: privateKey?.substring(0, 30) + '...',
    lastChars: '...' + privateKey?.substring(privateKey.length - 30)
});

console.log('OPENSSL_LEGACY_PROVIDER:', process.env.OPENSSL_LEGACY_PROVIDER);
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS);
