import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getProfilePictureUrl } from '@/lib/appwrite';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Author {
  userId: string;
  name: string;
  postCount: number;
  profilePictureId?: string;
}

interface PopularAuthorsVizProps {
  authors: Author[];
  loading: boolean;
  activeAuthor: string | null;
  setActiveAuthor: (id: string | null) => void;
}

const colors = [
  'from-indigo-500 to-purple-500',
  'from-fuchsia-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-lime-500',
  'from-yellow-400 to-orange-500',
  'from-rose-500 to-red-500',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-green-500',
];

export const PopularAuthorsViz: React.FC<PopularAuthorsVizProps> = ({
  authors,
  loading,
  activeAuthor,
  setActiveAuthor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Circular layout
  const RADIUS = 160; // px
  const centerX = 200;
  const centerY = 200;
  const minSize = 64;
  const maxSize = 110;
  const maxPosts = Math.max(...authors.map(a => a.postCount), 1);

  if (loading) {
    return (
      <div className="relative h-[400px] flex items-center justify-center">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-secondary animate-pulse"
            style={{
              width: minSize,
              height: minSize,
              left: centerX + RADIUS * Math.cos((i / 8) * 2 * Math.PI) - minSize / 2,
              top: centerY + RADIUS * Math.sin((i / 8) * 2 * Math.PI) - minSize / 2,
            }}
          />
        ))}
      </div>
    );
  }

  if (!authors.length) {
    return <p className="text-center text-muted-foreground">No authors found</p>;
  }

  return (
    <div ref={containerRef} className="relative h-[400px] w-full flex items-center justify-center">
      {/* Central glowing background */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] opacity-20 blur-2xl z-0" />
      {/* Author nodes */}
      {authors.map((author, i) => {
        const angle = (i / authors.length) * 2 * Math.PI;
        const size = minSize + ((author.postCount / maxPosts) * (maxSize - minSize));
        const x = centerX + RADIUS * Math.cos(angle) - size / 2;
        const y = centerY + RADIUS * Math.sin(angle) - size / 2;
        const color = colors[i % colors.length];
        const isActive = activeAuthor === author.userId;
        return (
          <motion.div
            key={author.userId}
            className={cn(
              'absolute flex flex-col items-center group cursor-pointer z-10',
              isActive && 'z-20'
            )}
            style={{ left: x, top: y, width: size, height: size }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: isActive ? 1.15 : 1, opacity: 1, filter: isActive ? 'brightness(1.2)' : 'brightness(1)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.18, zIndex: 30 }}
            onMouseEnter={() => setActiveAuthor(author.userId)}
            onMouseLeave={() => setActiveAuthor(null)}
            onClick={() => setActiveAuthor(isActive ? null : author.userId)}
          >
            {/* Avatar or Initial */}
            <div
              className={cn(
                'rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all duration-300 bg-gradient-to-br',
                color,
                isActive ? 'ring-4 ring-primary/40' : 'ring-2 ring-primary/10'
              )}
              style={{ width: size, height: size }}
            >
              {author.profilePictureId ? (
                <Image
                  src={getProfilePictureUrl(author.profilePictureId).toString()}
                  alt={author.name}
                  fill
                  className="object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {author.name ? author.name.charAt(0).toUpperCase() : 'A'}
                </span>
              )}
            </div>
            {/* Animated ring for active */}
            {isActive && (
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/60 pointer-events-none"
                style={{ width: size + 18, height: size + 18 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              />
            )}
            {/* Info card on hover/click */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute left-1/2 top-full mt-4 -translate-x-1/2 w-56 bg-card border border-border rounded-xl shadow-xl p-4 z-30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full overflow-hidden relative border-2 border-primary/30">
                      {author.profilePictureId ? (
                        <Image
                          src={getProfilePictureUrl(author.profilePictureId).toString()}
                          alt={author.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center text-primary-foreground text-xl font-bold">
                          {author.name ? author.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-primary leading-tight">{author.name || 'Anonymous User'}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>{author.postCount || 0} posts</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/user/${author.userId}`}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow hover:bg-primary/90 transition-colors"
                  >
                    View Profile <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      {/* Decorative floating dots */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: 12 + Math.random() * 10,
            height: 12 + Math.random() * 10,
            left: centerX + (RADIUS + 60 + Math.random() * 30) * Math.cos((i / 12) * 2 * Math.PI) - 8,
            top: centerY + (RADIUS + 60 + Math.random() * 30) * Math.sin((i / 12) * 2 * Math.PI) - 8,
          }}
          animate={{
            y: [0, Math.random() * 10 - 5, 0],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

export default PopularAuthorsViz; 