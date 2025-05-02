
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
        console.log("Fetching prompts in useEffect...");
        const fetchedPrompts = await fetchPromptsFromSheet();
        console.log("Fetched prompts:", fetchedPrompts);

        // Check if the fetched data indicates an error
        const fetchError = fetchedPrompts.find(p => p.id.startsWith('fetch-error-') || p.id.startsWith('config-error-'));
        if (fetchError) {
           setError(`${fetchError.title}: ${fetchError.text}`);
           setPrompts([]); // Clear prompts on error
           console.error("Error detected during fetch:", fetchError.text);
        } else {
          setPrompts(fetchedPrompts);
        }
      } catch (err: any) {
        // Catch any unexpected errors during the fetch process itself
        console.error('Error loading prompts:', err);
        setError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
        setPrompts([]); // Clear prompts on error
      } finally {
        setIsLoading(false);
      }
    }

    loadPrompts();
  }, []); // Empty dependency array ensures this runs once on mount

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.category) {
        uniqueCategories.add(prompt.category);
      }
    });
    return ['all', ...Array.from(uniqueCategories)];
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
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
            <AlertTitle>Error Loading Prompts</AlertTitle>
            <AlertDescription>
               <pre className="whitespace-pre-wrap break-words text-sm">{error}</pre>
               Please check your Google Sheet configuration and environment variables. Refer to the server logs for more detailed information.
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
        />
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          aria-label="Filter by category"
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border focus:ring-ring">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="capitalize cursor-pointer focus:bg-accent focus:text-accent-foreground">
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

       {isLoading ? (
         // Show skeleton loaders while loading
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {renderSkeletons(6)}
         </div>
       ) : !error && filteredPrompts.length === 0 ? (
         // Show "No prompts found" message only if not loading and no error
         <div className="text-center py-12 text-muted-foreground">
           <p>No prompts found matching your criteria.</p>
           <p>Try adjusting your search or category filter.</p>
           {prompts.length === 0 && !isLoading && (
               <p className="mt-2 text-sm">It seems there are no prompts in the connected Google Sheet.</p>
           )}
         </div>
       ) : (
         // Display prompts once loaded and no error, or if there's an error (error message shown above)
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredPrompts.map((prompt) => (
             <PromptCard key={prompt.id} prompt={prompt} />
           ))}
         </div>
       )}
    </main>
  );
}

    