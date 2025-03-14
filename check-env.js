require('dotenv').config();

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
