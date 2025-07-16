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
   The dev server proxies both `/api` and `/events` to the Express backend so
   that server-sent events work during development.

3. Build the frontend for production:
   ```bash
  npm --prefix client run build
  ```
  Then start the server with `npm start` to serve the built files.

## Pages

The application includes several screens accessible via the menu. Alongside the
existing Award Display that cycles through the next three awards, there is now a
**Single Award Display** page available at `/award-display-single` which shows
only the next student.

There is also a **Photo Packages** table available at `/photo-packages` that
lists purchased packages with live updates.
