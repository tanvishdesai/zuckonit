"use client"

import { useEffect, useState, useRef } from "react";
import { getVisiblePosts, bookmarkPost, removeBookmark, getUserBookmarks } from "@/lib/appwrite"
import { PostCard } from "@/components/ui/PostCard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, TrendingUp, Clock, Bookmark, Filter, ChevronDown, ArrowRight, X, Heart, Sparkles, Pen, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion" 
import type { Models } from "appwrite";

interface PostDocument extends Models.Document {
  title: string;
  content: string;
  created_at: string;
  image?: string;
  user_name?: string;
  visibility?: 'public' | 'private' | 'groups';
  group_id?: string[];
  label?: 'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema';
}

interface PostsState {
  documents: PostDocument[];
  total: number;
}

export default function Home() {
  const [posts, setPosts] = useState<PostsState | null>(null);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedLoading, setIsSavedLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  
  // Auth context
  const { user } = useAuth();
  
  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null);
  const parallaxContainers = useRef<HTMLElement[]>([]);
  const isMobileRef = useRef(false);

  // New state for particle animation
  const [particles, setParticles] = useState<Array<{x: number, y: number, size: number, color: string, speed: number}>>([]);
  const [activeWord, setActiveWord] = useState(0);
  const words = ["Express", "Connect", "Create", "Inspire", "Share"];
  const particlesRef = useRef<HTMLDivElement>(null);
  
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
    
    // Check if mobile
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Fetch user's bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setBookmarkedPosts([]);
        setSavedPosts([]);
        setIsSavedLoading(false);
        return;
      }
      
      try {
        setIsSavedLoading(true);
        const bookmarks = await getUserBookmarks();
        if (bookmarks && bookmarks.documents) {
          // Extract post IDs from bookmarks
          const bookmarkedIds = bookmarks.documents.map(bookmark => bookmark.post_id);
          setBookmarkedPosts(bookmarkedIds);
          
          // Extract post data from bookmarks - each bookmark now has a post property added by getUserBookmarks
          const savedPostsData = bookmarks.documents
            .filter(bookmark => bookmark.post) // Filter out any bookmarks where post was not found
            .map(bookmark => bookmark.post);
          
          if (savedPostsData.length > 0) {
            setSavedPosts(savedPostsData);
          } else {
            setSavedPosts([]);
          }
        }
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
        toast.error("Failed to load your bookmarks");
      } finally {
        setIsSavedLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  // 3D hero animation
  useEffect(() => {
    if (!heroRef.current || isMobileRef.current) return;
    
    const hero = heroRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobileRef.current) return;
      
      const { left, top, width, height } = hero.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      
      hero.style.transform = `
        perspective(1000px)
        rotateX(${y * -8}deg)
        rotateY(${x * 8}deg)
        translateZ(20px)
      `;
      
      // Move gradient
      hero.style.backgroundPosition = `${x * 100 + 50}% ${y * 100 + 50}%`;
    };
    
    const handleMouseLeave = () => {
      hero.style.transform = `
        perspective(1000px)
        rotateX(0deg)
        rotateY(0deg)
        translateZ(0)
      `;
      hero.style.backgroundPosition = '50% 50%';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    hero.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  // Parallax effect for post cards
  useEffect(() => {
    // Add parallax effect to containers
    const containers = document.querySelectorAll<HTMLElement>('.parallax-container');
    parallaxContainers.current = Array.from(containers);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobileRef.current) return;
      
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
            container.style.transform = `perspective(1000px) rotateY(${relX * 4}deg) rotateX(${-relY * 4}deg) scale(1.02)`;
          }
        });
      });
    };
    
    // Add individual container mouse enter/leave handlers
    parallaxContainers.current.forEach(container => {
      container.addEventListener('mouseenter', () => {
        container.style.transition = 'transform 0.2s ease-out';
      });
      
      container.addEventListener('mouseleave', () => {
        container.style.transition = 'transform 0.5s ease-out';
        container.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
      });
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      
      // Clean up individual container listeners
      parallaxContainers.current.forEach(container => {
        container.removeEventListener('mouseenter', () => {});
        container.removeEventListener('mouseleave', () => {});
      });
    };
  }, [posts, savedPosts]);
  
  // Create particles for the hero background
  useEffect(() => {
    const count = isMobileRef.current ? 15 : 30;
    const colors = [
      'rgba(var(--gradient-start-rgb), 0.4)',
      'rgba(var(--gradient-end-rgb), 0.4)',
      'rgba(var(--primary-rgb), 0.3)',
      'rgba(var(--foreground-rgb), 0.1)'
    ];
    
    const newParticles = Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 0.4 + 0.1
    }));
    
    setParticles(newParticles);
    
    // Auto rotate the featured word
    const wordInterval = setInterval(() => {
      setActiveWord(prev => (prev + 1) % words.length);
    }, 3000);
    
    return () => clearInterval(wordInterval);
  }, [isMobileRef]);
  
  // Particle animation effect
  useEffect(() => {
    if (!particlesRef.current || particles.length === 0) return;
    
    let animationId: number;
    const particleElements = particlesRef.current.children;
    
    const animateParticles = () => {
      const newParticles = [...particles];
      
      for (let i = 0; i < newParticles.length; i++) {
        if (i < particleElements.length) {
          const particle = newParticles[i];
          const element = particleElements[i] as HTMLElement;
          
          // Update position
          particle.y -= particle.speed;
          if (particle.y < -10) {
            particle.y = 110; // Reset to bottom
            particle.x = Math.random() * 100;
          }
          
          // Apply position
          element.style.top = `${particle.y}%`;
          element.style.left = `${particle.x}%`;
        }
      }
      
      animationId = requestAnimationFrame(animateParticles);
    };
    
    animateParticles();
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [particles]);
  
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
  
  const filterLabels = ['Work', 'Philosophy', 'Art', 'literature', 'Cinema'] as const;
  
  // Bookmark handling
  const handleBookmark = async (postId: string) => {
    if (!user) {
      toast.error("Please sign in to bookmark posts");
      return;
    }
    
    try {
      if (bookmarkedPosts.includes(postId)) {
        // Remove bookmark
        await removeBookmark(postId);
        setBookmarkedPosts(prev => prev.filter(id => id !== postId));
        setSavedPosts(prev => prev.filter(post => post.$id !== postId));
        toast.success("Post removed from bookmarks");
      } else {
        // Add bookmark
        await bookmarkPost(postId);
        setBookmarkedPosts(prev => [...prev, postId]);
        
        // Add to saved posts if we know the post data
        const postToAdd = posts?.documents.find(post => post.$id === postId);
        if (postToAdd) {
          setSavedPosts(prev => [...prev, postToAdd]);
        }
        
        toast.success("Post added to bookmarks");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-primary animate-spin mb-4"></div>
        <p className="text-muted-foreground">Curating content for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-muted/30 backdrop-blur-md rounded-xl border border-border/40 max-w-3xl mx-auto mt-12">
        <h2 className="text-2xl font-semibold mb-3">Failed to load posts</h2>
        <p className="text-muted-foreground mb-6">
          {error?.message || "We're having trouble loading posts right now. Please try again later."}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Filter posts based on search query and category filters
  const filteredPosts = posts?.documents.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilters = activeFilters.length === 0 || 
      (post.label && activeFilters.includes(post.label));
      
    return matchesSearch && matchesFilters;
  });
  
  // Filter saved posts with the same criteria
  const filteredSavedPosts = savedPosts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilters = activeFilters.length === 0 || 
      (post.label && activeFilters.includes(post.label));
      
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="pb-16">
      {/* Enhanced Hero Section with 3D Effect */}
      <div 
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center justify-center mb-24 bg-gradient-to-br from-[var(--gradient-start)] via-background to-[var(--gradient-end)] overflow-hidden"
        style={{
          backgroundSize: '200% 200%',
          backgroundPosition: '50% 50%',
          transition: 'transform 0.3s ease, background-position 0.5s ease',
        }}
      >
        {/* Particle animation container */}
        <div ref={particlesRef} className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle, i) => (
            <div 
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                top: `${particle.y}%`,
                left: `${particle.x}%`,
                opacity: particle.size / 8,
                filter: `blur(${particle.size / 4}px)`,
                transition: 'transform 0.1s linear',
              }}
            />
          ))}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-12 w-64 h-64 bg-gradient-to-r from-[var(--gradient-start)] to-transparent rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 -right-12 w-80 h-80 bg-gradient-to-l from-[var(--gradient-end)] to-transparent rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute top-[60%] right-[20%] w-40 h-40 bg-gradient-to-tr from-[var(--gradient-start)] to-transparent rounded-full filter blur-2xl opacity-10"></div>
        
        {/* Abstract decorative SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--gradient-start)', stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: 'var(--gradient-end)', stopOpacity: 0.5 }} />
              </linearGradient>
            </defs>
            <path d="M0,20 Q30,40 50,20 T100,40 V100 H0 Z" fill="url(#grad1)" />
            <path d="M0,40 Q40,80 80,40 T100,60 V100 H0 Z" fill="url(#grad1)" opacity="0.5" />
          </svg>
        </div>
        
        {/* Floating shapes */}
        <motion.div 
          className="absolute top-[15%] left-[10%] w-20 h-20 border-2 border-primary/20 rounded-lg rotate-12 opacity-70"
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
          className="absolute bottom-[20%] right-[15%] w-24 h-24 border-2 border-[var(--gradient-end)]/20 rounded-full opacity-70"
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
        
        <motion.div 
          className="absolute top-[60%] left-[20%] w-12 h-12 border-2 border-[var(--gradient-start)]/20 rounded-md rotate-45 opacity-70"
          animate={{ 
            y: [0, 15, 0], 
            rotate: [45, 30, 45],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        
        {/* Animated accent icons */}
        <motion.div 
          className="absolute top-[30%] right-[30%] text-primary/30"
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
        
        <motion.div 
          className="absolute bottom-[40%] left-[25%] text-[var(--gradient-end)]/30"
          animate={{ 
            y: [0, 10, 0], 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        >
          <Pen size={28} />
        </motion.div>
        
        <motion.div 
          className="absolute top-[50%] right-[15%] text-[var(--gradient-start)]/30"
          animate={{ 
            y: [0, 15, 0], 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8
          }}
        >
          <Globe size={32} />
        </motion.div>
        
        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise opacity-5"></div>
        
        <div className="container relative z-10 text-center px-4 py-24 max-w-4xl mx-auto transition-all duration-500">
          {/* Animated title with highlighting */}
          <div className="relative mb-6 h-[7rem] md:h-[8.5rem]">
            {words.map((word, index) => (
              <motion.h1
                key={word}
                className={cn(
                  "absolute inset-0 text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r transition-all duration-300 flex items-center justify-center",
                  index === activeWord ? "from-foreground to-foreground/70 opacity-100 scale-100" : "from-foreground/30 to-foreground/10 opacity-0 scale-95"
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: index === activeWord ? 1 : 0,
                  scale: index === activeWord ? 1 : 0.9,
                  y: index === activeWord ? 0 : 10
                }}
                transition={{ duration: 0.5 }}
              >
                {word}
              </motion.h1>
            ))}
          </div>
          
          <motion.div 
            className="w-32 h-1.5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] mx-auto rounded-full my-8"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "8rem", opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          
          <motion.p 
            className="mt-8 text-xl md:text-2xl font-light text-foreground/80 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            A minimalist platform for authentic voices and creative minds. Share your journey with the world.
          </motion.p>
          
          <motion.div 
            className="mt-12 flex flex-col sm:flex-row justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button 
              size="lg" 
              className="h-14 px-10 text-base font-medium group relative overflow-hidden bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:shadow-glow transition-all duration-300" 
              asChild
            >
              <Link href="/create">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="flex items-center"
                >
                  <Pen className="mr-2 h-4 w-4" />
                  Start Writing
                </motion.span>
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-10 text-base font-medium border-2 backdrop-blur-sm hover:bg-foreground/5 hover:border-[var(--gradient-start)] transition-colors" 
              asChild
            >
              <Link href="/explore">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="flex items-center"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Explore Content
                </motion.span>
              </Link>
            </Button>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-70"
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <ArrowRight className="h-10 w-10 transform rotate-90 stroke-[1.5px]" />
          </motion.div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Search and Filters */}
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for topics, authors, or content..." 
                className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="h-12 pl-4 pr-3 gap-1 bg-background/50"
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  <ChevronDown className={cn("h-4 w-4 transition-transform", filterMenuOpen ? "transform rotate-180" : "")} />
                </Button>
                
                {filterMenuOpen && (
                  <div className="absolute top-14 right-0 w-64 bg-card rounded-lg border border-border shadow-lg z-20 p-3 animate-in fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Categories</h4>
                      {activeFilters.length > 0 && (
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={clearFilters}>
                          <X className="h-3 w-3 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {filterLabels.map(label => (
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
              
              <Button
                className="h-12 bg-primary hover:bg-primary/90 shadow transition-all"
                asChild
              >
                <Link href="/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Post
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
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
          )}
        </div>
        
        {/* Tabs and Content */}
        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="mb-8 p-1 bg-background/50 backdrop-blur-sm border border-border/40 rounded-full w-auto inline-flex">
            <TabsTrigger value="latest" className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Clock className="h-4 w-4 mr-2" />
              Latest
            </TabsTrigger>
            <TabsTrigger value="trending" className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="latest" className="space-y-12 outline-none">
            {!filteredPosts || filteredPosts.length === 0 ? (
              <div className="text-center py-24 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/40">
                {searchQuery || activeFilters.length > 0 ? (
                  <>
                    <h2 className="text-2xl font-semibold mb-3">No matching posts found</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Try adjusting your search query or filters to find what you are looking for.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Featured Posts Carousel */}
                {filteredPosts.length > 0 && (
                  <div className="mb-16">
                    <div className="flex items-center mb-6">
                      <div className="h-8 w-2 bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full mr-3"></div>
                      <h2 className="text-3xl font-bold">Editor Picks</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border/40 hover:shadow-xl transition-all duration-300 group parallax-container">
                        <div className="absolute top-3 right-3 z-20">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-colors",
                              bookmarkedPosts.includes(filteredPosts[0]?.$id || '') && "text-primary hover:text-primary"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (filteredPosts[0]?.$id) {
                                handleBookmark(filteredPosts[0].$id);
                              }
                            }}
                          >
                            <Bookmark 
                              className={cn(
                                "h-4 w-4 transition-transform hover:scale-110",
                                filteredPosts[0]?.$id && bookmarkedPosts.includes(filteredPosts[0].$id) && "fill-primary"
                              )} 
                            />
                          </Button>
                        </div>
                        
                        <PostCard
                          key={filteredPosts[0]?.$id}
                          id={filteredPosts[0]?.$id || ''}
                          title={filteredPosts[0]?.title || ''}
                          content={filteredPosts[0]?.content || ''}
                          createdAt={filteredPosts[0]?.created_at || ''}
                          imageId={filteredPosts[0]?.image}
                          userName={filteredPosts[0]?.user_name}
                          featured={true}
                          visibility={filteredPosts[0]?.visibility}
                          groupIds={filteredPosts[0]?.group_id}
                          label={filteredPosts[0]?.label}
                        />
                      </div>
                      
                      {filteredPosts.length > 1 && (
                        <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border/40 hover:shadow-xl transition-all duration-300 group parallax-container">
                          <div className="absolute top-3 right-3 z-20">
                            <Button
                              size="icon"
                              variant="ghost"
                              className={cn(
                                "h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-colors",
                                bookmarkedPosts.includes(filteredPosts[1]?.$id || '') && "text-primary hover:text-primary"
                              )}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (filteredPosts[1]?.$id) {
                                  handleBookmark(filteredPosts[1].$id);
                                }
                              }}
                            >
                              <Bookmark 
                                className={cn(
                                  "h-4 w-4 transition-transform hover:scale-110",
                                  filteredPosts[1]?.$id && bookmarkedPosts.includes(filteredPosts[1].$id) && "fill-primary"
                                )} 
                              />
                            </Button>
                          </div>
                          
                          <PostCard
                            key={filteredPosts[1]?.$id}
                            id={filteredPosts[1]?.$id || ''}
                            title={filteredPosts[1]?.title || ''}
                            content={filteredPosts[1]?.content || ''}
                            createdAt={filteredPosts[1]?.created_at || ''}
                            imageId={filteredPosts[1]?.image}
                            userName={filteredPosts[1]?.user_name}
                            featured={true}
                            visibility={filteredPosts[1]?.visibility}
                            groupIds={filteredPosts[1]?.group_id}
                            label={filteredPosts[1]?.label}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* All Posts Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="h-8 w-2 bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full mr-3"></div>
                      <h2 className="text-3xl font-bold">Latest Posts</h2>
                    </div>
                    
                    <Button variant="ghost" className="gap-2">
                      View All <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.slice(2).map((post) => (
                      <div
                        key={post.$id}
                        className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/40 group hover:scale-[1.01] relative parallax-container"
                        style={{ 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <div className="absolute top-3 right-3 z-20">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-colors",
                              bookmarkedPosts.includes(post.$id) && "text-primary hover:text-primary"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBookmark(post.$id);
                            }}
                          >
                            <Bookmark 
                              className={cn(
                                "h-4 w-4 transition-transform hover:scale-110",
                                bookmarkedPosts.includes(post.$id) && "fill-primary"
                              )} 
                            />
                          </Button>
                        </div>
                        
                        <PostCard
                          id={post.$id}
                          title={post.title}
                          content={post.content}
                          createdAt={post.created_at}
                          imageId={post.image}
                          userName={post.user_name}
                          visibility={post.visibility}
                          groupIds={post.group_id}
                          label={post.label}
                        />
                      </div>
                    ))}
                  </div>

                  {filteredPosts.length > 5 && (
                    <div className="mt-12 text-center">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="px-10 h-12 border-2 hover:bg-foreground/5 hover:border-[var(--gradient-start)] transition-colors"
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="trending" className="outline-none">
            <div className="text-center py-24 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/40">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground/60" />
              <h2 className="text-2xl font-semibold mb-3">Trending Posts Coming Soon</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We are working on bringing you trending content filtered by engagement and popularity.
              </p>
              <Button 
                variant="outline" 
                className="border-2 hover:bg-foreground/5 hover:border-[var(--gradient-start)] transition-colors"
                asChild
              >
                <Link href="/latest">
                  Browse Latest Posts Instead
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="outline-none">
            {!user ? (
              <div className="text-center py-24 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/40">
                <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground/60" />
                <h2 className="text-2xl font-semibold mb-3">Your Bookmarks</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Sign in to bookmark posts and access them from any device.
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90 transition-colors"
                  asChild
                >
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            ) : isSavedLoading ? (
              <div className="flex flex-col justify-center items-center py-24">
                <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-primary animate-spin mb-4"></div>
                <p className="text-muted-foreground">Loading your bookmarks...</p>
              </div>
            ) : filteredSavedPosts.length === 0 ? (
              <div className="text-center py-24 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/40">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/60" />
                <h2 className="text-2xl font-semibold mb-3">No bookmarks yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Bookmark posts you love to find them easily later.
                </p>
                <Button 
                  variant="outline" 
                  className="border-2 hover:bg-foreground/5 hover:border-[var(--gradient-start)] transition-colors"
                  asChild
                >
                  <Link href="/latest">
                    Browse Posts to Bookmark
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex items-center mb-6">
                  <div className="h-8 w-2 bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full mr-3"></div>
                  <h2 className="text-3xl font-bold">Your Bookmarks</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredSavedPosts.map((post) => (
                    <div
                      key={post.$id}
                      className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/40 group hover:scale-[1.01] relative parallax-container"
                      style={{ 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <div className="absolute top-3 right-3 z-20">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-colors text-primary hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleBookmark(post.$id);
                          }}
                        >
                          <Bookmark 
                            className="h-4 w-4 transition-transform hover:scale-110 fill-primary" 
                          />
                        </Button>
                      </div>
                      
                      <PostCard
                        id={post.$id}
                        title={post.title}
                        content={post.content}
                        createdAt={post.created_at}
                        imageId={post.image}
                        userName={post.user_name}
                        visibility={post.visibility}
                        groupIds={post.group_id}
                        label={post.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Newsletter Section */}
        <section className="bg-gradient-to-br from-[var(--gradient-start)]/10 to-[var(--gradient-end)]/10 backdrop-blur-sm rounded-2xl p-10 border border-border/40 shadow-lg">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay in the loop</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get notified about new features, content, and community updates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                placeholder="Enter your email" 
                className="h-12 bg-background/70 border-border/50 focus:border-primary"
              />
              <Button className="h-12 bg-primary hover:bg-primary/90 transition-colors px-6">
                Subscribe
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              By subscribing, you agree to our Privacy Policy and Terms of Service.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

