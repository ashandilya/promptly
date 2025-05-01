'use server';

/**
 * @fileOverview Server action to fetch marketing prompts from a Google Sheet.
 */

import { google } from 'googleapis';
import type { Prompt } from '@/types/prompt';

// Function to fetch prompts from Google Sheet - Runs on the server
export async function fetchPromptsFromSheet(): Promise<Prompt[]> {
  try {
    // Ensure environment variables are set
    // Note: Using NEXT_PUBLIC_ for server-side code is not ideal, but matches current setup.
    // Consider removing NEXT_PUBLIC_ prefix if these are only used server-side.
    const privateKey = process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL;
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME || 'Sheet1'; // Default to Sheet1 if not set
    const range = `${sheetName}!A:D`; // Assuming columns A-D: id, title, text, category

    if (!privateKey || !clientEmail || !spreadsheetId) {
      console.error('Google API credentials or Spreadsheet ID not found in environment variables.');
      // Return sample data or throw an error in production?
      // For now, returning sample error prompt.
       return [
         { id: 'sample-1', title: 'Sample: Configure Env Vars', text: 'Please configure GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, and GOOGLE_SPREADSHEET_ID in your environment variables.', category: 'Setup' },
       ];
       // Consider throwing an error instead:
       // throw new Error('Google API credentials or Spreadsheet ID not configured.');
    }


    const auth = new google.auth.GoogleAuth({
       credentials: {
         client_email: clientEmail,
         private_key: privateKey,
       },
       scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
     });


    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the Google Sheet.');
      return [];
    }

    // Assuming the first row might be headers, skip it
    const prompts = rows.slice(1).map((row, index): Prompt | null => {
       // Basic validation: Ensure essential columns exist
       if (row === null || row === undefined || row.length < 3 || !row[0] || !row[1] || !row[2]) {
           console.warn(`Skipping row ${index + 2}: Missing required data (ID, Title, or Text). Row data:`, row);
           return null; // Skip invalid rows
       }
       return {
         id: String(row[0]), // Ensure ID is a string
         title: String(row[1]),
         text: String(row[2]),
         category: row[3] ? String(row[3]) : undefined, // Category is optional
       };
     }).filter((prompt): prompt is Prompt => prompt !== null); // Filter out null values

    return prompts;
  } catch (err) {
    console.error('Error fetching data from Google Sheets:', err);
    // Provide fallback or error indication
    // Option 1: Return error prompt
    return [
       { id: 'error-1', title: 'Error Loading Prompts', text: 'Could not load prompts from Google Sheets. Please check server logs for details.', category: 'Error' },
    ];
    // Option 2: Rethrow the error to be caught by the caller
    // throw new Error('Failed to fetch prompts from Google Sheets.');
  }
}
