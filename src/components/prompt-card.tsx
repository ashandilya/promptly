
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
  className?: string; // Add className prop
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  const { toast } = useToast(); // Initialize toast

  const handleCopy = () => {
    // navigator.clipboard.writeText requires a secure context (HTTPS or localhost)
    if (!navigator.clipboard) {
      toast({
        title: 'Error',
        description: 'Clipboard API not available in this browser or context.',
        variant: 'destructive',
      });
      return;
    }

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
            title: "Error Copying",
            description: "Could not copy prompt to clipboard. Ensure you are on HTTPS or localhost.",
            variant: "destructive",
          });
      });
  };

  return (
    <Card className={cn(
        "flex flex-col bg-card shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border border-border",
        className // Apply className prop
        )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-primary">{prompt.title}</CardTitle>
        {prompt.category && (
          <Badge variant="secondary" className="mt-2 w-fit">{prompt.category}</Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow pt-0 pb-4">
        {/* Use pre-wrap to preserve line breaks within the prompt text */}
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{prompt.text}</p>
      </CardContent>
      <CardFooter className="pt-0 pb-4 px-4 mt-auto"> {/* Added mt-auto to push footer down */}
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
