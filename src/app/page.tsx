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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import Masonry from 'react-masonry-css'; // Import Masonry
import { SparklingStarfield } from '@/components/sparkling-starfield'; // Import Starfield

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null); // State to hold the error message string

  useEffect(() => {
    async function loadPrompts() {
      try {
        setIsLoading(true);
        setError(null); // Clear previous errors
        console.log("Initiating prompt fetch from client...");
        const fetchedPrompts = await fetchPromptsFromSheet();
        console.log("Prompt fetch attempt completed on client. Result count:", fetchedPrompts.length);

        // Check if the fetched data contains an error object from the server action
        const fetchError = fetchedPrompts.find(p =>
            p.id.startsWith('fetch-error-') ||
            p.id.startsWith('config-error-')
        );

        if (fetchError) {
          // Format the error message for display
          const errorMessage = `${fetchError.title}: ${fetchError.text}`;
          setError(errorMessage); // Set the error state string
          setPrompts([]); // Clear prompts on error
          console.error("Error received from fetchPromptsFromSheet action:", errorMessage);
        } else {
          setPrompts(fetchedPrompts);
          if (fetchedPrompts.length === 0) {
             console.log("Successfully fetched prompts, but the list is empty (or only headers were found in the sheet).");
           } else {
             console.log(`Successfully fetched and processed ${fetchedPrompts.length} prompts.`);
           }
        }
      } catch (err: any) {
        // Catch unexpected client-side errors during the fetch process
        console.error('Unexpected error in Home component during prompt loading:', err);
        const clientErrorMessage = `An unexpected client-side error occurred while loading prompts: ${err.message || 'Unknown error'}. Check browser console and server logs for details.`;
        setError(clientErrorMessage);
        setPrompts([]); // Clear prompts on error
      } finally {
        setIsLoading(false); // Ensure loading state is turned off
      }
    }

    loadPrompts();
  }, []); // Empty dependency array ensures this runs once on mount

  // Memoized list of unique categories derived from valid prompts
  const categories = useMemo(() => {
    // Filter out any potential error objects before calculating categories
    const validPrompts = prompts.filter(p => !p.id.startsWith('fetch-error-') && !p.id.startsWith('config-error-'));
    const uniqueCategories = new Set<string>();
    validPrompts.forEach(prompt => {
      if (prompt.category) {
        uniqueCategories.add(prompt.category);
      }
    });
    return ['all', ...Array.from(uniqueCategories)];
  }, [prompts]);

  // Memoized list of prompts filtered by search term and category
  const filteredPrompts = useMemo(() => {
    // Ensure we only filter valid prompts, not error objects
    return prompts.filter(prompt => {
       if (prompt.id.startsWith('fetch-error-') || prompt.id.startsWith('config-error-')) {
         return false; // Exclude error objects from the filtered list
       }
      // Case-insensitive search matching title or text
      const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            prompt.text.toLowerCase().includes(searchTerm.toLowerCase());
      // Category matching (allow 'all' or specific category)
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchTerm, selectedCategory]);

  // Breakpoint configuration for the Masonry layout
  const breakpointColumnsObj = {
    default: 3, // Default: 3 columns
    1100: 2,   // >= 1100px: 2 columns
    700: 1     // >= 700px: 1 column
  };

  // Function to render skeleton loaders for the initial loading state
  const renderSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
       <div key={`skeleton-${index}`} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card shadow mb-4"> {/* Added mb-4 for spacing */}
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
    <main className="container mx-auto px-4 py-8 relative min-h-screen">
       {/* Sparkling Starfield background */}
      <SparklingStarfield className="absolute inset-0 -z-10" />

      <div className="relative z-10"> {/* Content wrapper to ensure it's above the starfield */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">Promptly</h1> {/* Use primary color (red) */}
            <p className="text-lg text-muted-foreground">
              Your Library for B2B Marketing Prompts
            </p>
          </header>

          {/* Display error alert if an error occurred */}
          {error && (
              <Alert variant="destructive" className="mb-6 bg-card border-destructive text-destructive-foreground"> {/* Ensure alert stands out */}
                <Terminal className="h-4 w-4 text-destructive-foreground" /> {/* Icon color */}
                <AlertTitle>{error.split(':')[0] || 'Error Loading Prompts'}</AlertTitle>
                <AlertDescription>
                  {/* Use pre-wrap for better formatting of error messages */}
                  <pre className="whitespace-pre-wrap break-words text-sm font-mono">{error}</pre>
                  <p className="mt-2 text-sm">
                    Please check your configuration (Google Sheet access, environment variables) and network connection. Refer to the server logs (if available) or browser console for more technical details.
                  </p>
                </AlertDescription>
              </Alert>
          )}

          {/* Search and Filter controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow bg-card border-border focus:ring-ring"
              aria-label="Search prompts"
              disabled={isLoading || !!error} // Disable if loading or error occurred
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              aria-label="Filter by category"
              disabled={isLoading || !!error || categories.length <= 1} // Disable if loading, error, or no categories
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-card border-border focus:ring-ring">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {/* Populate categories dynamically, handle empty state */}
                {categories.length > 1 ? categories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                )) : (
                  <SelectItem value="all" disabled>
                    {isLoading ? "Loading..." : "No categories"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional rendering based on loading state and errors */}
          {isLoading ? (
            // Show skeletons while loading
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {renderSkeletons(6)}
            </Masonry>
          ) : !error && filteredPrompts.length === 0 ? (
             // Show message if no prompts match filters (and no error)
            <div className="text-center py-12 text-muted-foreground bg-card/80 rounded p-4 shadow"> {/* Add subtle background/shadow */}
              <p className="text-lg font-medium">
                {prompts.length === 0
                  ? "No prompts found in the Google Sheet."
                  : "No prompts match your search."}
              </p>
              {prompts.length > 0 && <p className="text-sm mt-1">Try adjusting your search term or category filter.</p>}
            </div>
          ) : !error ? (
            // Display prompts using Masonry layout if no error and prompts exist
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} className="mb-4" /> {/* Add margin between cards */}
              ))}
            </Masonry>
          ) : null /* Don't render prompts if there was an error */}
      </div>
    </main>
  );
}
