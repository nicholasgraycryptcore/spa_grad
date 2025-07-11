# SPA Grad

This project provides a simple interface to view student information stored in a Google Sheet. A small Express server exposes API endpoints and a React frontend consumes them.

## Setup

1. Create a Google service account and give it **Editor** access to your sheet.
   Download the JSON key and point `GOOGLE_APPLICATION_CREDENTIALS` to the file
   in a `.env` file.  Also set `REACT_APP_SPREADSHEET_ID=<your-sheet-id>` and,
   optionally, `SHEET_NAME` (defaults to `Sheet1`).

2. Install dependencies and start the application:
   ```bash
   npm install
   npm --prefix client install
   npm start
   ```
   The Express API runs on port `3000` and the React application on port `5173`.

3. Build the frontend for production:
   ```bash
   npm --prefix client run build
   ```
   Then start the server with `npm start` to serve the built files.
