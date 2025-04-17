'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistance } from 'date-fns';
import { getImageUrl } from '@/lib/appwrite';
import { Lock, Globe, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TiptapContentRenderer } from './TiptapContentRenderer';

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
  postType = 'standard'
}: PostCardProps) {
  const formattedDate = formatDistance(new Date(createdAt), new Date(), { addSuffix: true });
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

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
      overflow-hidden 
      ${featured ? 'md:grid md:grid-cols-2' : ''}
      h-full transition-all hover:shadow-lg flex flex-col
      ${className}
    `}>
      {imageId && (
        <div className={`relative ${featured ? 'h-64 md:h-auto' : 'h-48'} w-full`}>
          <Image
            src={getImageUrl(imageId).toString()}
            alt={title}
            fill
            className="object-cover"
            priority={featured}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="flex flex-col flex-grow p-4">
        <CardHeader className="p-0 mb-2">
          <CardTitle className={`
            ${featured ? "text-2xl" : "text-xl"} 
            line-clamp-2 leading-tight mb-1
          `}>
            <Link href={`/post/${id}`} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {userName && <span>By {userName}</span>}
            <span>•</span>
            <span>{formattedDate}</span>
            <span>•</span>
            {renderVisibilityBadge()}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0 mb-3">
          <TiptapContentRenderer 
            content={content} 
            className={featured 
              ? "text-sm sm:text-base line-clamp-[8] prose-headings:my-2 prose-p:my-1" 
              : "text-sm sm:text-base line-clamp-3 prose-headings:my-2 prose-p:my-1"
            }
          />
        </CardContent>
        
        <CardFooter className="p-0 mt-auto flex justify-between items-center">
          <Button 
            variant={featured ? "default" : "link"}
            size="sm" 
            asChild
            className={`${featured ? 'transition-all hover:scale-105' : 'p-0 h-auto'}`}
          >
            <Link href={`/post/${id}`}>Read More</Link>
          </Button>
          {showControls && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/edit/${id}`}>Edit</Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  );
} 