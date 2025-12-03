# Product Documentation & Performance Analysis

## 1. Project Overview

**Project Name**: Zuckonit
**Description**: A content sharing platform (similar to a blog/social media) where users can create, explore, and share posts. It features a rich text editor, groups, privacy settings, and a modern UI with animations.

### Tech Stack
*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **UI Components**: Radix UI, Lucide React
*   **Animations**: Framer Motion, React Three Fiber (3D), Custom Particle Systems
*   **Rich Text Editor**: Tiptap
*   **Backend**: Appwrite (BaaS)

### Folder Structure
*   `app/`: Next.js App Router pages and layouts.
    *   `page.tsx`: Home page.
    *   `explore/`: Explore page with search and carousel.
    *   `post/[id]/`: Individual post view.
    *   `create/`, `edit/`: Post creation/editing.
*   `components/`: Reusable UI components.
    *   `ui/`: Base UI elements (buttons, inputs, cards).
*   `lib/`: Utility functions and Appwrite configuration.

---

## 2. Performance Analysis: Why the website is slow

The user reported that the website is "slow to load," "not very snappy," and "takes a bit of time to load" when clicking buttons. Upon analyzing the codebase, several critical performance bottlenecks were identified.

### A. The Primary Culprit: Tiptap Instance Explosion

**Location**: `components/ui/PostCard.tsx` and `components/ui/TiptapContentRenderer.tsx`

**The Problem**:
The `PostCard` component is used to display previews of posts in lists (Home page, Explore page). Inside `PostCard`, it uses `TiptapContentRenderer`.

Inspection of `TiptapContentRenderer.tsx` reveals that it calls `useEditor` to instantiate a **full Tiptap editor instance** for every single card, even just for read-only display.
```typescript
const editor = useEditor({
    extensions: [ ... ], // Loads many extensions
    content: ...,
    editable: false,
    // ...
});
```
Initializing a rich-text editor engine is computationally expensive. It involves:
1.  Parsing the schema.
2.  Creating a ProseMirror state.
3.  Mounting a DOM structure with event listeners.

**Impact**:
On the Home or Explore page, if there are 10-12 posts:
*   The browser tries to initialize **10-12 full editor instances simultaneously** on the main thread.
*   This completely blocks the main thread during the initial render and hydration.
*   **Result**: The page freezes ("not snappy"), and interactions (clicks, scrolling) are delayed until the main thread frees up.
*   **Click Delay**: When clicking "Load More" or navigating, the mounting of *new* PostCards triggers this heavy process again, causing the reported delay.

### B. Excessive Main Thread Animation

**Location**: `app/page.tsx` (Home) and `app/explore/page.tsx`

**The Problem**:
The Home page uses a custom particle animation system inside a `useEffect` loop that runs `requestAnimationFrame`.
*   It updates DOM elements directly via `element.style.top` / `left`.
*   While better than React state updates, doing this for many particles while the main thread is already choking on Tiptap instances exacerbates the jank.
*   `app/explore/page.tsx` also runs a fluid simulation on a canvas.

**Impact**: High CPU usage, contributing to the feeling of sluggishness, especially on mobile or lower-end devices.

### C. Large DOM Size & Layout Thrashing
*   The `PostCard` 3D tilt effect (`mousemove`) forces style recalculations.
*   The combination of Framer Motion animations + Heavy Editor Components + 3D Canvas leads to a very heavy DOM and frequent reflows.

---

## 3. Eradication Plan (Solutions)

To make the site "snappy", we must remove the heavy processing from the critical rendering path.

### Solution 1: Replace `TiptapContentRenderer` in PostCards (CRITICAL)

**Strategy**: Do **NOT** use `useEditor` or `EditorContent` for post previews in cards.

**Implementation**:
1.  Create a lightweight renderer (e.g., `SimpleContentRenderer` or modify `TiptapContentRenderer`).
2.  Since the content is likely stored as JSON or HTML:
    *   **If HTML**: Render it directly using a sanitized `dangerouslySetInnerHTML`.
    *   **If JSON**: Use a lightweight utility to convert Tiptap JSON to HTML string *without* instantiating the editor, or extract just the plain text for the preview.
3.  For the `PostCard`, we mostly need a text preview (truncated).
    *   **Action**: Create a function that extracts plain text from the Tiptap JSON object.
    *   Render simple `<p>{extractedText}</p>` with CSS line clamping.

**Benefit**: Reduces the blocking time from ~500ms+ (for 10 cards) to ~10ms. This is the single biggest performance win.

### Solution 2: Optimize Animations

1.  **Reduce Particle Count**: Decrease the number of particles on mobile devices.
2.  **Optimize Loop**: Ensure the animation loop stops when the component is not in view (IntersectionObserver).
3.  **Use CSS Transforms**: Move particles using `transform: translate3d(...)` instead of `top`/`left` to use the GPU compositor and avoid layout thrashing.

### Solution 3: Interaction Optimization

1.  **Debounce Mouse Events**: The 3D tilt effect on cards should be throttled or removed on mobile.
2.  **Prefetching**: Next.js does this by default, but ensuring the target pages are lightweight (by fixing the individual Post page to only load the Editor when necessary or using a lighter viewer) will help.

---

## 4. Immediate Next Steps for Developer

1.  **Refactor `TiptapContentRenderer`**: Modify it to accept a `mode` prop (`'full'` vs `'preview'`).
2.  In `'preview'` mode, parse the JSON to get text/simple HTML and render a standard `div`.
3.  Update `PostCard` to use the `'preview'` mode.
4.  Test the Home page load time.
