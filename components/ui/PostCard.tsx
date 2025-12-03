'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistance } from 'date-fns';
import { getImageUrl } from '@/lib/appwrite';
import { Lock, Globe, Users, BriefcaseBusiness, BookOpenText, Palette, BookOpen, Film, Bookmark, ArrowUpRight, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentPreview } from './ContentPreview';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageId?: string;
  onDelete?: (id: string) => void;
  showControls?: boolean;
  userName?: string;
  featured?: boolean;
  className?: string;
  visibility?: 'public' | 'private' | 'groups';
  groupIds?: string[];
  postType?: 'standard' | 'blog';
  label?: 'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema';
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function PostCard({
  id,
  title,
  content,
  createdAt,
  imageId,
  onDelete,
  showControls = false,
  userName,
  featured = false,
  className = '',
  visibility = 'public',
  groupIds = [],
  postType = 'standard',
  label = 'Work',
  onBookmark,
  isBookmarked = false
}: PostCardProps) {
  const { user } = useAuth();
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const formattedDate = formatDistance(new Date(createdAt), new Date(), { addSuffix: true });

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to bookmark posts");
      return;
    }

    if (onBookmark) {
      setIsBookmarkLoading(true);
      try {
        onBookmark();
      } catch (error) {
        console.error("Error toggling bookmark:", error);
        toast.error("Failed to update bookmark");
      } finally {
        setIsBookmarkLoading(false);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  // Subtle mouse follow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Apply subtle transform
    card.style.transform = `
      perspective(800px)
      rotateY(${x * 3}deg)
      rotateX(${-y * 3}deg)
      translateZ(5px)
    `;

    // Move highlight overlay
    if (card.querySelector('.highlight-overlay')) {
      const highlight = card.querySelector('.highlight-overlay') as HTMLElement;
      highlight.style.background = `
        radial-gradient(
          circle at ${e.clientX - rect.left}px ${e.clientY - rect.top}px,
          rgba(var(--primary-rgb), 0.1) 0%,
          transparent 60%
        )
      `;
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0)';

    // Reset highlight
    if (card.querySelector('.highlight-overlay')) {
      const highlight = card.querySelector('.highlight-overlay') as HTMLElement;
      highlight.style.background = 'transparent';
    }
  };

  const renderVisibilityBadge = () => {
    switch (visibility) {
      case 'private':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border-rose-500/20">
            <Lock className="h-3 w-3" />
            <span>Private</span>
          </Badge>
        );
      case 'groups':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Users className="h-3 w-3" />
            <span>{groupIds.length} {groupIds.length === 1 ? 'Group' : 'Groups'}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <Globe className="h-3 w-3" />
            <span>Public</span>
          </Badge>
        );
    }
  };

  const renderLabelBadge = () => {
    switch (label) {
      case 'Philosophy':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
            <BookOpenText className="h-3 w-3" />
            <span>Philosophy</span>
          </Badge>
        );
      case 'Art':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Palette className="h-3 w-3" />
            <span>Art</span>
          </Badge>
        );
      case 'literature':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
            <BookOpen className="h-3 w-3" />
            <span>Literature</span>
          </Badge>
        );
      case 'Cinema':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-red-500/10 text-red-500 border-red-500/20">
            <Film className="h-3 w-3" />
            <span>Cinema</span>
          </Badge>
        );
      default: // Work
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20">
            <BriefcaseBusiness className="h-3 w-3" />
            <span>Work</span>
          </Badge>
        );
    }
  };

  // Prevent nested <a> tags: Only Card is clickable, not nested links inside Card
  // Replace inner <Link> for title and button with <span> or div, but keep styling and accessibility.

  return (
    <Link href={`/post/${id}`} className="block group">
      <Card
        ref={cardRef}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          featured ? "h-full" : "h-[420px]",
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        role="link"
        aria-label={title}
      >
        {/* Interactive highlight overlay */}
        <div className="highlight-overlay absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"></div>

        {/* Border gradient animation */}
        <div className="absolute inset-0 -z-10 rounded-xl p-[1px] transition-all group-hover:opacity-100 opacity-0">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-primary/10 to-primary/20 animate-border-flow"></div>
        </div>

        {/* Action buttons: Bookmark & Share */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-colors",
              isBookmarked && "text-primary hover:text-primary"
            )}
            onClick={handleBookmarkToggle}
            disabled={isBookmarkLoading}
          >
            <Bookmark
              className={cn(
                "h-4 w-4 transition-transform hover:scale-110",
                isBookmarked && "fill-primary"
              )}
            />
            <span className="sr-only">Bookmark</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`/share/${id}`, '_blank', 'noopener,noreferrer');
            }}
          >
            <Share2 className="h-4 w-4 transition-transform hover:scale-110" />
            <span className="sr-only">Share post</span>
          </Button>
        </div>

        {imageId && (
          <div className={`relative ${featured ? 'h-64 md:h-auto' : 'h-52'} w-full group overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

            <Image
              src={getImageUrl(imageId).toString()}
              alt={title}
              fill
              className="object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
              priority={featured}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {featured && (
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                <h3 className="text-xl font-bold">{userName && `By ${userName}`}</h3>
                <p className="text-sm opacity-80">{formattedDate}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col flex-grow p-5 backdrop-blur-sm">
          <CardHeader className="p-0 mb-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-2">
              {renderVisibilityBadge()}
              {postType === 'standard' && renderLabelBadge()}
            </div>

            <CardTitle className={cn(
              featured ? "text-2xl md:text-3xl" : "text-xl",
              "line-clamp-2 leading-tight mb-2 font-bold",
              "bg-clip-text hover:text-transparent hover:bg-gradient-to-r hover:from-primary hover:to-primary/70",
              "transition-all duration-300"
            )}>
              {/* Replacing <Link> with <span> to avoid nested links */}
              <span className="transition-colors block cursor-pointer">
                {title}
              </span>
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {userName && (
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                    {userName.charAt(0)}
                  </div>
                  <span>{userName}</span>
                </div>
              )}
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </CardHeader>

          <CardContent className="flex-grow p-0 mb-4">
            <ContentPreview
              content={content}
              className={cn(
                "text-sm sm:text-base",
                featured ? "line-clamp-[8]" : "line-clamp-3"
              )}
            />
          </CardContent>

          <CardFooter className="p-0 mt-auto flex justify-between items-center">
            {/* 
              Prevent nested <a>: Use a <span> styled as a link for 'Read More'.
              Only outer <Link> is used for navigation.
            */}
            <Button
              variant={featured ? "default" : "ghost"}
              size={featured ? "default" : "sm"}
              className={cn(
                "group/readmore",
                featured
                  ? "transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md hover:shadow-primary/20"
                  : "hover:bg-transparent p-0 h-auto text-primary"
              )}
              tabIndex={-1} // since <Card> (within <Link>) is the only link
              type="button"
              aria-label="Read More"
            >
              <span className="flex items-center gap-1.5">
                <span>Read More</span>
                <ArrowUpRight className={cn(
                  "h-3.5 w-3.5",
                  "transition-transform duration-300",
                  "group-hover/readmore:translate-x-0.5",
                  "group-hover/readmore:-translate-y-0.5"
                )} />

                {/* Animated line for non-featured cards */}
                {!featured && (
                  <span className="block h-px w-0 bg-primary transition-all duration-300 group-hover/readmore:w-full absolute bottom-0 left-0"></span>
                )}
              </span>
            </Button>

            {showControls && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary">
                  <Link href={`/edit/${id}`}>Edit</Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-red-500/80 hover:bg-red-500">
                  Delete
                </Button>
              </div>
            )}
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}