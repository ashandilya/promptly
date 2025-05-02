'use server';

/**
 * @fileOverview Server action to fetch marketing prompts from a Google Sheet.
 */

import { google } from 'googleapis';
import type { Prompt } from '@/types/prompt';

// Function to fetch prompts from Google Sheet - Runs on the server
export async function fetchPromptsFromSheet(): Promise<Prompt[]> {
  console.log('Attempting to fetch prompts from Google Sheet...');

  // Access environment variables directly for server-side code.
  // Ensure these variables (GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, GOOGLE_SPREADSHEET_ID, GOOGLE_SHEET_NAME)
  // are set in your deployment environment (e.g., Vercel, Netlify) *without* the NEXT_PUBLIC_ prefix.
  // Also, update your local .env file accordingly.
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1'; // Default to Sheet1 if not set
  const range = `${sheetName}!A:D`; // Assuming columns A-D: id, title, text, category

  // --- Configuration Check ---
  const missingVars = [
    !privateKey ? 'GOOGLE_PRIVATE_KEY' : null,
    !clientEmail ? 'GOOGLE_CLIENT_EMAIL' : null,
    !spreadsheetId ? 'GOOGLE_SPREADSHEET_ID' : null,
  ].filter(Boolean);

  if (missingVars.length > 0) {
    const missingVarsString = missingVars.join(', ');
    console.error(`Configuration Error: Missing server environment variables: ${missingVarsString}`);
     const errorMessage = `Configuration Error: The application is missing required server-side configuration.\nPlease ensure the following environment variables are set in your hosting environment (e.g., Vercel, Netlify) and (for local development) in your .env file:\n\n- ${missingVars.join('\n- ')}\n\nThese variables should NOT start with NEXT_PUBLIC_. Contact support if you need assistance.`;
     // Return a specific error structure that the frontend can identify
     return [
       { id: 'config-error-missing-vars', title: 'Configuration Error', text: errorMessage, category: 'Setup Error' },
     ];
  }

  // Log the client email to ensure it's being read correctly. Don't log the private key.
  console.log(`Using Google Service Account Email: ${clientEmail}`);
  // Avoid logging the key itself, just confirm its presence
  console.log(`Google Private Key is present: ${!!privateKey}`);
  console.log(`Using Google Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Using Google Sheet Name: ${sheetName}`);

  // --- Authentication and API Call ---
  try {
    console.log('Creating Google Auth object...');
    // Ensure private key newlines are handled correctly if needed (though google-auth-library often manages this)
    const processedPrivateKey = privateKey?.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
       credentials: {
         client_email: clientEmail,
         private_key: processedPrivateKey, // Use the processed key
       },
       scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
     });
    console.log('Authentication object created. Attempting to get authenticated client...');

    const client = await auth.getClient();
    console.log('Successfully obtained authenticated Google Auth client.');

    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log(`Attempting to fetch data from Spreadsheet ID: ${spreadsheetId}, Sheet: ${sheetName}, Range: ${range}`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    console.log('Successfully received response from Google Sheets API.');

    // --- Data Processing ---
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
       console.warn(`No data found in the Google Sheet "${sheetName}". Ensure the sheet is not empty and the name is correct.`);
       // Return an empty array if the sheet is just empty
       return [];
     } else if (rows.length === 1) {
       console.warn(`Only a header row found in the Google Sheet "${sheetName}". Add prompt data below the header.`);
       // Return an empty array if only header exists
       return [];
     }

     console.log(`Found ${rows.length} total rows (including header). Processing ${rows.length - 1} data rows.`);

    // Assuming the first row is headers, skip it (slice(1))
    const prompts = rows.slice(1).map((row, index): Prompt | null => {
       const rowIndex = index + 2; // Account for header row (1) and 0-based index (1)
       // Basic validation: Ensure essential columns exist and have content
       if (!row || row.length < 3 || !row[0]?.trim() || !row[1]?.trim() || !row[2]?.trim()) {
           console.warn(`Skipping row ${rowIndex}: Missing required data (ID, Title, or Text) or empty values. Row data:`, row);
           return null; // Skip invalid rows
       }
       try {
        return {
          id: String(row[0]).trim(), // Ensure ID is a string and trim whitespace
          title: String(row[1]).trim(),
          text: String(row[2]).trim(),
          // Category is optional, ensure it's a string if present
          category: row[3] ? String(row[3]).trim() : undefined,
        };
       } catch (parseError: any) {
           console.warn(`Skipping row ${rowIndex}: Error parsing row data. Error: ${parseError.message || parseError}`, row);
           return null;
       }
     }).filter((prompt): prompt is Prompt => prompt !== null); // Filter out null values (skipped rows)

     if (prompts.length === 0 && rows.length > 1) {
       console.warn("No valid prompts were parsed from the sheet rows. Check row formatting.");
     } else {
       console.log(`Successfully parsed ${prompts.length} valid prompts.`);
     }
    return prompts;

  } catch (err: any) {
    // --- Error Handling ---
    console.error('Error during Google Sheets API operation:', err);

    let errorTitle = 'Error Loading Prompts';
    let detailedErrorMessage = 'An unexpected error occurred while trying to load prompts from Google Sheets.';
    let errorId = `fetch-error-unknown`;

    // Improve error messages based on common issues
    if (err.code) {
      detailedErrorMessage += ` (Code: ${err.code})`;
      errorId = `fetch-error-code-${err.code}`;
    }
    if (err.message) {
      detailedErrorMessage += ` Message: ${err.message}`;
       errorId = `fetch-error-msg-${err.message.toLowerCase().replace(/[^a-z0-9]/g,'-').substring(0, 50)}`; // Create a more specific ID from message
    }

    // Specific error handling
    if (err.message && (err.message.includes('PEM_read_bio_PrivateKey') || err.message.includes('DECODER routines::unsupported') || err.code === 'ERR_OSSL_UNSUPPORTED' || (err.message && err.message.includes('error:0A00018E:SSL routines::ca md too weak')) || (err.message && err.message.includes('error:1E08010C:DECODER routines::unsupported')))) {
        errorTitle = 'Authentication Error';
        // Updated detailed message for the frontend
        detailedErrorMessage = `Could not authenticate with Google. This often indicates an issue with the GOOGLE_PRIVATE_KEY format or compatibility in the hosting environment.\n\n1. **Verify Key:** Ensure the GOOGLE_PRIVATE_KEY environment variable provided in your hosting settings is the complete and correct key from the Google Cloud JSON file, including the -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- lines. Newlines within the key might need to be represented as literal '\\n' depending on your hosting provider.\n2. **Check Hosting Environment:** Some platforms might require specific formatting or have limitations (e.g., Node.js/OpenSSL version). Consult your hosting provider's documentation for handling multi-line environment variables or potential compatibility issues (like the 'ERR_OSSL_UNSUPPORTED' error, which may relate to Node.js version or key encryption type).\n\nPlease verify the key in your hosting provider's settings and redeploy. For local development, check the .env file formatting.`;
        // Log a more detailed message server-side
        console.error("Authentication failed. Potential issue with GOOGLE_PRIVATE_KEY format/completeness in server environment variables OR deployment environment incompatibility (Node/OpenSSL, key encryption type). Ensure the key is correctly set in the hosting environment, including header/footer lines and potentially escaped newlines (e.g., '\\n').");
        errorId = 'fetch-error-auth-key-format';
    } else if (err.code === 403 || (err.message && (err.message.includes('PERMISSION_DENIED') || err.message.includes('caller does not have permission')))) {
        errorTitle = 'Permission Denied';
        detailedErrorMessage = `The application's service account ('${clientEmail}') lacks permission to access the Google Sheet.\n\nPlease verify that this service account email has been granted at least 'Viewer' access to the Google Sheet with ID '${spreadsheetId}'. Check the 'Share' settings in Google Sheets.`;
        console.error(`Permission denied for service account '${clientEmail}' on spreadsheet '${spreadsheetId}'. Check sharing permissions in Google Sheets.`);
        errorId = 'fetch-error-permission-denied';
    } else if (err.code === 404 || (err.message && err.message.includes('Requested entity was not found'))) {
        errorTitle = 'Spreadsheet Not Found';
        detailedErrorMessage = `The specified Google Sheet could not be found.\n\nPlease verify that the GOOGLE_SPREADSHEET_ID ('${spreadsheetId}') environment variable set in your hosting environment is correct and that the spreadsheet exists and hasn't been deleted. Also check the GOOGLE_SHEET_NAME ('${sheetName}') is correct.`;
        console.error(`Spreadsheet not found with ID '${spreadsheetId}' or Sheet Name '${sheetName}'. Verify the GOOGLE_SPREADSHEET_ID and GOOGLE_SHEET_NAME server environment variables.`);
        errorId = 'fetch-error-not-found';
    } else if (err.message && err.message.includes('invalid_grant')) {
        errorTitle = 'Authentication Grant Error';
        detailedErrorMessage = `Google rejected the authentication request. This could be due to an invalid or malformed private key (GOOGLE_PRIVATE_KEY) or client email (GOOGLE_CLIENT_EMAIL).\n\nDouble-check these server environment variables in your hosting settings. Also ensure the system clocks on your server and Google's servers are synchronized.`;
        console.error('Authentication grant error. Check GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL format and values in server environment variables. Clock skew might also be an issue.');
        errorId = 'fetch-error-invalid-grant';
    } else {
        // Generic error for other cases
        console.error('Unhandled Google Sheets API Error Details:', err);
        detailedErrorMessage = `Could not load prompts due to an unexpected error. Please check the server logs for technical details. Raw error message: ${err.message || 'No message available'}`;
    }

    // Include additional details if available (e.g., from googleapis library response)
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        console.error(`Google API Error Details (${err.errors.length}):`);
        err.errors.forEach((e: any, i: number) => {
            console.error(`  Error ${i+1}:`, e);
            detailedErrorMessage += `\nAPI Error Detail ${i+1}: ${e.message || JSON.stringify(e)}`;
        });
    }

    // Return a user-friendly error prompt to the frontend using the specific error ID
    return [
       { id: errorId, title: errorTitle, text: detailedErrorMessage, category: 'Error' },
    ];
  }
}
