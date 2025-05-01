'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { PromptCard } from '@/components/prompt-card'; // Corrected import path
import type { Prompt } from '@/types/prompt'; // Assuming types are defined here
import { Search } from 'lucide-react';

// Sample prompt data
const samplePrompts: Prompt[] = [
  {
    id: '1',
    title: 'Generate Blog Post Ideas',
    text: 'Brainstorm 10 blog post titles targeting [Target Audience] about [Topic]. Focus on addressing their pain points related to [Specific Problem].',
    category: 'Content Creation',
  },
  {
    id: '2',
    title: 'Craft Email Subject Lines',
    text: 'Write 5 compelling email subject lines for a campaign promoting [Product/Service] to [Target Audience]. Highlight the key benefit of [Benefit].',
    category: 'Email Marketing',
  },
  {
    id: '3',
    title: 'Develop Social Media Posts',
    text: 'Create 3 social media posts for LinkedIn announcing our new feature: [Feature Name]. Emphasize how it helps B2B marketers achieve [Result]. Include relevant hashtags.',
    category: 'Social Media',
  },
  {
    id: '4',
    title: 'Outline Webinar Content',
    text: 'Outline a 45-minute webinar structure on the topic "[Webinar Topic]" for [Target Audience]. Include sections for introduction, key points (3-4), Q&A, and call to action for [Desired Outcome].',
    category: 'Content Creation',
  },
  {
    id: '5',
    title: 'Generate Lead Magnet Ideas',
    text: 'List 5 lead magnet ideas (e.g., checklist, template, ebook) that would attract [Target Audience] interested in [Topic].',
    category: 'Lead Generation',
  },
  {
    id: '6',
    title: 'Write Ad Copy',
    text: 'Draft ad copy for a Google Ads campaign targeting keywords related to [Keyword Theme]. Focus on a strong headline, clear description highlighting [Unique Selling Proposition], and a compelling call to action.',
    category: 'Advertising',
  },
];


export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching data
  useEffect(() => {
    // In a real app, you would fetch data here
    setPrompts(samplePrompts);
    setIsLoading(false);
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

      {isLoading ? (
         <div className="text-center py-10">Loading prompts...</div>
       ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.length > 0 ? (
            filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))
          ) : (
            <p className="text-center col-span-full text-muted-foreground">
              No prompts found matching your search.
            </p>
          )}
        </div>
       )}
    </main>
  );
}
