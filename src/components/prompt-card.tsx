'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCopy } from 'lucide-react';
import type { Prompt } from '@/types/prompt';
import { useToast } from '@/hooks/use-toast'; // Import useToast hook
import { cn } from '@/lib/utils';

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const { toast } = useToast(); // Initialize toast

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Prompt copied to clipboard.",
        });
      })
      .catch(err => {
         console.error('Failed to copy text: ', err);
         toast({
            title: "Error",
            description: "Failed to copy prompt.",
            variant: "destructive",
          });
      });
  };

  return (
    <Card className="flex flex-col h-full bg-card shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-primary">{prompt.title}</CardTitle>
        {prompt.category && (
          <Badge variant="secondary" className="mt-2 w-fit">{prompt.category}</Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow pt-0 pb-4">
        <p className="text-sm text-foreground/90">{prompt.text}</p>
      </CardContent>
      <CardFooter className="pt-0 pb-4 px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={cn(
              "w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-200",
              "border-accent hover:border-accent/90" // Keep border matching the accent color
          )}
          aria-label={`Copy prompt: ${prompt.title}`}
        >
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy Prompt
        </Button>
      </CardFooter>
    </Card>
  );
}
