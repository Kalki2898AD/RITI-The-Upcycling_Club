const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Set OpenSSL configuration
process.env.OPENSSL_CONF = '/dev/null';

// Simple direct authentication approach
const SPREADSHEET_ID = '1wVWWOjFWaSqgR0pHCUvjwdxfscwxN2lK9uA_WW4ZrbU';
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

// Test function to add data to Google Sheets
async function testAddToSheet() {
  try {
    console.log('Testing Google Sheets connection...');
    
    // Create a JWT client directly
    const auth = new google.auth.JWT(
      CREDENTIALS.client_email,
      null,
      CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    
    console.log('Created JWT client');
    
    // Create Google Sheets instance
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('Created sheets client');
    
    // Test data
    const values = [[
      'TEST_ID',
      'Test Name',
      '1234567890',
      'Test Year',
      'Test Branch',
      'Test Section',
      'Test Package',
      'TEST_HALL_TICKET',
      '0',
      'CASH',
      new Date().toISOString(),
      'Test Game'
    ]];
    
    // Append data
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });
    
    console.log('Successfully added test data to Google Sheets!');
    console.log('Response:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error testing Google Sheets connection:', error);
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    return false;
  }
}

// Run the test
testAddToSheet();
