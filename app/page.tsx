"use client"

import { useEffect, useState, useRef } from "react";
import { getVisiblePosts } from "@/lib/appwrite"
import { PostCard } from "@/components/ui/PostCard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import type { Models } from "appwrite";

interface PostDocument extends Models.Document {
  title: string;
  content: string;
  created_at: string;
  image?: string;
  user_name?: string;
  visibility?: 'public' | 'private' | 'groups';
  group_id?: string[];
}

interface PostsState {
  documents: PostDocument[];
  total: number;
}

export default function Home() {
  const [posts, setPosts] = useState<PostsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Ref to track all parallax containers
  const parallaxContainers = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPosts = await getVisiblePosts(20);
        setPosts(fetchedPosts as unknown as PostsState);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Set up parallax effect on mouse movement
  useEffect(() => {
    // Add parallax effect to containers
    const containers = document.querySelectorAll<HTMLElement>('.parallax-container');
    parallaxContainers.current = Array.from(containers);
    
    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        parallaxContainers.current.forEach(container => {
          const rect = container.getBoundingClientRect();
          
          // Check if mouse is hovering over this container
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            // Calculate relative position within the element
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.5;
            
            // Apply subtle transform
            container.style.transform = `perspective(1000px) rotateY(${relX * 2}deg) rotateX(${-relY * 2}deg) scale(1.02)`;
          } else {
            // Reset transform when not hovering over this specific container
            container.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
          }
        });
      });
    };
    
    // Make sure all transforms reset when mouse leaves the document
    const handleMouseLeave = () => {
      parallaxContainers.current.forEach(container => {
        container.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
      });
    };
    
    // Add individual container mouse leave handlers
    parallaxContainers.current.forEach(container => {
      container.addEventListener('mouseleave', () => {
        container.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
      });
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      // Clean up individual container listeners
      parallaxContainers.current.forEach(container => {
        container.removeEventListener('mouseleave', () => {});
      });
    };
  }, [posts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-muted/30 rounded-xl border border-border/40 max-w-3xl mx-auto mt-12">
        <h2 className="text-2xl font-semibold mb-3">Failed to load posts</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || "We're having trouble loading posts right now. Please try again later."}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section 
        className="py-16 -mt-8 bg-card rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg border border-primary/20 animate-fade-in relative overflow-hidden"
        style={{
          backgroundSize: '200% 200%',
          transition: 'background-position 0.3s ease, transform 0.3s ease'
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          
          // Move gradient based on mouse position
          e.currentTarget.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
          
          // Subtle transform effect
          const rotateX = (0.5 - y) * 5;
          const rotateY = (x - 0.5) * 5;
          e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundPosition = '0% 0%';
          e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        }}
      >
        {/* Add stronger shimmer overlay */}
        <div className="absolute inset-0 bg-shimmer-medium pointer-events-none"></div>
        
        <div className="text-center px-4 py-12 max-w-3xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-2">
            Welcome to <span className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] bg-clip-text">Zuckonit</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] mx-auto my-6 rounded-full"></div>
          <p className="mt-6 text-xl text-foreground leading-relaxed">
            A minimalist platform for sharing your thoughts, ideas, and creative work with a community of like-minded
            creators.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="h-12 px-8 text-base font-medium hover:animate-pulse-glow hover:bg-background hover:text-primary transition-colors" 
              asChild
            >
              <Link href="/create">Start Writing</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 text-base font-medium border-primary/30 hover:bg-background hover:text-primary transition-colors" 
              asChild
            >
              <Link href="/register">Join the Community</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-10" />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button
            className="bg-primary hover:bg-primary/90"
            asChild
          >
            <Link href="/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="latest" className="w-full">
        <TabsContent value="latest" className="space-y-10">
          <h2 className="text-3xl font-bold">Latest Posts</h2>

          {posts && posts.documents.length === 0 ? (
            <div className="text-center py-24 bg-muted/40 rounded-xl border border-border/40">
              <h2 className="text-2xl font-semibold mb-3">No posts yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Share your thoughts by creating your first post and start building your collection.
              </p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                asChild
              >
                <Link href="/create">Create Your First Post</Link>
              </Button>
            </div>
          ) : posts && (
            <>
              {posts.documents.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center mb-4">
                    <div className="h-6 w-1.5 bg-primary rounded-full mr-3"></div>
                    <h3 className="text-xl font-medium text-muted-foreground">Featured Post</h3>
                  </div>
                  <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-border/40 parallax-container">
                    <PostCard
                      key={posts.documents[0].$id}
                      id={posts.documents[0].$id}
                      title={posts.documents[0].title}
                      content={posts.documents[0].content}
                      createdAt={posts.documents[0].created_at}
                      imageId={posts.documents[0].image}
                      userName={posts.documents[0].user_name}
                      featured={true}
                      visibility={posts.documents[0].visibility}
                      groupIds={posts.documents[0].group_id}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.documents.slice(1).map((post) => (
                  <div
                    key={post.$id}
                    className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-border/40 group parallax-container"
                  >
                    <PostCard
                      id={post.$id}
                      title={post.title}
                      content={post.content}
                      createdAt={post.created_at}
                      imageId={post.image}
                      userName={post.user_name}
                      visibility={post.visibility}
                      groupIds={post.group_id}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 h-12 hover:pulse-effect"
                >
                  Load More
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="trending">
          <h2 className="text-3xl font-bold mb-8">Trending Posts</h2>
          <div className="text-center py-24 bg-muted/40 rounded-xl border border-border/40">
            <h2 className="text-2xl font-semibold mb-3">Coming Soon</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Were working on bringing you trending posts. Check back soon!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

