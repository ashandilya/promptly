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
  // Removed className prop
}

export function PromptCard({ prompt }: PromptCardProps) {
  const { toast } = useToast(); // Initialize toast

  // Provide fallbacks for potentially missing properties
  // Ensure the values used for display are always strings
  const displayTitle = prompt.title || 'Untitled Prompt';
  const displayText = prompt.text || 'No content available.';
  const displayCategory = prompt.category || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      toast({
        title: "Copied!",
        description: "Prompt has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      "border border-border/50 hover:border-border"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">{displayTitle}</CardTitle>
        {displayCategory && (
          <Badge variant="secondary" className="mt-2 w-fit capitalize">{displayCategory}</Badge>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-foreground/90 line-clamp-4">{displayText}</p>
      </CardContent>
      <CardFooter className="pt-2 pb-4 px-4">
        <Button
          variant="default"
          size="sm"
          onClick={handleCopy}
          className={cn(
            "w-full transition-all duration-200",
            "opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
          )}
          aria-label={`Copy prompt: ${displayTitle}`}
          disabled={!displayText || displayText === 'No content available.'}
        >
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy Prompt
        </Button>
      </CardFooter>
    </Card>
  );
}
