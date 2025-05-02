
'use server';

import { google } from 'googleapis';
import type { Prompt } from '@/types/prompt';

// Function to safely get environment variables
function getEnvVariable(key: string, isPublic: boolean = false): string {
  // Ensure sensitive keys like PRIVATE_KEY are not prefixed with NEXT_PUBLIC_
  const envVarKey = (key === 'GOOGLE_PRIVATE_KEY' || key === 'GOOGLE_CLIENT_EMAIL') ? key : (isPublic ? `NEXT_PUBLIC_${key}` : key);
  const value = process.env[envVarKey];
  if (!value) {
    console.error(`Error: Environment variable ${envVarKey} is not set.`);
    // Throw a more specific error for missing credentials
    const errorMsg = `Missing required environment variable: ${envVarKey}. Please ensure it is correctly set in your environment configuration.`;
    if (envVarKey === 'GOOGLE_PRIVATE_KEY' || envVarKey === 'GOOGLE_CLIENT_EMAIL') {
        throw new Error(`${errorMsg} This is required for Google Sheets authentication.`);
    } else {
        throw new Error(errorMsg);
    }
  }
  return value;
}

// Removed the parsePrivateKey function as google-auth-library can handle the key string directly
// if it's properly formatted in the environment variable (single line with literal \n characters).

export async function fetchPromptsFromSheet(): Promise<Prompt[]> {
  try {
    // Access sensitive keys directly from process.env, NOT NEXT_PUBLIC_
    // Ensure the private key is stored as a single-line string with literal '\n' for newlines in the .env file
    const privateKey = getEnvVariable('GOOGLE_PRIVATE_KEY');
    const clientEmail = getEnvVariable('GOOGLE_CLIENT_EMAIL');
    // Public variables
    const spreadsheetId = getEnvVariable('GOOGLE_SPREADSHEET_ID', true);
    const sheetName = process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME || 'Sheet1'; // Use process.env directly for public vars too

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey, // Pass the key string directly
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch columns A, B, C, D from all rows in the specified sheet
    const range = `${sheetName}!A:D`;
    console.log(`Fetching data from Spreadsheet ID: ${spreadsheetId}, Range: ${range}`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the sheet.');
      return [];
    }
    console.log(`Fetched ${rows.length} rows initially.`);


    // Check for header row by looking for 'id' (case-insensitive) in the first row
    const headerRowExists = rows[0].map(header => String(header).toLowerCase()).includes('id');
    const dataRows = headerRowExists ? rows.slice(1) : rows;

    if (headerRowExists) {
       console.log("Detected and removed header row.");
    }
     console.log(`Processing ${dataRows.length} data rows.`);


    const prompts: Prompt[] = dataRows
      .map((row, index) => {
        const rowIndex = headerRowExists ? index + 2 : index + 1; // Calculate original row number for logging
        // Ensure row has enough columns and required fields (ID, Title, Text) are not empty/null
        const id = row[0] ? String(row[0]).trim() : null;
        const title = row[1] ? String(row[1]).trim() : null;
        const text = row[2] ? String(row[2]).trim() : null;
        const category = row[3] ? String(row[3]).trim() : 'Uncategorized'; // Assign default category if missing or empty

        if (id && title && text) {
          return {
            id: id,
            title: title,
            text: text,
            category: category,
          };
        } else {
           // Log which row is skipped and why
          console.warn(`Skipping row ${rowIndex} due to missing required data (ID, Title, or Text):`, { id, title, text: text ? text.substring(0, 50)+'...' : null });
          return null; // Skip rows with insufficient essential data
        }
      })
      .filter((prompt): prompt is Prompt => prompt !== null); // Filter out null values (skipped rows)

    console.log(`Successfully parsed ${prompts.length} prompts.`);
    return prompts;
  } catch (err: any) {
    console.error('Error fetching or processing data from Google Sheets:', err);
    // Provide more context in the thrown error
    const errorMessage = (err instanceof Error) ? err.message : String(err);
    // Check if the error seems related to authentication/parsing
    let hint = "Check server logs and configuration/permissions.";
    if (errorMessage.includes('PEM routines') || errorMessage.includes('bad base64 decode') || errorMessage.includes('DECODER routines') || errorMessage.includes('unsupported')) {
        hint = "There might be an issue with the GOOGLE_PRIVATE_KEY format in your environment variables. Ensure it's a single line string with literal '\\n' for newlines."
    } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        hint = "Check Google Sheet sharing settings and service account permissions."
    } else if (errorMessage.includes('Requested entity was not found')) {
        hint = "Verify GOOGLE_SPREADSHEET_ID and GOOGLE_SHEET_NAME are correct."
    }

    throw new Error(`Failed to fetch prompts from Google Sheets. ${errorMessage}. ${hint}`, { cause: err });
  }
}
