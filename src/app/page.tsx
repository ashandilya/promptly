'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { google } from 'googleapis';
import { Input } from '@/components/ui/input';
import { PromptCard } from '@/components/prompt-card';
import type { Prompt } from '@/types/prompt';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Function to fetch prompts from Google Sheet
async function fetchPromptsFromSheet(): Promise<Prompt[]> {
  try {
    // Ensure environment variables are set
    const privateKey = process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newline characters
    const clientEmail = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL;
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME || 'Sheet1'; // Default to Sheet1 if not set
    const range = `${sheetName}!A:D`; // Assuming columns A-D: id, title, text, category

    if (!privateKey || !clientEmail || !spreadsheetId) {
      console.error('Google API credentials or Spreadsheet ID not found in environment variables.');
      // Return sample data or throw an error in production?
      // For now, returning empty to avoid breaking the UI, but log the error.
       return [
         { id: 'sample-1', title: 'Sample: Configure Env Vars', text: 'Please configure NEXT_PUBLIC_GOOGLE_PRIVATE_KEY, NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL, and NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID in your .env.local file.', category: 'Setup' },
       ];
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
       if (!row[0] || !row[1] || !row[2]) {
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
    return [
       { id: 'error-1', title: 'Error Loading Prompts', text: 'Could not load prompts from Google Sheets. Please check the console for details.', category: 'Error' },
    ];
  }
}


export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Google Sheet on component mount
  useEffect(() => {
    async function loadPrompts() {
      setIsLoading(true);
      setError(null); // Reset error state
      try {
        const promptsFromSheet = await fetchPromptsFromSheet();
        setPrompts(promptsFromSheet);
      } catch (err) {
         console.error("Failed to load prompts:", err);
         setError("Failed to load prompts. Please try again later.");
         // Set empty prompts or keep previous state depending on desired UX
         setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPrompts();
  }, []);


  const filteredPrompts = useMemo(() => {
    if (!searchTerm) {
      return prompts;
    }
    return prompts.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, prompts]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">
          Promptly Marketing
        </h1>
        <p className="text-lg text-muted-foreground">
          Your Library of B2B Marketing Prompts
        </p>
      </header>

      <div className="mb-8 max-w-xl mx-auto relative">
         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search prompts by keyword or category..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-input focus:border-primary focus:ring-primary transition-colors"
          aria-label="Search prompts"
        />
      </div>

       {error && (
         <div className="text-center py-10 text-destructive">{error}</div>
       )}

      {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {Array.from({ length: 6 }).map((_, index) => (
               <Card key={index} className="flex flex-col h-full bg-card shadow-md rounded-lg overflow-hidden border border-border p-4 space-y-3">
                 <Skeleton className="h-5 w-3/4" />
                 <Skeleton className="h-4 w-1/4" />
                 <div className="space-y-2 flex-grow">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-5/6" />
                 </div>
                 <Skeleton className="h-9 w-full" />
               </Card>
             ))}
           </div>
       ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.length > 0 ? (
            filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))
          ) : (
            <p className="text-center col-span-full text-muted-foreground">
              {prompts.length === 0 ? "No prompts available." : "No prompts found matching your search."}
            </p>
          )}
        </div>
       )}
    </main>
  );
}

// Need a dummy Card component for Skeleton loading state if not imported elsewhere
const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={className}>{children}</div>
);
