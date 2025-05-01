'use client';

import { useState, useEffect } from 'react';
import { getPost, deletePost, getImageUrl, getUserGroups, getUserMemberships, getCurrentUser } from '@/lib/appwrite';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Comments } from '@/components/ui/Comments';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Lock, Globe, Users } from 'lucide-react';
import React from 'react';
import { TiptapContentRenderer, TiptapGlobalStyles } from '@/components/ui/TiptapContentRenderer';

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
  post_type?: 'standard' | 'blog';
  status?: 'published' | 'draft';
}

// Correct type definition for Next.js App Router page props
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupNames, setGroupNames] = useState<{[key: string]: string}>({});
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchPostDataParallel() {
      try {
        setLoading(true);
        setAccessDenied(false);
        setError(null);
        setPost(null); // Reset post state at the beginning
        setGroupNames({}); // Reset group names

        // Fetch post and current user in parallel initially
        const [postResult, currentUserResult] = await Promise.allSettled([
          getPost(id),
          getCurrentUser() // Fetch user early if needed for most checks
        ]);

        if (postResult.status === 'rejected') {
          console.error('Error fetching post:', postResult.reason);
          if (postResult.reason instanceof Error && postResult.reason.message.includes('not found')) {
            setError('Post not found or you don\'t have access.');
          } else {
            setError('Failed to load post details.');
          }
          return; // Stop if post fetch fails
        }

        const postData = postResult.value as unknown as Post; // Cast via unknown
        // Handle potential failure of getCurrentUser gracefully
        const currentUser = currentUserResult.status === 'fulfilled' ? currentUserResult.value : null;

        // --- Access Check Logic ---

        // Draft Check
        if (postData.status === 'draft') {
          if (!currentUser || currentUser.$id !== postData.user_id) {
            setAccessDenied(true);
            setError('You do not have permission to view this draft post.');
            return;
          }
          // If draft and owner, proceed to set post
        }
        // Public Check
        else if (postData.visibility === 'public') {
          // Access granted for public posts
        }
        // Authenticated User Checks (Private, Groups, Owner)
        else {
          if (!currentUser) {
            setAccessDenied(true);
            setError('You must be logged in to view this post.');
            return;
          }
          if (postData.user_id === currentUser.$id) {
            // Owner always has access (even if private/groups)
          } else if (postData.visibility === 'private') {
            setAccessDenied(true);
            setError('This is a private post and you are not the owner.');
            return;
          } else if (postData.visibility === 'groups' && Array.isArray(postData.group_id) && postData.group_id.length > 0) {
            // For groups, need memberships and group names (fetch in parallel)
            const [membershipsResult, groupsResult] = await Promise.allSettled([
              getUserMemberships(), // Check if user is member of required groups
              getUserGroups() // Get names for display
            ]);

            if (membershipsResult.status === 'rejected') {
              console.error("Error fetching user memberships:", membershipsResult.reason);
              setAccessDenied(true);
              setError('Could not verify group membership.');
              return;
            }

            const userMemberships = membershipsResult.value;
            const userGroupIds = userMemberships.map(group => group.$id);
            const hasGroupAccess = postData.group_id.some((groupId: string) => userGroupIds.includes(groupId));

            if (!hasGroupAccess) {
              setAccessDenied(true);
              setError('You do not have access to the required groups for this post.');
              return;
            }

            // If access granted, process group names (handle potential failure)
            if (groupsResult.status === 'fulfilled') {
              const userGroups = groupsResult.value;
              const groupMap: { [key: string]: string } = {};
              userGroups.forEach(group => {
                if (postData.group_id!.includes(group.$id)) { // Use non-null assertion if type guarantees group_id existence here
                  groupMap[group.$id] = group.name;
                }
              });
              setGroupNames(groupMap);
            } else {
              console.error('Error fetching group names:', groupsResult.reason);
              // Non-critical error, maybe show IDs instead? For now, just log.
            }
          } else {
            // Fallback if visibility isn't covered or group_id is missing/empty
             setAccessDenied(true);
             setError('Access denied due to post visibility settings.');
             return;
          }
        }

        // --- Set Post State ---
        setPost(postData);

      } catch (err) { // Catch any unexpected errors during the process
        console.error('Unexpected error in fetchPostDataParallel:', err);
        setError('An unexpected error occurred while loading the post.');
        setAccessDenied(true); // Assume access denied on unexpected error
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPostDataParallel(); // Call the new parallel function
    }

  }, [id]); // Keep 'user' dependency? If auth state changes, should re-check access. Maybe add user?.$id

  const handleDeletePost = async () => {
    if (!user || !post || post.user_id !== user.$id) {
      alert('Action not allowed');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
       setLoading(true);
      await deletePost(post.$id);
      router.push('/');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
       setLoading(false);
    }
  };

  const renderVisibilityBadge = () => {
    if (!post || !post.visibility) return null;
    
    switch(post.visibility) {
      case 'private':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20"><Lock className="h-3 w-3 mr-1" />Private</Badge>;
      case 'groups':
        const groupCount = post.group_id?.length || 0;
        if (groupCount === 0) return null;
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Users className="h-3 w-3 mr-1" />{groupCount} {groupCount === 1 ? 'Group' : 'Groups'}</Badge>;
      default:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><Globe className="h-3 w-3 mr-1" />Public</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container max-w-2xl text-center py-10 animate-fade-in">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            {error || 'Post not found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {accessDenied 
              ? 'You might not have permission or the post may not exist.'
              : 'The post you are looking for is unavailable.'}
          </p>
          <Button asChild variant="outline">
            <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const formattedDate = formatDistance(new Date(post.created_at), new Date(), { addSuffix: true });

  return (
    <div className="container max-w-4xl py-8 animate-fade-in mx-auto">
      <TiptapGlobalStyles />
      <Card className="overflow-hidden mb-10 border">
        {post.image && (
          <div className="relative w-full h-[300px] md:h-[450px]">
            <Image
              src={getImageUrl(post.image).toString()}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        <CardHeader className="p-6">
          <div className="flex items-center justify-between mb-4">
             <Link href="/">
               <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                 <ArrowLeft className="h-4 w-4 mr-1" />
                 <span>Back</span>
               </Button>
             </Link>
             {user && user.$id === post.user_id && (
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" asChild>
                   <Link href={`/edit/${post.$id}`}>Edit Post</Link>
                 </Button>
                 <Button 
                   type="button" 
                   size="sm"
                   variant="destructive"
                   onClick={handleDeletePost}
                   disabled={loading}
                 >
                   {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                   Delete Post
                 </Button>
               </div>
             )}
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold mt-2 mb-2">{post.title}</CardTitle>
          <div className="flex flex-wrap items-center text-muted-foreground gap-x-3 gap-y-1 text-sm">
            <span>Posted by <Link href={`/user/${post.user_id}`} className="hover:underline font-medium">{post.user_name}</Link></span>
            <span>•</span>
            <span>{formattedDate}</span>
            <span>•</span>
            {renderVisibilityBadge()}
          </div>
          
          {post.visibility === 'groups' && post.group_id && post.group_id.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.group_id.map(groupId => (
                <Badge key={groupId} variant="secondary" className="text-xs">
                  {groupNames[groupId] || `Group...`}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <TiptapContentRenderer 
            content={post.content} 
            className="prose-lg prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-strong:font-bold prose-em:italic prose-ul:list-disc prose-ol:list-decimal" 
          />
        </CardContent>
      </Card>
      
      {/* Comments section */}
      <div className="mt-10">
        <Comments postId={id} />
      </div>
    </div>
  );
} 