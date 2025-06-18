# Job Application Tracker

A React + Vite application to track job applications. Uses Material-UI for the interface and Google Sheets for cross-device data storage.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env.local` file in the root directory with your Google OAuth Client ID:

   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

   To get a Google OAuth Client ID:

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Set application type to "Web application"
   - Add authorized JavaScript origins:
     - For local development: `http://localhost:5173` (or whatever port Vite uses)
     - For production: `https://scientistigwe.github.io`
   - Add authorized redirect URIs:
     - For local development: `http://localhost:5173`
     - For production: `https://scientistigwe.github.io/JobApplicationTracker`
   - Click "Create" and copy the Client ID

3. Run the development server:
   ```
   npm run dev
   ```

## Features

- Track job applications with company, position, date, status, and more
- Filter and search applications
- Material-UI interface for responsive design
- Local storage for offline access
- Google Sheets integration for cross-device syncing
- Google OAuth authentication for secure access to your Google Sheets

## Deployment

To deploy to GitHub Pages:

```
npm run deploy
```

## Google Sheets Setup

1. Create a new Google Sheet
2. Add a sheet called "Applications"
3. Add headers in row 1: Company, Position, Date, Status, Source, Notes, Salary
4. Copy the Spreadsheet ID (the long string in the URL) and paste it into the app when prompted

## Google Cloud Console Setup

1. Enable the Google Sheets API in your Google Cloud Console project
2. Configure the OAuth consent screen:
   - Add the `https://www.googleapis.com/auth/spreadsheets` scope
   - Add your email address as a test user

## Technical Notes

This project is built with:

- React 19
- TypeScript
- Vite 6
- Material-UI 7
- Google Identity Services for authentication

```

```
