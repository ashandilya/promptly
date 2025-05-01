'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { PromptCard } from '@/components/prompt-card';
import type { Prompt } from '@/types/prompt';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card'; // Import Card from shadcn
import { fetchPromptsFromSheet } from '@/actions/fetch-prompts'; // Import the Server Action

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>('Error Loading Prompts'); // Add state for error title

  // Fetch data using the Server Action on component mount
  useEffect(() => {
    async function loadPrompts() {
      setIsLoading(true);
      setError(null); // Reset error state
      setErrorTitle('Error Loading Prompts'); // Reset error title
      try {
        // Call the server action - this executes on the server
        const promptsFromSheet = await fetchPromptsFromSheet();

        // Check if the returned data indicates a specific error configured in the action
        if (promptsFromSheet.length > 0 && (promptsFromSheet[0].id.startsWith('error-') || promptsFromSheet[0].id.startsWith('config-error-') || promptsFromSheet[0].id.startsWith('fetch-error-'))) {
          setErrorTitle(promptsFromSheet[0].title || 'Error');
          setError(promptsFromSheet[0].text);
          setPrompts([]); // Set empty prompts on error
        } else {
          setPrompts(promptsFromSheet);
        }
      } catch (err: any) {
         console.error("Failed to load prompts via server action:", err);
         // Display a generic error message if the action throws an unexpected error
         setErrorTitle("Unexpected Error");
         setError(err.message || "Failed to load prompts. Please try again later.");
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

  // Helper function to render multiline error messages
  const renderErrorMessage = (message: string | null) => {
    if (!message) return null;
    // Split by newline characters to render them as <br /> tags
    return message.split('\n').map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
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

       {/* Display error message if fetch failed */}
       {error && !isLoading && (
         <div className="text-left py-4 px-6 text-destructive bg-destructive/10 border border-destructive rounded-md mb-6">
           <p className="font-semibold text-lg mb-2">{errorTitle}</p>
           {/* Use pre-wrap to preserve newlines and formatting from the error message */}
           <p className="text-sm whitespace-pre-wrap">{renderErrorMessage(error)}</p>
           {/* Specific guidance based on error title */}
           {errorTitle === 'Configuration Error' && (
              <p className="text-sm mt-2">Make sure your <code className="bg-destructive/20 px-1 rounded">.env</code> file is correctly set up in the project root directory with all required variables (NEXT_PUBLIC_GOOGLE_PRIVATE_KEY, NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL, NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID).</p>
           )}
           {errorTitle === 'Authentication Error' && (
              <div className="text-sm mt-2 space-y-1">
                <p>This usually means the <code className="bg-destructive/20 px-1 rounded">NEXT_PUBLIC_GOOGLE_PRIVATE_KEY</code> in your <code className="bg-destructive/20 px-1 rounded">.env</code> file is formatted incorrectly.</p>
                <p><strong>Important:</strong></p>
                <ul className="list-disc list-inside pl-4">
                    <li>The entire key, including <code className="bg-destructive/20 px-1 rounded">-----BEGIN PRIVATE KEY-----</code> and <code className="bg-destructive/20 px-1 rounded">-----END PRIVATE KEY-----</code>, must be enclosed in <strong className="font-semibold">double quotes</strong> (`"`).</li>
                    <li>The newline characters within the key <strong className="font-semibold">must be represented as literal `\n` characters</strong>, exactly as copied from the Google Cloud JSON key file.</li>
                </ul>
                <p className="mt-1">Example format in <code className="bg-destructive/20 px-1 rounded">.env</code>:</p>
                <pre className="bg-destructive/20 p-2 rounded text-xs overflow-x-auto"><code>{`NEXT_PUBLIC_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_LINES_HERE\\nMORE_KEY_LINES_HERE\\n-----END PRIVATE KEY-----\\n"`}</code></pre>
                <p>Please double-check your <code className="bg-destructive/20 px-1 rounded">.env</code> file, save it, and restart the development server (`npm run dev`).</p>
              </div>
           )}
           {errorTitle === 'Permission Denied' && (
             <p className="text-sm mt-2">Ensure the Google Service Account email listed in the error message has been shared with your Google Sheet with at least 'Viewer' permissions.</p>
           )}
            {errorTitle === 'Spreadsheet Not Found' && (
             <p className="text-sm mt-2">Verify that the `NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID` in your `.env` file is correct.</p>
           )}
           {errorTitle === 'Error Loading Prompts' && !error.includes('PEM_read_bio_PrivateKey') && !error.includes('PERMISSION_DENIED') && !error.includes('Requested entity was not found') && (
             <p className="text-sm mt-2">Please verify your Google Sheet ID, Sheet Name in `.env`, and ensure the service account email has access to the sheet.</p>
           )}
         </div>
       )}

      {isLoading ? (
          // Skeleton Loading State
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
         // Display Prompts or No Results Message
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredPrompts.length > 0 ? (
             filteredPrompts.map((prompt) => (
               <PromptCard key={prompt.id} prompt={prompt} />
             ))
           ) : (
             // Only show "No prompts found matching search" if there wasn't an error and the initial list isn't empty (meaning search yielded no results)
             !error && prompts.length > 0 && searchTerm && (
                <p className="text-center col-span-full text-muted-foreground py-10">
                  No prompts found matching your search criteria.
                </p>
             )
           )}
           {/* Message shown if initial fetch yielded no prompts (and no error) */}
           {!isLoading && !error && prompts.length === 0 && (
             <p className="text-center col-span-full text-muted-foreground py-10">
                No prompts are currently available in the library, or the Google Sheet is empty/inaccessible. Check sheet permissions and `.env` configuration if this persists.
             </p>
           )}
         </div>
       )}
    </main>
  );
}
