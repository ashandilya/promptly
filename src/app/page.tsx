'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
// Skeleton import removed as it's not used in the loading state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
// Removed Masonry import as the package is causing issues and will be replaced with CSS grid
import { SparklingStarfield } from '@/components/sparkling-starfield';


// Sample prompts for local testing/fallback
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    console.log("Loading prompts from local data...");

    // Simulate loading delay
    const timer = setTimeout(() => {
      try {
        // Using sample prompts as fallback/initial state
        setPrompts(samplePrompts);
        console.log(`Loaded ${samplePrompts.length} sample prompts.`);
      } catch (err: any) {
        console.error('Error setting sample prompts:', err);
        setError(`Failed to load sample prompts: ${err.message}`);
        setPrompts([]); // Clear prompts on error
      } finally {
        setIsLoading(false);
      }
    }, 500); // 0.5 second delay

    // Cleanup function to clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount

  const categories = useMemo(() => {
    // Create a set of unique categories from the prompts
    const uniqueCategories = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.category) { // Check if category exists
        uniqueCategories.add(prompt.category);
      }
    });
    // Return an array with 'all' followed by the unique categories
    return ['all', ...Array.from(uniqueCategories)];
  }, [prompts]); // Recalculate when prompts change

  const filteredPrompts = useMemo(() => {
    // Filter prompts based on search term and selected category
    return prompts.filter(prompt => {
      const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            prompt.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchTerm, selectedCategory]); // Recalculate when these change


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
          {error && (
              <Alert variant="destructive" className="mb-6 bg-card border-destructive text-destructive-foreground">
                <Terminal className="h-4 w-4 text-destructive-foreground" />
                <AlertTitle>Error Loading Prompts</AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                  <p className="mt-2 text-sm">
                     Please check the console for more details or try refreshing the page. Using fallback data for now.
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
              disabled={isLoading && !error} // Disable while loading only if no error
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              aria-label="Filter by category"
              disabled={(isLoading && !error) || categories.length <= 1} // Disable if loading, no error, or only 'all' category
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-card border-border focus:ring-ring">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {categories.length > 1 ? categories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                )) : (
                   <SelectItem value="all" disabled>
                    {isLoading ? "Loading categories..." : "No categories"}
                   </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional rendering based on loading state and data availability */}
          {isLoading ? (
            // Show a simple loading message
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Loading prompts...</p>
            </div>
          ) : !error && filteredPrompts.length === 0 ? (
             // Show message if no prompts match filters (and no error)
            <div className="text-center py-12 text-muted-foreground bg-card/80 rounded p-4 shadow">
              <p className="text-lg font-medium">
                {prompts.length === 0
                  ? "No prompts available." // If initial load resulted in zero prompts
                  : "No prompts match your search."}
              </p>
              {prompts.length > 0 && <p className="text-sm mt-1">Try adjusting your search term or category filter.</p>}
            </div>
          ) : !error ? (
             // Display prompts using CSS Grid layout (replaces Masonry)
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredPrompts.map((prompt) => (
                 <PromptCard key={prompt.id} prompt={prompt} />
               ))}
             </div>
          ) : null /* Don't render anything if there's an error (handled by the Alert) */ }
      </div>
    </main>
  );
}
