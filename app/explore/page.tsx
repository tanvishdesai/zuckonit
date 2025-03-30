'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/ui/PostCard';
import { UserCard } from '@/components/ui/UserCard';
import { getPosts, getPopularAuthors, searchUsers } from '@/lib/appwrite';
import { Search, User, MessageSquare, ArrowRight, Users, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

// Define interfaces for posts and users
interface Post {
  $id: string;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  user_id: string;
  user_name: string;
}

interface Author {
  userId: string;
  name: string;
  postCount: number;
}

export default function ExplorePage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [popularAuthors, setPopularAuthors] = useState<Author[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [matchedUsers, setMatchedUsers] = useState<Author[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch posts and authors on page load
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setLoadingAuthors(true);
        
        // Fetch posts and authors in parallel
        const [postsData, authorsData] = await Promise.all([
          getPosts(50, { filter: 'random' }),
          getPopularAuthors(4)
        ]);
        
        setPosts(postsData.documents as unknown as Post[]);
        setFilteredPosts(postsData.documents as unknown as Post[]);
        setPopularAuthors(authorsData as Author[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setLoadingAuthors(false);
      }
    }

    fetchData();
  }, []);

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      setMatchedUsers([]);
      setIsSearching(false);
      return;
    }
    
    try {
      const query = searchQuery.toLowerCase();
      
      // Search posts
      const postResults = posts.filter(
        post => 
          post.title.toLowerCase().includes(query) || 
          post.content.toLowerCase().includes(query) ||
          (post.user_name && post.user_name.toLowerCase().includes(query))
      );
      
      // Search users
      const userResults = await searchUsers(searchQuery);
      
      setFilteredPosts(postResults);
      setMatchedUsers(userResults);
      setIsSearching(false);
      
      // Set active tab based on results
      if (postResults.length === 0 && userResults.length > 0) {
        setActiveTab('users');
      } else if (postResults.length > 0 && userResults.length === 0) {
        setActiveTab('posts');
      } else {
        setActiveTab('all');
      }
    } catch (error) {
      console.error('Error searching:', error);
      setIsSearching(false);
    }
  };

  return (
    <div className="container max-w-7xl py-10 animate-fade-in">
      {/* Top Search Bar - Stylish Design */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 mb-6">Explore & Discover</h1>
        <p className="text-lg text-muted-foreground mb-6">Discover content and users from across the platform. Search for posts, find users, and explore new ideas.</p>
        <form onSubmit={handleSearch} className="relative w-full">
          <div className="relative">
            <Input 
              placeholder="Search posts and users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-20 py-6 text-lg rounded-full border-2 border-primary/20 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
            <Button 
              type="submit" 
              size="lg"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>
      </div>

      {/* Add tabs for search results if both users and posts are found */}
      {searchQuery && (matchedUsers.length > 0 || filteredPosts.length > 0) ? (
        <div className="mb-8">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full md:w-1/3 grid-cols-3">
              <TabsTrigger value="all">All Results</TabsTrigger>
              <TabsTrigger value="posts" disabled={filteredPosts.length === 0}>
                Posts ({filteredPosts.length})
              </TabsTrigger>
              <TabsTrigger value="users" disabled={matchedUsers.length === 0}>
                Users ({matchedUsers.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {/* Users section if any users found */}
              {matchedUsers.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Users
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchedUsers.map((user) => (
                      <UserCard
                        key={user.userId}
                        userId={user.userId}
                        name={user.name}
                        postCount={user.postCount}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Posts section if any posts found */}
              {filteredPosts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    Posts
                  </h2>
                  {renderColumnsLayout(filteredPosts, loading, hoveredPost, setHoveredPost)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="posts" className="mt-6">
              {filteredPosts.length > 0 ? (
                renderColumnsLayout(filteredPosts, loading, hoveredPost, setHoveredPost)
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium">No posts found</h3>
                  <p className="text-muted-foreground">Try a different search term</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
              {matchedUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedUsers.map((user) => (
                    <UserCard
                      key={user.userId}
                      userId={user.userId}
                      name={user.name}
                      postCount={user.postCount}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium">No users found</h3>
                  <p className="text-muted-foreground">Try a different search term</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : searchQuery ? (
        <div className="text-center py-10 mb-8">
          <h3 className="text-lg font-medium">No results found</h3>
          <p className="text-muted-foreground">Try a different search term</p>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content area (75%) */}
        <div className="w-full md:w-3/4">
          {/* Show regular posts if not searching */}
          {!searchQuery && (
            <>
              <h2 className="text-2xl font-semibold mb-6">Recent Posts</h2>
              {renderColumnsLayout(filteredPosts, loading, hoveredPost, setHoveredPost)}
            </>
          )}
        </div>

        {/* Sidebar (25%) */}
        <div className="w-full md:w-1/4 space-y-6">
          {/* Popular Authors - Now with real data */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Popular Contributors
              </h3>
              {loadingAuthors ? (
                // Loading skeleton for authors
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-16 w-16 rounded-full bg-secondary mx-auto mb-2" />
                      <div className="h-4 bg-secondary rounded w-20 mx-auto mb-1" />
                      <div className="h-3 bg-secondary rounded w-12 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : popularAuthors.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {popularAuthors.map((author) => (
                    <Link 
                      key={author.userId}
                      href={`/user/${author.userId}`}
                      className="group flex flex-col items-center p-3 rounded-lg border transition-all 
                        hover:border-primary hover:bg-primary/5 cursor-pointer"
                    >
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/40 
                        flex items-center justify-center text-primary-foreground text-xl font-bold mb-2
                        transition-transform group-hover:scale-110 group-hover:shadow-lg">
                        {author?.name ? author.name.charAt(0) : 'A'}
                      </div>
                      <p className="text-sm font-medium text-center group-hover:text-primary">
                        {author?.name || 'Anonymous User'}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>{author?.postCount || 0} posts</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No authors found</p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Not sure where to start? Our help center has answers to many common questions.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/about">
                  Visit Help Center
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to create the columns layout with improved animations
function renderColumnsLayout(
  posts: Post[],
  loading: boolean,
  hoveredPost: string | null,
  setHoveredPost: (id: string | null) => void
) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(9)].map((_, index) => (
          <div key={index} className="h-64 animate-pulse bg-secondary rounded-lg" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No posts found</h3>
        <p className="text-muted-foreground">Try a different search term</p>
      </div>
    );
  }

  // Split posts into 3 columns with even distribution
  const postsPerColumn = Math.ceil(posts.length / 3);
  const columns = [
    posts.slice(0, postsPerColumn),
    posts.slice(postsPerColumn, postsPerColumn * 2),
    posts.slice(postsPerColumn * 2)
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((columnPosts, columnIndex) => {
        // Apply different animation delays to each column for staggered effect
        const animationDelay = `${columnIndex * 0.15}s`;
        
        return (
          <div 
            key={columnIndex}
            className="space-y-6 opacity-0 animate-slide-up"
            style={{ 
              animationDelay,
              animationFillMode: 'forwards'
            }}
          >
            {columnPosts.map((post) => (
              <div 
                key={post.$id}
                className="transition-all duration-300 hover:translate-y-[-5px]"
                onMouseEnter={() => setHoveredPost(post.$id)}
                onMouseLeave={() => setHoveredPost(null)}
              >
                <PostCard
                  id={post.$id}
                  title={post.title}
                  content={post.content}
                  createdAt={post.created_at}
                  imageId={post.image}
                  userName={post.user_name}
                  className={`${hoveredPost === post.$id ? 'shadow-xl border-primary' : 'shadow-sm'}`}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
} 