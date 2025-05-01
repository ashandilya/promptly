'use server';

/**
 * @fileOverview Server action to fetch marketing prompts from a Google Sheet.
 */

import { google } from 'googleapis';
import type { Prompt } from '@/types/prompt';

// Function to fetch prompts from Google Sheet - Runs on the server
export async function fetchPromptsFromSheet(): Promise<Prompt[]> {
  console.log('Attempting to fetch prompts from Google Sheet...');

  // Note: Using NEXT_PUBLIC_ for server-side code is not ideal for security.
  // Consider removing NEXT_PUBLIC_ prefix if these are only used server-side.
  const privateKey = process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL;
  const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID;
  const sheetName = process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME || 'Sheet1'; // Default to Sheet1 if not set
  const range = `${sheetName}!A:D`; // Assuming columns A-D: id, title, text, category

  if (!privateKey || !clientEmail || !spreadsheetId) {
    const missingVars = [
      !privateKey ? 'NEXT_PUBLIC_GOOGLE_PRIVATE_KEY' : null,
      !clientEmail ? 'NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL' : null,
      !spreadsheetId ? 'NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID' : null,
    ].filter(Boolean).join(', ');
    console.error(`Configuration Error: Missing Google API credentials or Spreadsheet ID in environment variables: ${missingVars}`);
     return [
       { id: 'config-error-1', title: 'Configuration Error', text: `Missing required environment variables: ${missingVars}. Please check your .env file and server configuration.`, category: 'Setup Error' },
     ];
     // Consider throwing an error instead in a real production scenario
     // throw new Error(`Missing Google API credentials or Spreadsheet ID: ${missingVars}`);
  }

  // Log the client email to ensure it's being read correctly. Don't log the private key.
  console.log(`Using Client Email: ${clientEmail}`);
  // Avoid logging the key itself, just confirm its presence
  console.log(`Private Key is present: ${!!privateKey}`);
  // Log first and last few chars for basic format check if needed, but be cautious
  // console.log(`Private Key starts with: ${privateKey.substring(0, 30)}... ends with: ...${privateKey.substring(privateKey.length - 30)}`);

  // Ensure the private key includes literal newlines if copied directly from the JSON file.
  // The .env file should look like: NEXT_PUBLIC_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  // The google-auth-library handles the literal newlines correctly.
  const processedPrivateKey = privateKey;

  try {
    console.log('Authenticating with Google...');
    const auth = new google.auth.GoogleAuth({
       credentials: {
         client_email: clientEmail,
         private_key: processedPrivateKey, // Use the key directly
       },
       scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
     });
    console.log('Authentication object created.');

    const sheets = google.sheets({ version: 'v4', auth });
    console.log(`Fetching data from Spreadsheet ID: ${spreadsheetId}, Sheet: ${sheetName}, Range: ${range}`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    console.log('Successfully received response from Google Sheets API.');

    const rows = response.data.values;
    if (!rows || rows.length <= 1) { // Check if rows exist and have more than just headers (optional)
      console.warn(`No data found in the Google Sheet "${sheetName}" or only headers present.`);
      return [];
    }
     console.log(`Found ${rows.length - 1} data rows (excluding header).`);

    // Assuming the first row is headers, skip it (slice(1))
    const prompts = rows.slice(1).map((row, index): Prompt | null => {
       const rowIndex = index + 2; // Account for header row and 0-based index
       // Basic validation: Ensure essential columns exist and are not empty
       if (row === null || row === undefined || row.length < 3 || !row[0] || !row[1] || !row[2]) {
           console.warn(`Skipping row ${rowIndex}: Missing required data (ID, Title, or Text). Row data:`, row);
           return null; // Skip invalid rows
       }
       try {
        return {
          id: String(row[0]).trim(), // Ensure ID is a string and trim whitespace
          title: String(row[1]).trim(),
          text: String(row[2]).trim(),
          category: row[3] ? String(row[3]).trim() : undefined, // Category is optional
        };
       } catch (parseError) {
           console.warn(`Skipping row ${rowIndex}: Error parsing row data. Error: ${parseError}`, row);
           return null;
       }
     }).filter((prompt): prompt is Prompt => prompt !== null); // Filter out null values (skipped rows)

     console.log(`Successfully parsed ${prompts.length} prompts.`);
    return prompts;

  } catch (err: any) {
    // Log the full error object for detailed debugging
    console.error('Error fetching data from Google Sheets API:', err);

    let detailedErrorMessage = 'Could not load prompts from Google Sheets. Please check server logs for details.';
    let errorTitle = 'Error Loading Prompts';

    if (err.message) {
      detailedErrorMessage += ` Error Message: ${err.message}`;
    }
    if (err.code) {
       detailedErrorMessage += ` Error Code: ${err.code}`;
       // Provide more specific guidance for common errors
       if (err.code === 'ERR_OSSL_UNSUPPORTED' || (err.message && (err.message.includes('PEM_read_bio_PrivateKey') || err.message.includes('DECODER routines::unsupported')))) {
          errorTitle = 'Authentication Error';
          // Updated detailed message for the frontend
          detailedErrorMessage = `Could not authenticate with Google. This often indicates an issue with the format of the NEXT_PUBLIC_GOOGLE_PRIVATE_KEY in your .env file.\n\nEnsure it's enclosed in double quotes ("...") and includes the literal '\\n' characters for newlines, exactly as copied from the Google Cloud JSON key file.\n\nExample format in .env:\nNEXT_PUBLIC_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...your key content...\\n-----END PRIVATE KEY-----\\n"\n\nPlease verify the format, save the .env file, and restart your development server.`;
          // Log a more detailed message server-side
          console.error('Authentication failed. Potential issue with NEXT_PUBLIC_GOOGLE_PRIVATE_KEY format in .env. Ensure it is enclosed in double quotes and uses literal "\\n" for newlines.');
       } else if (err.code === 403 || (err.message && err.message.includes('PERMISSION_DENIED'))) {
           errorTitle = 'Permission Denied';
           detailedErrorMessage = `The service account ('${clientEmail}') does not have permission to access the Google Sheet.\n\nPlease ensure the service account email has been granted 'Viewer' (or 'Editor') access to the Google Sheet with ID '${spreadsheetId}'. Check sharing settings in Google Sheets.`;
           console.error(`Permission denied for service account '${clientEmail}' on spreadsheet '${spreadsheetId}'. Check sharing permissions.`);
       } else if (err.code === 404 || (err.message && err.message.includes('Requested entity was not found'))) {
           errorTitle = 'Spreadsheet Not Found';
           detailedErrorMessage = `The specified Google Sheet could not be found.\n\nPlease verify that the NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID ('${spreadsheetId}') in your .env file is correct and that the spreadsheet exists.`;
           console.error(`Spreadsheet not found with ID '${spreadsheetId}'. Verify NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID in .env.`);
       } else {
         // Log the raw error details for less common errors
         console.error('Unhandled Google Sheets API Error Details:', err);
       }
    }
    // Include additional error details if available (e.g., from googleapis library)
    if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach((e: any, i: number) => {
            console.error(`Google API Error ${i+1}:`, e);
            detailedErrorMessage += `\nAPI Error Detail ${i+1}: ${e.message || JSON.stringify(e)}`;
        });
    }


    // Provide fallback or error indication to the frontend
    return [
       { id: `fetch-error-${err.code || 'unknown'}`, title: errorTitle, text: detailedErrorMessage, category: 'Error' },
    ];
    // Option 2: Rethrow the error to be caught by the caller in production
    // throw new Error(`Failed to fetch prompts from Google Sheets: ${err.message || 'Unknown error'}`);
  }
}
