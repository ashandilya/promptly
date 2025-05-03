

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PromptCard } from '@/components/prompt-card';
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
// Removed Masonry import as it's not installed/used
import { SparklingStarfield } from '@/components/sparkling-starfield';
import Link from 'next/link';
// Removed Google Sheets import as data source is now local JSON
import type { Prompt } from '@/types/prompt';
import promptsData from '@/data/promptly-marketing.json'; // Import data from JSON file


export default function Home() {
  // Initialize state with data from the imported JSON file
  // Ensure promptsData is an array, default to empty array if not
  const [prompts, setPrompts] = useState<Prompt[]>(Array.isArray(promptsData) ? promptsData : []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

 // Log initial data
  useEffect(() => {
    console.log("Initial prompts data:", prompts);
    if (!Array.isArray(promptsData)) {
      console.error("Error: promptsData from JSON is not an array:", promptsData);
    }
  }, []); // Run only once on mount


 const categories = useMemo(() => {
    // Derive categories from the locally stored prompts
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
     console.log("Filtering prompts with searchTerm:", searchTerm, "and selectedCategory:", selectedCategory);
     const results = prompts.filter(prompt => {
      if (!prompt || typeof prompt !== 'object') {
         console.warn("Skipping invalid prompt entry:", prompt);
         return false; // Skip if prompt is somehow null/undefined/not an object
      }

      // Ensure prompt properties exist and are strings before calling toLowerCase
      // Use empty string as fallback to avoid errors with null/undefined
      const lowerSearchTerm = searchTerm.toLowerCase();
      const title = (prompt.title ?? '').toLowerCase();
      const text = (prompt.text ?? '').toLowerCase();
      const category = (prompt.category ?? '').toLowerCase(); // Use safe category access

      const titleMatch = title.includes(lowerSearchTerm);
      const textMatch = text.includes(lowerSearchTerm);
      const categoryMatch = category.includes(lowerSearchTerm); // Search in category too

      const matchesSearch = titleMatch || textMatch || categoryMatch;

       // Use safe category access for filtering as well
      const currentCategory = prompt.category ?? '';
      const matchesCategory = selectedCategory === 'all' || currentCategory === selectedCategory;


      return matchesSearch && matchesCategory;
    });
    console.log("Filtered prompts:", results.length, results); // Log filtered results too
    return results;
  }, [prompts, searchTerm, selectedCategory]);


  return (
    <main className="container mx-auto px-4 py-8 relative min-h-screen">
       {/* Sparkling Starfield background */}
      <SparklingStarfield className="absolute inset-0 -z-10" />

      <div className="relative z-10"> {/* Content wrapper */}
          <header className="mb-8 text-center">
             {/* Use text-foreground (theme's main text color) for title */}
            <h1 className="text-4xl font-bold text-foreground mb-2">Promptly</h1>
            <p className="text-lg text-muted-foreground">
              Your Library for B2B Marketing Prompts
            </p>
          </header>

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
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              aria-label="Filter by category"
              disabled={categories.length <= 1} // Disable if no categories (besides 'all')
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-card border-border focus:ring-ring">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                 {/* Simplified category loading - no loading state needed */}
                 {categories.length <= 1 ? (
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

          {/* Conditional rendering based on data availability */}
           {prompts.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground bg-card/80 rounded p-4 shadow">
               <p className="text-lg font-medium">
                 Loading prompts or no prompts available in the local data file.
               </p>
               <p className="text-sm mt-1">Please ensure `src/data/promptly-marketing.json` exists and contains valid prompt data.</p>
             </div>
           ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card/80 rounded p-4 shadow">
              <p className="text-lg font-medium">
                No prompts match your search or filter.
              </p>
              <p className="text-sm mt-1">Try adjusting your search term or category filter.</p>
            </div>
          ) : (
             // Display prompts using a simple responsive grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredPrompts.map((prompt) => (
                 // Check for basic prompt validity (id, title, text) before rendering the card
                 (prompt && prompt.id && prompt.title && prompt.text) ? (
                    <PromptCard key={prompt.id} prompt={prompt} /> // Removed className mb-4 as grid gap handles spacing
                 ) : (
                   // Render a placeholder or error message for invalid prompts
                   <div key={prompt?.id || Math.random()} className="p-4 bg-destructive/20 rounded border border-destructive text-destructive-foreground">
                      <p className="font-medium">Invalid Prompt Data</p>
                      <p className="text-xs">ID: {prompt?.id || 'N/A'}. Missing title or text.</p>
                   </div>
                 )
               ))}
              </div>
          )}
      </div>
    </main>
  );
}
