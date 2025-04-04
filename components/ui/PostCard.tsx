'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistance } from 'date-fns';
import { getImageUrl } from '@/lib/appwrite';
import { Lock, Globe, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  groupIds = []
}: PostCardProps) {
  const maxLength = featured ? 300 : 150;
  const truncatedContent = content.length > maxLength 
    ? `${content.slice(0, maxLength)}...` 
    : content;
  
  const formattedDate = formatDistance(new Date(createdAt), new Date(), { addSuffix: true });
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  // Render visibility icon and label
  const renderVisibilityBadge = () => {
    switch(visibility) {
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

  return (
    <Card className={`
      overflow-hidden animate-fade-in 
      ${featured ? 'md:grid md:grid-cols-2' : ''}
      h-full transition-all hover:shadow-lg
      ${className}
    `}>
      {imageId && (
        <div className={`relative ${featured ? 'h-64 md:h-full' : 'h-48'} w-full`}>
          <Image
            src={getImageUrl(imageId).toString()}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className={`
            ${featured ? "text-2xl" : "text-xl"} 
            line-clamp-2 leading-tight
          `}>
            {title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
            {userName && <span>By {userName}</span>}
            <span>•</span>
            <span>{formattedDate}</span>
            <span>•</span>
            {renderVisibilityBadge()}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className={`
            prose dark:prose-invert max-w-none
            ${featured ? 'line-clamp-6' : 'line-clamp-3'} 
            text-sm sm:text-base
            prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            prose-strong:font-bold prose-em:italic
          `}>
            <div dangerouslySetInnerHTML={{ __html: truncatedContent }} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between mt-auto pt-4">
          <Button 
            variant={featured ? "default" : "outline"} 
            asChild
            className="transition-all hover:scale-105"
          >
            <Link href={`/post/${id}`}>Read More</Link>
          </Button>
          {showControls && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/edit/${id}`}>Edit</Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  );
} 