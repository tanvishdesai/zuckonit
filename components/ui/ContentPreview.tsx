'use client';

import { useMemo } from 'react';
import { extractTextFromTiptap } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ContentPreviewProps {
  content: string;
  className?: string;
  lines?: number;
}

export function ContentPreview({ content, className = '', lines = 3 }: ContentPreviewProps) {
  const previewText = useMemo(() => {
    // If it looks like HTML (starts with <), we might want to strip tags
    if (content.trim().startsWith('<')) {
        // Simple regex strip (not perfect but fast for preview)
        const text = content.replace(/<[^>]*>/g, ' ');
        return text.slice(0, 300); // Limit length
    }

    // Otherwise try to extract from Tiptap JSON
    try {
        return extractTextFromTiptap(content, lines + 10); // Get enough text, then CSS clamp it
    } catch {
        return content;
    }
  }, [content, lines]);

  return (
    <div className="text-muted-foreground">
      <p className={cn("line-clamp-3", className)}>
        {previewText}
      </p>
    </div>
  );
}
