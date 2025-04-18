'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';

interface TiptapContentRendererProps {
  content: string; // Could be JSON stringified or HTML
  className?: string;
}

export function TiptapContentRenderer({ content, className = '' }: TiptapContentRendererProps) {
  // First try to determine if content is JSON or HTML
  let isJson = false;
  let parsedContent: Record<string, unknown> | string = '';
  
  try {
    // Only attempt to parse if it looks like JSON (starts with { or [)
    if (content && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
      parsedContent = JSON.parse(content);
      isJson = true;
    } else {
      // If not JSON-like, treat as HTML directly
      parsedContent = content;
    }
  } catch (e) {
    console.error("Failed to parse content as JSON, treating as HTML:", e);
    parsedContent = content; // Fallback to treating as HTML
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Highlight,
      Typography,
      Heading.configure({ levels: [1, 2, 3] }),
      Image.configure({ inline: false }),
    ],
    content: isJson ? parsedContent : content, // Use JSON object or HTML string
    editable: false, // Make it read-only
    editorProps: {
      attributes: {
        // Apply base prose styles
        class: `prose dark:prose-invert max-w-none ${className}`.trim()
      },
    },
  });

  // Ensure editor updates if content prop changes externally
  useEffect(() => {
    if (!editor || !content) return;
    
    try {
      // Check if content is JSON-like
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const newContent = JSON.parse(content);
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(newContent)) {
          editor.commands.setContent(newContent, false);
        }
      } else if (editor.getHTML() !== content) {
        // Handle HTML content
        editor.commands.setContent(content, false);
      }
    } catch  {
      // If JSON parsing fails, set as HTML
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  return <EditorContent editor={editor} />;
}

// Add necessary global styles if not already present
// (These might be better placed in a global CSS file)
export function TiptapGlobalStyles() {
  return (
    <style jsx global>{`
       .ProseMirror {
         outline: none;
       }
       .ProseMirror img {
         max-width: 100%;
         height: auto;
         display: block; 
         margin-top: 1rem;
         margin-bottom: 1rem;
         border-radius: 0.375rem;
       }
       .ProseMirror img.ProseMirror-selectednode {
         outline: 3px solid #68CEF8;
       }
       /* Ensure prose styles apply correctly in read-only mode */
       .ProseMirror h1 { font-size: 1.75rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; }
       .ProseMirror h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.5rem; }
       .ProseMirror h3 { font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
       .ProseMirror p { margin-bottom: 0.75rem; }
       .ProseMirror ul, .ProseMirror ol { margin-left: 1.5rem; margin-bottom: 0.75rem; }
       .ProseMirror blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1rem; margin-left: 0; margin-right: 0; font-style: italic; color: hsl(var(--muted-foreground)); }
       .ProseMirror mark { background-color: yellow; padding: 0.1em 0.3em; border-radius: 0.2em; }
     `}</style>
  );
} 