
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

  // Provide fallbacks for potentially missing properties
  // Ensure the values used for display are always strings
  const displayTitle = prompt?.title?.trim() || 'Untitled Prompt';
  const displayText = prompt?.text?.trim() || 'No content available.';
  const displayCategory = prompt?.category?.trim(); // Category is optional, can be undefined

  const handleCopy = () => {
    // Use the potentially empty displayText for copying. Disable button if no text.
    if (!navigator.clipboard) {
      toast({
        title: 'Error',
        description: 'Clipboard API not available in this browser or context.',
        variant: 'destructive',
      });
      return;
    }

    navigator.clipboard.writeText(displayText) // Copy the potentially empty text
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
        {/* Use primary-foreground (red) for title */}
        <CardTitle className="text-lg font-semibold text-primary-foreground">{displayTitle}</CardTitle>
        {displayCategory && ( // Only show badge if category exists and is not empty
          <Badge variant="secondary" className="mt-2 w-fit capitalize">{displayCategory}</Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow pt-0 pb-4">
        {/* Use pre-wrap to preserve line breaks within the prompt text */}
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{displayText}</p>
      </CardContent>
      <CardFooter className="pt-0 pb-4 px-4 mt-auto"> {/* Added mt-auto to push footer down */}
        <Button
          variant="default" // Use default variant (red background, white text)
          size="sm"
          onClick={handleCopy}
          className={cn(
              "w-full transition-colors duration-200" // Simplified classes, rely on theme
          )}
          aria-label={`Copy prompt: ${displayTitle}`}
          // Disable button if there's no text to copy or only the fallback text
          disabled={!displayText || displayText === 'No content available.'}
        >
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy Prompt
        </Button>
      </CardFooter>
    </Card>
  );
}
