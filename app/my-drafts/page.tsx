'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/ui/PostCard';
import { getCurrentUser, deletePost, databases, Query, DATABASES, COLLECTIONS } from '@/lib/appwrite';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Post {
  $id: string;
  title: string;
  content: string;
  image: string;
  created_at: string;
  user_name: string;
  visibility: 'public' | 'private' | 'groups';
  group_id?: string[];
  post_type: 'standard' | 'blog';
  status: 'published' | 'draft';
}

export default function MyDraftsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchDrafts() {
      try {
        setLoading(true);
        
        // Check if user is logged in
        const user = await getCurrentUser();
        console.log("Client - User check result:", user ? `Authenticated as ${user.$id}` : "Not authenticated");
        
        if (!user) {
          console.log("Client - Redirecting to login page");
          router.push('/login');
          return;
        }
        
        console.log("Client - Fetching drafts for user:", user.$id);
        
        try {
          // First try using the API route
          const response = await fetch('/api/drafts', {
            credentials: 'include', // This ensures cookies are sent with the request
          });
          
          if (!response.ok) {
            console.error("Client - API response not ok:", response.status, response.statusText);
            throw new Error(`API response error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.error) {
            console.error("Client - API returned error:", data.error);
            throw new Error(data.error);
          } else {
            console.log("Client - Drafts fetched successfully via API:", data.documents?.length || 0, "drafts");
            setPosts(data.documents || []);
          }
        } catch (apiErr) {
          console.error("Client - API route failed, trying direct Appwrite query:", apiErr);
          
          // Fallback: If API route fails, query Appwrite directly
          const response = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            [
              Query.equal('user_id', user.$id),
              Query.equal('status', 'draft'),
              Query.orderDesc('created_at')
            ]
          );
          
          console.log("Client - Drafts fetched successfully via direct query:", response.documents?.length || 0, "drafts");
          setPosts(response.documents as unknown as Post[]);
        }
      } catch (err) {
        console.error('Client - Error fetching drafts:', err);
        setError('Failed to load your drafts. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchDrafts();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await deletePost(id);
        setPosts(posts.filter(post => post.$id !== id));
      } catch (err) {
        console.error('Error deleting draft:', err);
        setError('Failed to delete the draft. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading your drafts...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Drafts</h1>
        <Button asChild>
          <Link href="/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">You do not have any drafts yet</h2>
          <p className="text-muted-foreground mb-6">Start creating a new post and save it as a draft.</p>
          <Button asChild>
            <Link href="/create">Create New Post</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.$id}
              id={post.$id}
              title={post.title}
              content={post.content}
              createdAt={post.created_at}
              imageId={post.image}
              onDelete={() => handleDelete(post.$id)}
              showControls={true}
              userName={post.user_name}
              visibility={post.visibility}
              groupIds={post.group_id}
              postType={post.post_type}
            />
          ))}
        </div>
      )}
    </div>
  );
} 