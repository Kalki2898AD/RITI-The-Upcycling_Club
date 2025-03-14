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
