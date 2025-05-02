
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

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrompts() {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Initiating prompt fetch from client...");
        const fetchedPrompts = await fetchPromptsFromSheet();
        console.log("Prompt fetch attempt completed on client. Result count:", fetchedPrompts.length);

        const fetchError = fetchedPrompts.find(p => p.id.startsWith('fetch-error-') || p.id.startsWith('config-error-'));
        if (fetchError) {
           setError(`${fetchError.title}: ${fetchError.text}`);
           setPrompts([]);
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
        console.error('Unexpected error in Home component during prompt loading:', err);
        setError(`An unexpected client-side error occurred while loading prompts: ${err.message || 'Unknown error'}. Check browser console and server logs.`);
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPrompts();
  }, []);

  const categories = useMemo(() => {
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
    return prompts.filter(prompt => {
       if (prompt.id.startsWith('fetch-error-') || prompt.id.startsWith('config-error-')) {
         return false;
       }
      const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            prompt.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchTerm, selectedCategory]);

  // Define breakpoint columns for Masonry layout
  const breakpointColumnsObj = {
    default: 3, // Default number of columns
    1100: 2,   // 2 columns for screens >= 1100px
    700: 1     // 1 column for screens >= 700px
  };

  // Function to render skeleton loaders (using Masonry for consistency)
  const renderSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
       <div key={`skeleton-${index}`} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card shadow mb-4"> {/* Added mb-4 for spacing in masonry */}
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

      {error && (
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>{error.split(':')[0] || 'Error Loading Prompts'}</AlertTitle>
            <AlertDescription>
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
          disabled={isLoading || !!error}
        />
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          aria-label="Filter by category"
          disabled={isLoading || !!error || categories.length <= 1}
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
               <SelectItem value="all" disabled>No categories found</SelectItem>
             )}
          </SelectContent>
        </Select>
      </div>

       {isLoading ? (
         <Masonry
           breakpointCols={breakpointColumnsObj}
           className="flex w-auto -ml-4" // Adjust negative margin to counteract column spacing
           columnClassName="pl-4 bg-clip-padding" // Add spacing between columns
         >
           {renderSkeletons(6)}
         </Masonry>
       ) : !error && filteredPrompts.length === 0 ? (
         <div className="text-center py-12 text-muted-foreground">
           <p>
             {prompts.length === 0
               ? "No prompts were found in the connected Google Sheet."
               : "No prompts found matching your current search or filter."}
           </p>
            {prompts.length > 0 && <p>Try adjusting your search term or category filter.</p>}
         </div>
       ) : !error ? (
         <Masonry
           breakpointCols={breakpointColumnsObj}
           className="flex w-auto -ml-4" // Adjust negative margin to counteract column spacing
           columnClassName="pl-4 bg-clip-padding" // Add spacing between columns
         >
           {filteredPrompts.map((prompt) => (
             <PromptCard key={prompt.id} prompt={prompt} className="mb-4" /> // Add mb-4 for vertical spacing
           ))}
         </Masonry>
       ) : null }
    </main>
  );
}
