'use client';

import { useState, useEffect } from 'react';
import { getPost, deletePost, getImageUrl } from '@/lib/appwrite';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Comments } from '@/components/ui/Comments';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const postData = await getPost(id);
        setPost(postData as unknown as Post);
        setError(null);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Post not found');
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <h2 className="text-xl font-semibold mb-2">Post not found</h2>
        <p className="text-muted-foreground mb-4">The post youre looking for doesnt exist or has been removed</p>
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
            <div className="flex items-center justify-center text-muted-foreground">
              <span>Posted by {post.user_name}</span>
              <span className="mx-2">•</span>
              <span>{formattedDate}</span>
            </div>
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