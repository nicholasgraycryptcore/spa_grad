# SPA Grad

This project provides a simple interface to view student information stored in a Google Sheet. A small Express server exposes API endpoints and a React frontend consumes them.

## Setup

1. Install dependencies (from the project root):
   ```bash
   npm install
   npm --prefix client install
   ```

2. Configure your Google service account credentials and spreadsheet ID via environment variables:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_FILE`
   - `SPREADSHEET_ID`
   - `SHEET_NAME` (optional, defaults to `Sheet1`)

3. Run the development servers:
   ```bash
   npm run dev
   ```
   The Express API runs on port `3000` and the React application on port `5173` with proxying to the API.

4. Build the frontend for production:
   ```bash
   npm --prefix client run build
   ```
   Then start the server with `npm start` to serve the built files.
