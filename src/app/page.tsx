
'use client';

import React, { useState, useMemo } from 'react';
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
import Masonry from 'react-masonry-css'; // Ensure this import is correct
import { SparklingStarfield } from '@/components/sparkling-starfield';
import Link from 'next/link';
// import { fetchPromptsFromSheet } from '@/lib/sheets'; // Removed Google Sheets import
import type { Prompt } from '@/types/prompt'; // Import Prompt type


// Sample prompts data stored locally
const samplePrompts: Prompt[] = [
  { id: '1', title: 'Blog Post Idea Generator', text: 'Generate 5 blog post ideas about [topic].', category: 'Content Creation' },
  { id: '2', title: 'Email Subject Line', text: 'Write 3 catchy email subject lines for a product launch announcement.', category: 'Email Marketing' },
  { id: '3', title: 'Social Media Ad Copy', text: 'Create short ad copy (under 150 characters) for a Facebook campaign targeting [audience] about [product/service].', category: 'Social Media' },
  { id: '4', title: 'Value Proposition Refiner', text: 'Refine this value proposition to be more concise and impactful: [Your Value Proposition]', category: 'Strategy' },
  { id: '5', title: 'Competitor Analysis Questions', text: 'List key questions to ask when analyzing a competitor\'s marketing strategy.', category: 'Research' },
  { id: '6', title: 'Website Headline Options', text: 'Generate 3 alternative headlines for a webpage about [service/feature].', category: 'Website Copy' },
  { id: '7', title: 'LinkedIn Connection Request', text: 'Write a personalized LinkedIn connection request message to someone in the [industry] industry.', category: 'Networking' },
  { id: '8', title: 'Case Study Outline', text: 'Create an outline for a customer case study highlighting the success of using [product/service].', category: 'Content Creation' },
  { id: '9', title: 'Webinar Title Brainstorm', text: 'Brainstorm 5 engaging titles for a webinar about [topic].', category: 'Events' },
  { id: '10', title: 'SEO Keyword Ideas', text: 'Suggest 10 related SEO keywords for the primary keyword "[keyword]".', category: 'SEO' },
];


// Masonry responsive breakpoints
const breakpointColumnsObj = {
  default: 3,
  1100: 2,
  700: 1
};


export default function Home() {
  // Initialize state with local data
  const [prompts, setPrompts] = useState<Prompt[]>(samplePrompts);
  // isLoading is no longer needed as data is local
  // const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // error state is no longer needed
  // const [error, setError] = useState<string | null>(null);

  // useEffect hook for fetching data is removed

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

          {/* Removed error alert - no fetching errors expected */}

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
              // disabled={isLoading} // isLoading removed
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
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card/80 rounded p-4 shadow">
              <p className="text-lg font-medium">
                {prompts.length === 0
                  ? "No prompts available in the local data." // Message if local data is empty
                  : "No prompts match your search or filter."}
              </p>
              {prompts.length > 0 && <p className="text-sm mt-1">Try adjusting your search term or category filter.</p>}
            </div>
          ) : (
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
          )}
      </div>
    </main>
  );
}
