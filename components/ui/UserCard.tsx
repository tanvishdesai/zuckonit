'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface UserCardProps {
  userId: string;
  name: string;
  postCount: number;
  className?: string;
}

export function UserCard({
  userId,
  name,
  postCount,
  className = ''
}: UserCardProps) {
  return (
    <Link href={`/user/${userId}`}>
      <Card className={`
        overflow-hidden animate-fade-in p-4
        h-full transition-all hover:shadow-lg hover:border-primary
        hover:bg-primary/5 cursor-pointer
        ${className}
      `}>
        <CardContent className="p-0 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/40 
            flex items-center justify-center text-primary-foreground text-xl font-bold
            transition-transform group-hover:scale-110">
            {name ? name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h3 className="text-lg font-medium">{name || 'Anonymous User'}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{postCount || 0} posts</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 