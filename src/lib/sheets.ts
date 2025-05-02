
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
  // Special handling for private key newlines
  if (key === 'GOOGLE_PRIVATE_KEY') {
    return value.replace(/\\n/g, '\n');
  }
  return value;
}


export async function fetchPromptsFromSheet(): Promise<Prompt[]> {
  try {
    // Access sensitive keys directly from process.env, NOT NEXT_PUBLIC_
    const privateKey = getEnvVariable('GOOGLE_PRIVATE_KEY');
    const clientEmail = getEnvVariable('GOOGLE_CLIENT_EMAIL');
    // Public variables
    const spreadsheetId = getEnvVariable('GOOGLE_SPREADSHEET_ID', true);
    const sheetNameVar = process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME;
    // Ensure sheetName is a non-empty string, default to 'Sheet1'
    const sheetName = (sheetNameVar && sheetNameVar.trim() !== '') ? sheetNameVar.trim() : 'Sheet1';

    if (!sheetName) {
        // This case should technically not happen with the default, but good for robustness
        console.error("Error: Google Sheet name is effectively empty after trimming.");
        throw new Error("Configuration error: Google Sheet name is missing or invalid.");
    }


    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey, // Pass the processed key string
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch columns A, B, C, D from all rows in the specified sheet
    // A1 notation usually works without quotes for simple names like 'Sheet1'
    // If sheet names have spaces or special chars, they might need single quotes: `'My Sheet Name'!A:D`
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
        // Assign default category 'Uncategorized' if missing, empty, or only whitespace
        const category = (row[3] && String(row[3]).trim() !== '') ? String(row[3]).trim() : 'Uncategorized';

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
    // Check if the error seems related to authentication/parsing or range issues
    let hint = "Check server logs and configuration/permissions.";
    if (errorMessage.includes('PEM routines') || errorMessage.includes('bad base64 decode') || errorMessage.includes('DECODER routines') || errorMessage.includes('unsupported')) {
        hint = "There might be an issue with the GOOGLE_PRIVATE_KEY format in your environment variables. Ensure it's a single line string with literal '\\n' for newlines."
    } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        hint = "Check Google Sheet sharing settings and service account permissions (ensure the service account email has access)."
    } else if (errorMessage.includes('Requested entity was not found')) {
        hint = "Verify GOOGLE_SPREADSHEET_ID is correct and the spreadsheet exists."
    } else if (errorMessage.includes('Unable to parse range')) {
        // Use the sheetName variable used in the attempt
        const sheetNameAttempt = process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME || 'Sheet1';
        hint = `Verify that the sheet name "${sheetNameAttempt}" exists in spreadsheet ID "${process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID}" and that the environment variable NEXT_PUBLIC_GOOGLE_SHEET_NAME is set correctly if not using "Sheet1". Sheet names with spaces/special characters might need quotes in some contexts, but usually not here.`;
    }

    throw new Error(`Failed to fetch prompts from Google Sheets. ${errorMessage}. ${hint}`, { cause: err });
  }
}
