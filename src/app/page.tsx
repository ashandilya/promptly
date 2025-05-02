
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchPromptsFromSheet } from '@/actions/fetch-prompts';
import { PromptCard } from '@/components/prompt-card';
import type { Prompt } from '@/types/prompt';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { Terminal } from 'lucide-react'; // Import Terminal icon

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null); // State for error message

  useEffect(() => {
    async function loadPrompts() {
      try {
        setIsLoading(true);
        setError(null); // Clear previous errors
        console.log("Initiating prompt fetch from client...");
        const fetchedPrompts = await fetchPromptsFromSheet();
        console.log("Prompt fetch attempt completed on client. Result count:", fetchedPrompts.length);

        // Check if the fetched data indicates an error (action returns specific error format)
        const fetchError = fetchedPrompts.find(p => p.id.startsWith('fetch-error-') || p.id.startsWith('config-error-'));
        if (fetchError) {
           // Use the detailed error message provided by the server action
           setError(`${fetchError.title}: ${fetchError.text}`);
           setPrompts([]); // Clear prompts on error
           console.error("Error received from fetchPromptsFromSheet action:", fetchError.text);
        } else {
          setPrompts(fetchedPrompts);
          if (fetchedPrompts.length === 0) {
             console.log("Successfully fetched prompts, but the list is empty (or only headers were found in the sheet).");
           } else {
             console.log(`Successfully fetched and processed ${fetchedPrompts.length} prompts.`);
           }
        }
      } catch (err: any) {
        // Catch unexpected errors *within this client-side component* or errors re-thrown by the action
        console.error('Unexpected error in Home component during prompt loading:', err);
        setError(`An unexpected client-side error occurred while loading prompts: ${err.message || 'Unknown error'}. Check browser console and server logs.`);
        setPrompts([]); // Clear prompts on error
      } finally {
        setIsLoading(false);
      }
    }

    loadPrompts();
  }, []); // Empty dependency array ensures this runs once on mount

  const categories = useMemo(() => {
    // Filter out error prompts before generating categories
    const validPrompts = prompts.filter(p => !p.id.startsWith('fetch-error-') && !p.id.startsWith('config-error-'));
    const uniqueCategories = new Set<string>();
    validPrompts.forEach(prompt => {
      if (prompt.category) {
        uniqueCategories.add(prompt.category);
      }
    });
    return ['all', ...Array.from(uniqueCategories)];
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
     // Ensure error prompts are not displayed in the main list
    return prompts.filter(prompt => {
       if (prompt.id.startsWith('fetch-error-') || prompt.id.startsWith('config-error-')) {
         return false; // Exclude error prompts from filtering/display
       }
      const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            prompt.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchTerm, selectedCategory]);

  // Function to render skeleton loaders
  const renderSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
       <div key={`skeleton-${index}`} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card shadow">
         <Skeleton className="h-6 w-3/4 rounded" /> {/* Title skeleton */}
         <Skeleton className="h-4 w-1/4 rounded" /> {/* Category badge skeleton */}
         <div className="space-y-2 mt-2 flex-grow">
           <Skeleton className="h-4 w-full rounded" />
           <Skeleton className="h-4 w-5/6 rounded" />
           <Skeleton className="h-4 w-1/2 rounded" />
         </div>
         <Skeleton className="h-9 w-full rounded mt-4" /> {/* Button skeleton */}
       </div>
     ));
  };


  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Promptly</h1>
        <p className="text-lg text-muted-foreground">
          Your Library for B2B Marketing Prompts
        </p>
      </header>

      {/* Error Display Area */}
      {error && (
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            {/* Extract title from the error message if possible */}
            <AlertTitle>{error.split(':')[0] || 'Error Loading Prompts'}</AlertTitle>
            <AlertDescription>
               {/* Display the detailed error message */}
               <pre className="whitespace-pre-wrap break-words text-sm font-mono">{error}</pre>
               <p className="mt-2 text-sm">Please check your Google Sheet configuration and server environment variables. Refer to the server logs (if available) for more detailed technical information.</p>
             </AlertDescription>
          </Alert>
       )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow bg-card border-border focus:ring-ring"
          aria-label="Search prompts"
          disabled={isLoading || !!error} // Disable search if loading or error
        />
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          aria-label="Filter by category"
          disabled={isLoading || !!error || categories.length <= 1} // Disable select if loading, error, or no categories
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border focus:ring-ring">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
             {/* Only show categories if there are any */}
            {categories.length > 1 ? categories.map((category) => (
              <SelectItem key={category} value={category} className="capitalize cursor-pointer focus:bg-accent focus:text-accent-foreground">
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
             )) : (
               <SelectItem value="all" disabled>No categories found</SelectItem>
             )}
          </SelectContent>
        </Select>
      </div>

       {isLoading ? (
         // Show skeleton loaders while loading
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {renderSkeletons(6)}
         </div>
       ) : !error && filteredPrompts.length === 0 ? (
         // Show "No prompts found" message only if not loading, no error, and filtering resulted in empty
         <div className="text-center py-12 text-muted-foreground">
           <p>
             {prompts.length === 0
               ? "No prompts were found in the connected Google Sheet."
               : "No prompts found matching your current search or filter."}
           </p>
            {prompts.length > 0 && <p>Try adjusting your search term or category filter.</p>}
         </div>
       ) : !error ? (
         // Display prompts grid if not loading, no error, and prompts exist
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredPrompts.map((prompt) => (
             <PromptCard key={prompt.id} prompt={prompt} />
           ))}
         </div>
       ) : null /* Error case is handled by the Alert component above */ }
    </main>
  );
}
