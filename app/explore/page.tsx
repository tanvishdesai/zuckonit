'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/ui/PostCard';
import { UserCard } from '@/components/ui/UserCard';
import { getVisiblePosts, getPopularAuthors, searchUsers } from '@/lib/appwrite';
import { Search, Users, FileText, Sparkles,  Filter, X, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import PopularAuthorsViz from '@/components/ui/PopularAuthorsViz';
import { ThreeDCarousel } from '@/components/ui/ThreeDCarousel';
import { useRouter } from 'next/navigation';

// Define interfaces for posts and users
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
  label?: 'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema';
}

interface Author {
  userId: string;
  name: string;
  postCount: number;
  profilePictureId?: string;
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
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'latest' | 'oldest' | 'alphabetical'>('latest');
  
  // Animation references
  const heroRef = useRef<HTMLDivElement>(null);
  const fluidSimulationRef = useRef<HTMLCanvasElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0, moving: false });
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const cursorSpeedRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);
  const isMobileRef = useRef(false);

  const router = useRouter();

  // Fetch posts and authors on page load
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setLoadingAuthors(true);
        
        // Fetch posts and authors in parallel
        const [postsData, authorsData] = await Promise.all([
          getVisiblePosts(50),
          getPopularAuthors(8)
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
    
    // Check if mobile
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Initialize fluid simulation for hero section
  useEffect(() => {
    if (!fluidSimulationRef.current || isMobileRef.current) return;
    
    const canvas = fluidSimulationRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size
    const updateCanvasSize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Track mouse position and calculate velocity
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      if (dt > 0) {
        // Calculate cursor velocity
        cursorSpeedRef.current = {
          x: (x - mousePositionRef.current.x) / dt * 15,
          y: (y - mousePositionRef.current.y) / dt * 15
        };
      }
      
      mousePositionRef.current = { x, y, moving: true };
      
      // Add new fluid points only if mouse moved enough distance
      const dx = mousePositionRef.current.x - lastMousePositionRef.current.x;
      const dy = mousePositionRef.current.y - lastMousePositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        // Add fluid points along the movement path
        
        
        lastMousePositionRef.current = { x, y };
      }
    };
    
    const handleMouseLeave = () => {
      mousePositionRef.current.moving = false;
    };
    
    const handleMouseEnter = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      lastMousePositionRef.current = { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      };
      lastTimeRef.current = performance.now();
    };
    
    // Animation loop for fluid simulation
    const animate = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas with fade effect
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add new points occasionally if mouse is not moving
      if (!mousePositionRef.current.moving && Math.random() > 0.97) {
        // Removed setFluidPoints (unused)
      }
      
      // Removed setFluidPoints (unused)
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation and add event listeners
    animate();
    
    // Add event listeners to the hero section container, not just the canvas
    const heroContainer = heroRef.current;
    if (heroContainer) {
      heroContainer.addEventListener('mousemove', handleMouseMove);
      heroContainer.addEventListener('mouseleave', handleMouseLeave);
      heroContainer.addEventListener('mouseenter', handleMouseEnter);
    }
    
    // Removed initial fluid points (unused)
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (heroContainer) {
        heroContainer.removeEventListener('mousemove', handleMouseMove);
        heroContainer.removeEventListener('mouseleave', handleMouseLeave);
        heroContainer.removeEventListener('mouseenter', handleMouseEnter);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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
      
      // Search posts - strip HTML tags for content searching
      const stripHtml = (html: string) => {
        // Create a safer HTML stripping function that works server and client side
        return html.replace(/<[^>]*>?/gm, '');
      };
      
      const postResults = posts.filter(
        post => 
          post.title.toLowerCase().includes(query) || 
          stripHtml(post.content).toLowerCase().includes(query) ||
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
  
  // Handle filter toggles
  const toggleFilter = (filter: string) => {
    setActiveFilters(current => 
      current.includes(filter)
        ? current.filter(f => f !== filter)
        : [...current, filter]
    );
  };
  
  const clearFilters = () => {
    setActiveFilters([]);
  };
  
  // Handle sorting of posts
  const handleSort = (option: 'latest' | 'oldest' | 'alphabetical') => {
    setSortOption(option);
    
    const sortedPosts = [...filteredPosts];
    
    if (option === 'latest') {
      sortedPosts.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else if (option === 'oldest') {
      sortedPosts.sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } else if (option === 'alphabetical') {
      sortedPosts.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredPosts(sortedPosts);
  };
  
  // Apply filters and sorting when dependencies change
  useEffect(() => {
    if (!posts.length) return;
    
    // Apply filters first
    let result = [...posts];
    
    if (activeFilters.length > 0) {
      result = result.filter(post => post.label && activeFilters.includes(post.label));
    }
    
    // Then apply sorting
    if (sortOption === 'latest') {
      result.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else if (sortOption === 'oldest') {
      result.sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } else if (sortOption === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredPosts(result);
  }, [posts, activeFilters, sortOption]);

  return (
    <div className="animate-fade-in">
      {/* Hero section with fluid animation background */}
      <div 
        ref={heroRef}
        className="relative min-h-[50vh] flex items-center justify-center mb-12 bg-gradient-to-br from-[var(--gradient-start)] via-background to-[var(--gradient-end)] overflow-hidden"
      >
        {/* Fluid simulation canvas */}
        <canvas 
          ref={fluidSimulationRef} 
          className="absolute inset-0 w-full h-full z-[1]"
          style={{ pointerEvents: 'none' }}
        />
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-12 w-64 h-64 bg-gradient-to-r from-[var(--gradient-start)] to-transparent rounded-full filter blur-3xl opacity-20 z-0"></div>
        <div className="absolute bottom-1/3 -right-12 w-80 h-80 bg-gradient-to-l from-[var(--gradient-end)] to-transparent rounded-full filter blur-3xl opacity-20 z-0"></div>
        
        {/* Floating shapes */}
        <motion.div 
          className="absolute top-[15%] left-[10%] w-20 h-20 border-2 border-primary/20 rounded-lg rotate-12 opacity-70 z-[2]"
          animate={{ 
            y: [0, -15, 0], 
            rotate: [12, 5, 12],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        
        <motion.div 
          className="absolute bottom-[20%] right-[15%] w-24 h-24 border-2 border-[var(--gradient-end)]/20 rounded-full opacity-70 z-[2]"
          animate={{ 
            y: [0, 20, 0], 
            x: [0, -10, 0],
            rotate: [-12, -25, -12],
            opacity: [0.7, 0.8, 0.7]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        {/* Animated accent icons */}
        <motion.div 
          className="absolute top-[30%] right-[30%] text-primary/30 z-[2]"
          animate={{ 
            y: [0, -10, 0], 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <Sparkles size={32} />
        </motion.div>
        
        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise opacity-5 z-[1]"></div>
        
        <div className="container relative z-10 text-center px-4 py-16 max-w-4xl mx-auto">
          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Explore & Discover
          </motion.h1>
          
          <motion.div 
            className="w-32 h-1.5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] mx-auto rounded-full my-8"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "8rem", opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          
          <motion.p 
            className="mt-6 text-xl md:text-2xl font-light text-foreground/80 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Discover content and connect with creative minds from across the platform
          </motion.p>
          
          {/* Enhanced search bar */}
          <motion.div
            className="mt-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative">
                <Input 
                  placeholder="Search posts, users, and ideas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-20 py-6 text-lg rounded-full border-2 border-primary/20 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 transition-all bg-background/70 backdrop-blur-sm"
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
            
            {/* Filter tags */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <div 
                className={cn(
                  "relative inline-flex cursor-pointer",
                  filterMenuOpen && "z-10"
                )}
              >
                <Button 
                  variant="outline" 
                  className="h-10 pl-4 pr-3 gap-1 bg-background/50 backdrop-blur-sm"
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  <ChevronDown className={cn("h-4 w-4 transition-transform", filterMenuOpen ? "transform rotate-180" : "")} />
                </Button>
                
                {filterMenuOpen && (
                  <div className="absolute top-12 right-0 w-64 bg-card rounded-lg border border-border shadow-lg z-20 p-3 animate-in fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Categories</h4>
                      {activeFilters.length > 0 && (
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={clearFilters}>
                          <X className="h-3 w-3 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {['Work', 'Philosophy', 'Art', 'literature', 'Cinema'].map(label => (
                        <div 
                          key={label}
                          className={cn(
                            "flex items-center px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                            activeFilters.includes(label) && "bg-primary/10"
                          )}
                          onClick={() => toggleFilter(label)}
                        >
                          <div className={cn(
                            "h-3 w-3 rounded-sm border mr-2",
                            activeFilters.includes(label) ? "bg-primary border-primary" : "border-border"
                          )} />
                          <span className="text-sm">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Active filter badges */}
              {activeFilters.map(filter => (
                <Badge 
                  key={filter} 
                  variant="secondary"
                  className="px-3 py-1 bg-primary/10 hover:bg-primary/20 cursor-pointer"
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 mb-16">
        {/* Popular Authors Visualization - Interactive Card Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center mb-6">
            <div className="h-8 w-2 bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full mr-3"></div>
            <h2 className="text-3xl font-bold">Popular Contributors</h2>
          </div>
          <PopularAuthorsViz
            authors={popularAuthors}
            loading={loadingAuthors}
            activeAuthor={activeAuthor}
            setActiveAuthor={setActiveAuthor}
          />
        </motion.section>

        {/* Search Results Section */}
        {searchQuery && (matchedUsers.length > 0 || filteredPosts.length > 0) ? (
          <div className="mb-8">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-8 p-1 bg-background/50 backdrop-blur-sm border border-border/40 rounded-full w-auto inline-flex">
                <TabsTrigger value="all" className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  All Results
                </TabsTrigger>
                <TabsTrigger value="posts" disabled={filteredPosts.length === 0} className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  Posts ({filteredPosts.length})
                </TabsTrigger>
                <TabsTrigger value="users" disabled={matchedUsers.length === 0} className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  Users ({matchedUsers.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6 outline-none">
                {/* Users section if any users found */}
                {matchedUsers.length > 0 && (
                  <motion.div 
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
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
                          profilePictureId={user.profilePictureId}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {/* Posts section if any posts found */}
                {filteredPosts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      Posts
                    </h2>
                    {renderColumnsLayout(filteredPosts, loading, hoveredPost, setHoveredPost)}
                  </motion.div>
                )}
              </TabsContent>
              
              <TabsContent value="posts" className="mt-6 outline-none">
                {filteredPosts.length > 0 ? (
                  renderColumnsLayout(filteredPosts, loading, hoveredPost, setHoveredPost)
                ) : (
                  <div className="text-center py-10">
                    <h3 className="text-lg font-medium">No posts found</h3>
                    <p className="text-muted-foreground">Try a different search term</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="users" className="mt-6 outline-none">
                {matchedUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchedUsers.map((user) => (
                      <UserCard
                        key={user.userId}
                        userId={user.userId}
                        name={user.name}
                        postCount={user.postCount}
                        profilePictureId={user.profilePictureId}
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

        {/* Main Posts Section - Recent Posts */}
        {!searchQuery && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center">
                <div className="h-8 w-2 bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full mr-3"></div>
                <h2 className="text-3xl font-bold">Discover Content</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button variant="ghost" className="gap-2" onClick={() => setFilterMenuOpen(!filterMenuOpen)}>
                    Sort by: {sortOption === 'latest' ? 'Latest' : sortOption === 'oldest' ? 'Oldest' : 'A-Z'}
                    <ChevronDown className={cn("h-4 w-4 transition-transform", filterMenuOpen ? "transform rotate-180" : "")} />
                  </Button>
                  
                  {filterMenuOpen && (
                    <div className="absolute top-10 right-0 w-48 bg-card rounded-lg border border-border shadow-lg z-20 p-2 animate-in fade-in">
                      <div 
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                          sortOption === 'latest' && "bg-primary/10 text-primary"
                        )}
                        onClick={() => {
                          handleSort('latest');
                          setFilterMenuOpen(false);
                        }}
                      >
                        <span className="text-sm">Latest first</span>
                      </div>
                      <div 
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                          sortOption === 'oldest' && "bg-primary/10 text-primary"
                        )}
                        onClick={() => {
                          handleSort('oldest');
                          setFilterMenuOpen(false);
                        }}
                      >
                        <span className="text-sm">Oldest first</span>
                      </div>
                      <div 
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                          sortOption === 'alphabetical' && "bg-primary/10 text-primary"
                        )}
                        onClick={() => {
                          handleSort('alphabetical');
                          setFilterMenuOpen(false);
                        }}
                      >
                        <span className="text-sm">Alphabetical (A-Z)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 3D Carousel for Top 10 Latest Posts */}
            <ThreeDCarousel
              posts={filteredPosts.slice(0, 10)}
              onRead={(id) => {
                // Use router to navigate to the post detail page
                router.push(`/post/${id}`);
              }}
            />
           
            {/* Trending categories shortcuts */}
            <div className="flex flex-wrap gap-3 mb-8">
              {['Work', 'Philosophy', 'Art', 'literature', 'Cinema'].map(category => (
                <Button 
                  key={category}
                  variant={activeFilters.includes(category) ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full",
                    activeFilters.includes(category) ? 
                      "bg-primary text-primary-foreground" : 
                      "hover:bg-primary/10 hover:text-primary hover:border-primary"
                  )}
                  onClick={() => toggleFilter(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
           
            {/* More Posts Grid - Show posts not in the carousel */}
            {filteredPosts.length > 10 && (
              <div className="mt-20">
                <h3 className="text-2xl font-semibold mb-6">More Posts</h3>
                {renderColumnsLayout(filteredPosts.slice(10), loading, hoveredPost, setHoveredPost)}
                
                <div className="mt-12 text-center">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="px-10 h-12 border-2 hover:bg-foreground/5 hover:border-[var(--gradient-start)] transition-colors"
                  >
                    Load More
                  </Button>
                </div>
              </div>
            )}
          </motion.section>
        )}
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
        return (
          <motion.div 
            key={columnIndex}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: columnIndex * 0.15,
              ease: "easeOut"
            }}
          >
            {columnPosts.map((post, postIndex) => (
              <motion.div 
                key={post.$id}
                className="transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: columnIndex * 0.15 + postIndex * 0.05,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  y: -5, 
                  transition: { duration: 0.2 }
                }}
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
                  visibility={post.visibility}
                  groupIds={post.group_id}
                  className={`${hoveredPost === post.$id ? 'shadow-xl border-primary' : 'shadow-sm'}`}
                  label={post.label}
                />
              </motion.div>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
}

