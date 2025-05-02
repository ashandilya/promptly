
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PromptCard } from '@/components/prompt-card';
// Remove the direct import of Prompt type from @/types/prompt
// import type { Prompt } from '@/types/prompt';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import Masonry from 'react-masonry-css'; // Ensure this import is correct
import { SparklingStarfield } from '@/components/sparkling-starfield';
import Link from 'next/link';
import { fetchPromptsFromSheet } from '@/lib/sheets'; // Import fetch function
import type { Prompt } from '@/types/prompt'; // Import Prompt type


// Masonry responsive breakpoints
const breakpointColumnsObj = {
  default: 3,
  1100: 2,
  700: 1
};


export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrompts = async () => {
      setIsLoading(true);
      setError(null);
      console.log("Initiating prompt loading...");
      try {
        const fetchedPrompts = await fetchPromptsFromSheet();
        if (fetchedPrompts.length === 0 && !error) { // Check !error to avoid overwriting fetch error
          console.warn("No prompts fetched from Google Sheets or sheet is empty.");
          // Keep the UI consistent, show "No prompts available" message later if needed
          // setError("No prompts found in the connected Google Sheet."); // Optional: specific message for empty sheet
        }
        console.log(`Successfully fetched ${fetchedPrompts.length} prompts from Google Sheets.`);
        setPrompts(fetchedPrompts);

      } catch (err: any) {
        console.error('Error fetching prompts from Google Sheets:', err);
        // Use the more detailed error message thrown by fetchPromptsFromSheet
        const errorMessage = err.message || 'An unknown error occurred';
        setError(errorMessage); // Set the full error message from sheets.ts
        setPrompts([]); // Clear prompts on error
      } finally {
        setIsLoading(false);
        console.log("Prompt loading finished.");
      }
    };

    loadPrompts();
  }, []); // Empty dependency array means this runs once on mount

 const categories = useMemo(() => {
    // Derive categories from the currently loaded prompts
    const uniqueCategories = new Set<string>(
      prompts.map(p => p.category).filter((c): c is string => !!c && c !== 'Uncategorized') // Filter out empty/null/default categories
    );
    const sortedCategories = ['all', ...Array.from(uniqueCategories).sort()];
     // Only add 'Uncategorized' if there are actually uncategorized prompts and it's not already included
     if (prompts.some(p => p.category === 'Uncategorized') && !uniqueCategories.has('Uncategorized')) {
       sortedCategories.push('Uncategorized');
     }
    return sortedCategories;
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      if (!prompt) return false; // Skip if prompt is somehow null/undefined

      const lowerSearchTerm = searchTerm.toLowerCase();
      const titleMatch = prompt.title?.toLowerCase().includes(lowerSearchTerm) ?? false;
      const textMatch = prompt.text?.toLowerCase().includes(lowerSearchTerm) ?? false;
      const categoryMatch = prompt.category?.toLowerCase().includes(lowerSearchTerm) ?? false; // Search in category too

      const matchesSearch = titleMatch || textMatch || categoryMatch;

      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchTerm, selectedCategory]);


  return (
    <main className="container mx-auto px-4 py-8 relative min-h-screen">
       {/* Sparkling Starfield background */}
      <SparklingStarfield className="absolute inset-0 -z-10" />

      <div className="relative z-10"> {/* Content wrapper */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">Promptly</h1>
            <p className="text-lg text-muted-foreground">
              Your Library for B2B Marketing Prompts
            </p>
          </header>

          {/* Display error message if there's an error */}
          {error && ( // Show error always if it exists
              <Alert variant="destructive" className="mb-6 bg-card border-destructive text-destructive-foreground">
                <Terminal className="h-4 w-4 text-destructive-foreground" />
                <AlertTitle>Error Loading Prompts</AlertTitle>
                <AlertDescription>
                  {/* Display the potentially more detailed error message */}
                  <p>{error}</p>
                  <p className="mt-2 text-sm">
                     Please check the console logs for more technical details. If the problem persists, verify your Google Sheets setup (ID, Sheet Name, Permissions, API Key format) and environment variables.
                  </p>
                </AlertDescription>
              </Alert>
          )}

           {/* Added link above search */}
           <p className="text-center text-sm text-muted-foreground mb-4">
            Know the person behind this?{' '}
            <Link
              href="https://www.linkedin.com/in/ashandilya64/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-accent"
            >
              Connect on LinkedIn
            </Link>
          </p>

          {/* Search and Filter controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Search prompts by title, text, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow bg-card border-border focus:ring-ring"
              aria-label="Search prompts"
              disabled={isLoading} // Disable only while loading initially
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              aria-label="Filter by category"
              disabled={isLoading || categories.length <= 1} // Disable if loading or no categories
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-card border-border focus:ring-ring">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                 {/* Show loading/empty state inside SelectContent if needed */}
                 {isLoading && categories.length <= 1 ? (
                    <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                 ) : categories.length <= 1 ? (
                     <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                 ): (
                    categories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize cursor-pointer focus:bg-accent focus:text-accent-foreground">
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))
                 )}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional rendering based on loading state and data availability */}
          {isLoading ? (
            // Show a simple loading message
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Loading prompts from Google Sheets...</p>
              {/* Optional: Add a spinner here */}
            </div>
          ) : !error && filteredPrompts.length === 0 ? ( // Check !error here
             // Show message if no prompts match filters OR if initial load was successful but yielded 0 prompts
            <div className="text-center py-12 text-muted-foreground bg-card/80 rounded p-4 shadow">
              <p className="text-lg font-medium">
                {prompts.length === 0
                  ? "No prompts available. Check the Google Sheet, its content, and configuration." // If initial load resulted in zero prompts (and no error)
                  : "No prompts match your search or filter."}
              </p>
              {prompts.length > 0 && <p className="text-sm mt-1">Try adjusting your search term or category filter.</p>}
            </div>
          ) : !error && filteredPrompts.length > 0 ? ( // Only render Masonry if no error and prompts exist
             // Display prompts using Masonry layout
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex w-auto -ml-4" // Adjust negative margin to counteract padding on items
                columnClassName="pl-4 bg-clip-padding" // Add padding to columns
              >
               {filteredPrompts.map((prompt) => (
                 // Add margin-bottom to each card for vertical spacing within columns
                 <PromptCard key={prompt.id} prompt={prompt} className="mb-4" />
               ))}
              </Masonry>
          ) : null /* Error handled by the Alert, so render nothing here if error exists */ }
      </div>
    </main>
  );
}
