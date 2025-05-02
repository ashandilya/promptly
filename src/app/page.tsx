'use client';

import React, { useState, useEffect, useMemo } from 'react';
// Removed fetchPromptsFromSheet import
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

// Reintroduce sample prompts for local testing/fallback
const samplePrompts: Prompt[] = [
  { id: '1', title: 'Generate Blog Post Ideas', text: 'Brainstorm 10 blog post titles about [topic] targeting [audience].', category: 'Content Creation' },
  { id: '2', title: 'Write Email Subject Lines', text: 'Create 5 compelling email subject lines for a webinar about [webinar topic].', category: 'Email Marketing' },
  { id: '3', title: 'Social Media Ad Copy', text: 'Write 3 variations of ad copy for a Facebook campaign promoting [product/service] to [target demographic]. Focus on [key benefit].', category: 'Social Media' },
  { id: '4', title: 'SEO Keyword Research', text: 'List 15 long-tail keywords related to [core keyword] for a B2B SaaS company.', category: 'SEO' },
  { id: '5', title: 'Develop Buyer Persona', text: 'Outline a buyer persona for a [job title] at a [company size] company in the [industry] industry. Include pain points and goals.', category: 'Strategy' },
  { id: '6', title: 'Competitor Analysis', text: 'Identify 3 key competitors for [your company/product] and summarize their main marketing strategies.', category: 'Strategy' },
  { id: '7', title: 'Value Proposition Statement', text: 'Draft a value proposition statement for [product/service] that highlights its unique benefit for [target customer].', category: 'Messaging' },
  { id: '8', title: 'Website Call-to-Action', text: 'Suggest 3 clear and concise call-to-action (CTA) buttons for a landing page offering a [type of offer, e.g., free demo].', category: 'Website' },
];


export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null); // State to hold the error message string

  useEffect(() => {
    // Simulate loading and set prompts from local data
    setIsLoading(true);
    setError(null);
    console.log("Loading prompts from local data...");

    // Simulate a short delay to show loading state
    const timer = setTimeout(() => {
      try {
        // Use sample prompts instead of fetching
        setPrompts(samplePrompts);
        console.log(`Loaded ${samplePrompts.length} sample prompts.`);
      } catch (err: any) {
        console.error('Error setting sample prompts:', err);
        setError(`Failed to load sample prompts: ${err.message}`);
        setPrompts([]);
      } finally {
        setIsLoading(false); // Turn off loading state
      }
    }, 500); // Adjust delay as needed (e.g., 500ms)

    // Cleanup timer on unmount
    return () => clearTimeout(timer);

  }, []); // Empty dependency array ensures this runs once on mount

  // Memoized list of unique categories derived from valid prompts
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.category) {
        uniqueCategories.add(prompt.category);
      }
    });
    return ['all', ...Array.from(uniqueCategories)];
  }, [prompts]);

  // Memoized list of prompts filtered by search term and category
  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
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
                    Please check the console for more details.
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
                  ? "No prompts available." // Updated message for local data
                  : "No prompts match your search."}
              </p>
              {prompts.length > 0 && <p className="text-sm mt-1">Try adjusting your search term or category filter.</p>}
            </div>
          ) : !error ? (
            // Display prompts using Masonry layout if no error and prompts exist
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-4" // "my-masonry-grid"
              columnClassName="pl-4 bg-clip-padding" // "my-masonry-grid_column"
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
