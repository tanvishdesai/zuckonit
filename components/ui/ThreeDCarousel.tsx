import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { extractTextFromTiptap } from '@/app/explore/page';

interface Post {
  $id: string;
  title: string;
  content: string;
  image?: string;
}

interface ThreeDCarouselProps {
  posts: Post[];
  onRead: (id: string) => void;
}

export const ThreeDCarousel: React.FC<ThreeDCarouselProps> = ({ posts, onRead }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (posts.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % posts.length);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [posts.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % posts.length);
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + posts.length) % posts.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [posts.length]);

  if (!posts.length) return null;

  return (
    <div className="relative w-full flex flex-col items-center my-11">
      <div className="perspective-2000 perspective-origin-center w-full max-w-3xl mx-auto h-[520px] flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
          {posts.slice(0, 10).map((post, i) => {
            // 3D coverflow math
            const offset = i - activeIndex;
            const isActive = offset === 0;
            const z = -Math.abs(offset) * 80 + (isActive ? 80 : 0);
            const x = offset * 120;
            const rotateY = offset * -35;
            const opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.25;
            return (
              <div
                key={post.$id}
                className={cn(
                  'absolute top-0 left-1/2 w-72 h-[380px] bg-card rounded-2xl shadow-xl border border-border/40 flex flex-col items-center justify-between transition-all duration-500 ease-in-out',
                  isActive ? 'z-20 scale-105 shadow-glow' : 'z-10',
                )}
                style={{
                  transform: `translateX(-50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg)`,
                  opacity,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                aria-hidden={!isActive}
              >
                <div className="flex flex-col items-center px-6 py-6 w-full h-full">
                  <h3 className="text-xl font-bold text-center mb-4 line-clamp-2">{post.title}</h3>
                  {post.image ? (
                    <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                      <Image src={post.image} alt={post.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <pre className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3 mb-4 w-full h-40 overflow-hidden whitespace-pre-line line-clamp-5">{extractTextFromTiptap(post.content, 5)}</pre>
                  )}
                  <Button className="mt-auto w-full" onClick={() => onRead(post.$id)}>
                    Read Now
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {/* Navigation arrows */}
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-card/80 rounded-full p-2 shadow hover:bg-primary/10 transition"
          onClick={() => setActiveIndex((i) => (i - 1 + posts.length) % posts.length)}
          aria-label="Previous"
        >
          <span className="sr-only">Previous</span>
          &#8592;
        </button>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-card/80 rounded-full p-2 shadow hover:bg-primary/10 transition"
          onClick={() => setActiveIndex((i) => (i + 1) % posts.length)}
          aria-label="Next"
        >
          <span className="sr-only">Next</span>
          &#8594;
        </button>
      </div>
      {/* Dots */}
      <div className="flex gap-2 mt-6">
        {posts.slice(0, 10).map((_, i) => (
          <button
            key={i}
            className={cn(
              'w-3 h-3 rounded-full transition',
              i === activeIndex ? 'bg-primary' : 'bg-muted border border-border'
            )}
            onClick={() => setActiveIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}; 