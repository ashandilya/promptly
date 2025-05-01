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
        if (promptsFromSheet.length > 0 && promptsFromSheet[0].id.startsWith('error-') || promptsFromSheet[0].id.startsWith('config-error-')) {
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
         <div className="text-center py-10 text-destructive bg-destructive/10 border border-destructive rounded-md p-4 mb-6">
           <p className="font-semibold">{errorTitle}</p>
           <p>{error}</p>
           {errorTitle === 'Configuration Error' && (
              <p className="text-sm mt-2">Make sure your <code className="bg-destructive/20 px-1 rounded">.env</code> file is correctly set up in the project root directory.</p>
           )}
           {errorTitle === 'Error Loading Prompts' && (
             <p className="text-sm mt-2">Please verify your Google Sheet ID, Sheet Name, and ensure the service account email has access to the sheet.</p>
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
                No prompts are currently available in the library, or the Google Sheet is empty/inaccessible.
             </p>
           )}
         </div>
       )}
    </main>
  );
}
