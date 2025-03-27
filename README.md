# Riti - The Upcycling Club

A web application for managing registrations and payments for Riti Upcycling Club.

## Features

- QR Code scanning for easy access
- Secure payment options (₹40 or ₹70)
- Automated payment verification via screenshot
- User registration form
- Admin dashboard with data visualization
- Google Sheets integration for data storage

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_client_email
GOOGLE_SHEETS_SHEET_ID=your_sheet_id
```

3. Start the server:
```bash
npm start
```

## Usage

- Main website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin.html
- Admin credentials:
  - Username: RITI
  - Password: rit.kmit@123

## Tech Stack

- Frontend: HTML, CSS (Tailwind), JavaScript
- Backend: Node.js, Express
- Database: Google Sheets API
- Libraries: html5-qrcode, multer, google-spreadsheet

## Vercel Deployment with Google Sheets Integration

To deploy this application to Vercel with Google Sheets integration, follow these steps:

1. Push your code to GitHub

2. Set up the GOOGLE_CREDENTIALS environment variable in Vercel:
   - Go to your Vercel project settings
   - Navigate to the "Environment Variables" section
   - Add a new environment variable named `GOOGLE_CREDENTIALS`
   - Copy the entire contents of your `credentials.json` file and paste it as the value
   - Make sure to copy the ENTIRE JSON content, including all curly braces and quotes

3. Deploy your application

4. Verify that the Google Sheets integration is working by submitting a test registration

## Troubleshooting

If you encounter "Invalid JWT Signature" errors:

1. Make sure your service account has the correct permissions for the Google Sheet
2. Verify that the GOOGLE_CREDENTIALS environment variable contains the complete and valid JSON
3. Check that the OPENSSL_CONF environment variable is set to "/dev/null" in Vercel
