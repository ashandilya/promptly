'use server';

import { google } from 'googleapis';
import type { Prompt } from '@/types/prompt';

// Function to safely get environment variables
function getEnvVariable(key: string, isPublic: boolean = false): string {
  const envVarKey = isPublic ? `NEXT_PUBLIC_${key}` : key;
  const value = process.env[envVarKey];
  if (!value) {
    console.error(`Error: Environment variable ${envVarKey} is not set.`);
    throw new Error(`Missing required environment variable: ${envVarKey}`);
  }
  return value;
}

// Function to parse the private key, handling escaped newlines
function parsePrivateKey(key: string): string {
  try {
    // Replace literal \n with actual newline characters
    return key.replace(/\\n/g, '\n');
  } catch (error) {
    console.error('Error parsing private key:', error);
    throw new Error('Invalid private key format.');
  }
}

export async function fetchPromptsFromSheet(): Promise<Prompt[]> {
  try {
    // Access sensitive keys directly from process.env, NOT NEXT_PUBLIC_
    const privateKey = parsePrivateKey(getEnvVariable('GOOGLE_PRIVATE_KEY'));
    const clientEmail = getEnvVariable('GOOGLE_CLIENT_EMAIL');
    // Public variables can keep the prefix if needed elsewhere client-side, but usually not necessary for spreadsheet ID/name
    const spreadsheetId = getEnvVariable('GOOGLE_SPREADSHEET_ID', true); // Keep public if needed client-side for some reason
    const sheetName = getEnvVariable('GOOGLE_SHEET_NAME', true) || 'Sheet1'; // Default to Sheet1

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
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
    // Ensure the actual sensitive error message isn't exposed if this runs client-side (which it shouldn't now)
    const errorMessage = (err instanceof Error) ? err.message : 'Unknown error';
    throw new Error(`Failed to fetch prompts from Google Sheets. ${errorMessage}. Check server logs and configuration/permissions.`, { cause: err });
  }
}
