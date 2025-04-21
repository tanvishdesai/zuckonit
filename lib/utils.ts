import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractTextFromTiptap(content: string, lines: number = 5): string {
  try {
    const json = typeof content === 'string' ? JSON.parse(content) : content;
    let text = '';
    function traverse(node: { type?: string; text?: string; content?: unknown[] | unknown }) {
      if (text.split('\n').length >= lines) return;
      if (node.type === 'text' && node.text) {
        text += node.text;
      }
      if (node.content) {
        if (Array.isArray(node.content)) {
          node.content.forEach(traverse);
        } else {
          traverse(node.content as { type?: string; text?: string; content?: unknown[] | unknown });
        }
        text += '\n';
      }
    }
    traverse(json);
    return text.trim().split('\n').slice(0, lines).join('\n');
  } catch {
    // fallback to raw string if not JSON
    return content.split('\n').slice(0, lines).join('\n');
  }
}
