'use client';

import { useState, useEffect } from 'react';
import { getPost, deletePost, getImageUrl, getUserGroups, getUserMemberships, getCurrentUser } from '@/lib/appwrite';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Comments } from '@/components/ui/Comments';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Lock, Globe, Users } from 'lucide-react';
import React from 'react';

// Define Post type
interface Post {
  $id: string;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  user_id: string;
  user_name: string;
  visibility?: 'public' | 'private' | 'groups';
  group_id?: string[];
}

// Correct type definition for Next.js App Router page props
interface PageProps {
  params: Promise<{ id: string }>
}

export default function PostPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupNames, setGroupNames] = useState<{[key: string]: string}>({});
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const postData = await getPost(id);
        
        // Check access permissions
        const hasAccess = await checkPostAccess(postData);
        if (!hasAccess) {
          setAccessDenied(true);
          setPost(null);
          setError('You do not have permission to view this post');
          return;
        }
        
        setPost(postData as unknown as Post);
        setError(null);
        
        // If the post has group_id, fetch group names
        if (postData.visibility === 'groups' && postData.group_id && postData.group_id.length > 0) {
          fetchGroupNames();
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    }

    // Check if user has access to the post
    async function checkPostAccess(post: Record<string, unknown>): Promise<boolean> {
      // Public posts are accessible to everyone
      if (post.visibility === 'public') {
        return true;
      }
      
      // Get current user
      const currentUser = await getCurrentUser();
      
      // Not logged in and the post is not public
      if (!currentUser) {
        return false;
      }
      
      // Private posts are only accessible to the owner
      if (post.visibility === 'private') {
        return post.user_id === currentUser.$id;
      }
      
      // Group posts are accessible to members of the group
      if (post.visibility === 'groups' && Array.isArray(post.group_id)) {
        // Get groups the user is a member of
        const userGroups = await getUserMemberships();
        const userGroupIds = userGroups.map(group => group.$id);
        
        // Check if the user is a member of any of the post's groups
        return post.group_id.some((groupId: string) => userGroupIds.includes(groupId));
      }
      
      return false;
    }

    async function fetchGroupNames() {
      try {
        // Get all groups the user has created
        const userGroups = await getUserGroups();
        const groupMap: {[key: string]: string} = {};
        
        userGroups.forEach(group => {
          groupMap[group.$id] = group.name;
        });
        
        setGroupNames(groupMap);
      } catch (err) {
        console.error('Error fetching group names:', err);
      }
    }

    fetchPost();
  }, [id]);

  const handleDeletePost = async () => {
    if (!user || !post) return;
    
    if (post.user_id !== user.$id) {
      alert('You can only delete your own posts');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      await deletePost(post.$id);
      router.push('/');
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  // Function to render visibility badge
  const renderVisibilityBadge = () => {
    if (!post || !post.visibility) return null;
    
    switch(post.visibility) {
      case 'private':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border-rose-500/20">
            <Lock className="h-3 w-3" />
            <span>Private</span>
          </Badge>
        );
      case 'groups':
        if (!post.group_id || post.group_id.length === 0) return null;
        
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Users className="h-3 w-3" />
            <span>{post.group_id.length} {post.group_id.length === 1 ? 'Group' : 'Groups'}</span>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post || accessDenied) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <h2 className="text-xl font-semibold mb-2">
          {accessDenied ? 'Access Denied' : 'Post not found'}
        </h2>
        <p className="text-muted-foreground mb-4">
          {accessDenied 
            ? 'You do not have permission to view this post'
            : 'The post you\'re looking for doesn\'t exist or has been removed'}
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const formattedDate = formatDistance(new Date(post.created_at), new Date(), { addSuffix: true });

  return (
    <div className="container max-w-4xl py-8 animate-fade-in mx-auto">
      <Card className="overflow-hidden mb-10 border">
        {post.image && (
          <div className="relative w-full h-[400px]">
            <Image
              src={getImageUrl(post.image).toString()}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-4">{post.title}</h1>
            <div className="flex flex-wrap items-center justify-center text-muted-foreground gap-2">
              <span>Posted by {post.user_name}</span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              {renderVisibilityBadge()}
            </div>
            
            {post.visibility === 'groups' && post.group_id && post.group_id.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {post.group_id.map(groupId => (
                  <Badge key={groupId} variant="secondary" className="text-xs">
                    {groupNames[groupId] || `Group ${groupId.substring(0, 6)}...`}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="prose dark:prose-invert max-w-none mx-auto prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-strong:font-bold prose-em:italic prose-ul:list-disc prose-ol:list-decimal">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          <div className="flex justify-center gap-2 pt-6">
            
            {user && user.$id === post.user_id && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/edit/${post.$id}`}>Edit Post</Link>
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleDeletePost}
                >
                  Delete Post
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
      
      {/* Comments section */}
      <div className="mt-10">
        <Comments postId={id} />
      </div>
    </div>
  );
} 