'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getUserById, getProfilePictureUrl, getPrivatePosts, getUserBlogPosts } from '@/lib/appwrite';
import { PostCard } from '@/components/ui/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Calendar, User, Lock, Users, BookOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupManager } from '@/components/ui/GroupManager';
import { Button } from '@/components/ui/button';

// Define Post type for posts in user profile
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
  label?: 'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema';
}

// Define UserProfile interface
interface UserProfile {
  userId: string;
  name: string;
  posts: Post[];
  profilePictureId?: string | null;
  profile_picture?: string | null;
  bio?: string | null;
  $createdAt: string;
  hasMorePublicStandardPosts?: boolean;
}

const POST_LIMIT_STANDARD = 9;
const POST_LIMIT_BLOG = 9;
const POST_LIMIT_PRIVATE = 9;

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privatePosts, setPrivatePosts] = useState<Post[]>([]);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState('public');
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(false);
  
  // --- Pagination State ---
  // Public Standard Posts (managed within user state)
  const [lastPublicStandardPostId, setLastPublicStandardPostId] = useState<string | undefined>(undefined);
  const [isLoadingMorePublic, setIsLoadingMorePublic] = useState(false);
  // Blog Posts
  const [lastBlogPostId, setLastBlogPostId] = useState<string | undefined>(undefined);
  const [hasMoreBlogPosts, setHasMoreBlogPosts] = useState(true);
  const [isLoadingMoreBlog, setIsLoadingMoreBlog] = useState(false);
  // Private Posts
  const [lastPrivatePostId, setLastPrivatePostId] = useState<string | undefined>(undefined);
  const [hasMorePrivatePosts, setHasMorePrivatePosts] = useState(true);
  const [isLoadingMorePrivate, setIsLoadingMorePrivate] = useState(false);
  // --- End Pagination State ---
  
  const isOwnProfile = currentUser && currentUser.$id === id;
  const userId = id as string;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      
      setLoading(true);
      setLoadingBlog(true);
      if (isOwnProfile) setLoadingPrivate(true);
      setError(null);
      setUser(null);
      setBlogPosts([]);
      setPrivatePosts([]);
      setLastPublicStandardPostId(undefined);
      setLastBlogPostId(undefined);
      setLastPrivatePostId(undefined);
      setHasMoreBlogPosts(true);
      setHasMorePrivatePosts(true);
      setIsLoadingMorePublic(false);
      setIsLoadingMoreBlog(false);
      setIsLoadingMorePrivate(false);

      try {
        // Prepare promises for initial fetches
        const promises: Promise<unknown>[] = [
          getUserById(userId, POST_LIMIT_STANDARD),       // Fetch basic user data + first page public standard posts
          getUserBlogPosts(userId, POST_LIMIT_BLOG),  // Fetch first page blog posts
        ];
        
        if (isOwnProfile) {
          promises.push(getPrivatePosts(POST_LIMIT_PRIVATE)); // Add first page private posts fetch if owner
        }

        const results = await Promise.allSettled(promises);

        // --- Process UserById result ---
        const userResult = results[0];
        if (userResult.status === 'fulfilled' && userResult.value) {
          const userData = userResult.value as UserProfile; // Cast result to UserProfile
          const initialStandardPosts = (userData.posts || []) as Post[];
          setUser({
            ...userData, // Spread base user data
            posts: initialStandardPosts, // Set initial standard posts
            hasMorePublicStandardPosts: userData.hasMorePublicStandardPosts === true // Get flag from API
          });
           if (initialStandardPosts.length > 0) {
             setLastPublicStandardPostId(initialStandardPosts[initialStandardPosts.length - 1].$id);
           }
        } else {
          console.error('Error fetching user:', userResult.status === 'rejected' ? userResult.reason : 'Null value');
          setError('Could not load user profile');
          setLoading(false); // Stop loading if essential user data fails
          return; // Stop processing if user fetch failed
        }

        // --- Process BlogPosts result ---
        const blogResult = results[1];
        if (blogResult.status === 'fulfilled' && blogResult.value) {
          const result = blogResult.value as { documents: Post[] }; 
          if (result && Array.isArray(result.documents)) { 
            const initialBlogPosts = result.documents;
            setBlogPosts(initialBlogPosts);
            if (initialBlogPosts.length > 0) {
              setLastBlogPostId(initialBlogPosts[initialBlogPosts.length - 1].$id);
            }
            setHasMoreBlogPosts(initialBlogPosts.length === POST_LIMIT_BLOG);
          } else { setHasMoreBlogPosts(false); }
        } else {
           if (blogResult.status === 'rejected') {
             console.error('Error fetching blog posts:', blogResult.reason);
           } else {
             console.error('Error fetching blog posts: Unknown error or null value');
           }
           setHasMoreBlogPosts(false);
        }

        // --- Process PrivatePosts result (if fetched) ---
        if (isOwnProfile) {
          const privateResult = results[2];
          if (privateResult.status === 'fulfilled' && privateResult.value) { 
            const result = privateResult.value as { documents: Post[] }; 
            if (result && Array.isArray(result.documents)) {
              const initialPrivatePosts = result.documents;
              setPrivatePosts(initialPrivatePosts);
              if (initialPrivatePosts.length > 0) {
                setLastPrivatePostId(initialPrivatePosts[initialPrivatePosts.length - 1].$id);
              }
              setHasMorePrivatePosts(initialPrivatePosts.length === POST_LIMIT_PRIVATE);
            } else { setHasMorePrivatePosts(false); } 
          } else {
             if (privateResult.status === 'rejected') {
               console.error('Error fetching private posts:', privateResult.reason);
             } else {
               console.error('Error fetching private posts: Unknown error or null value');
             }
             setHasMorePrivatePosts(false);
          }
        }
      } catch (err) { 
        console.error('Unexpected error fetching profile data:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false); // Overall loading complete
        setLoadingBlog(false);
        if(isOwnProfile) setLoadingPrivate(false);
      }
    };

    fetchProfileData();
  }, [userId, isOwnProfile]);

  // --- Load More Functions ---
  const loadMorePublicStandardPosts = useCallback(async () => {
    if (!user || isLoadingMorePublic || !user.hasMorePublicStandardPosts || !lastPublicStandardPostId) return;

    setIsLoadingMorePublic(true);
    try {
      // Call getUserById again, but only for the next page of posts
      // We need a way to fetch *only* posts without re-fetching user details?
      // Option A: Modify getUserById further (complex)
      // Option B: Create a new function getPublicStandardPosts(userId, limit, cursor)
      // Option C: Re-fetch user data but only use the new posts (simpler for now)
      const userData = await getUserById(userId, POST_LIMIT_STANDARD, lastPublicStandardPostId);
      
      if (userData && Array.isArray(userData.posts)) {
        const newPosts = userData.posts as unknown as Post[];
        setUser(prevUser => prevUser ? ({ 
            ...prevUser,
            posts: [...prevUser.posts, ...newPosts],
            hasMorePublicStandardPosts: userData.hasMorePublicStandardPosts === true
        }) : null);

        if (newPosts.length > 0) {
          setLastPublicStandardPostId(newPosts[newPosts.length - 1].$id);
        }
      }
    } catch (error) {
      console.error('Error loading more public posts:', error);
      setUser(prevUser => prevUser ? ({ ...prevUser, hasMorePublicStandardPosts: false }) : null);
    } finally {
      setIsLoadingMorePublic(false);
    }
  }, [user, isLoadingMorePublic, lastPublicStandardPostId, userId]);

  const loadMoreBlogPosts = useCallback(async () => {
    if (isLoadingMoreBlog || !hasMoreBlogPosts || !lastBlogPostId) return;
    setIsLoadingMoreBlog(true);
    try {
      const resultData = await getUserBlogPosts(userId, POST_LIMIT_BLOG, lastBlogPostId);
      if (resultData && Array.isArray(resultData.documents)) {
        const newPosts = resultData.documents as unknown as Post[];
        setBlogPosts(prev => [...prev, ...newPosts]);
        if (newPosts.length > 0) {
          setLastBlogPostId(newPosts[newPosts.length - 1].$id);
        }
        setHasMoreBlogPosts(newPosts.length === POST_LIMIT_BLOG);
      }
    } catch (error) {
      console.error('Error loading more blog posts:', error);
      setHasMoreBlogPosts(false);
    } finally {
      setIsLoadingMoreBlog(false);
    }
  }, [isLoadingMoreBlog, hasMoreBlogPosts, lastBlogPostId, userId]);

  const loadMorePrivatePosts = useCallback(async () => {
    if (isLoadingMorePrivate || !hasMorePrivatePosts || !lastPrivatePostId) return;
    setIsLoadingMorePrivate(true);
    try {
      const resultData = await getPrivatePosts(POST_LIMIT_PRIVATE, lastPrivatePostId);
      if (resultData && Array.isArray(resultData.documents)) {
        const newPosts = resultData.documents as unknown as Post[];
        setPrivatePosts(prev => [...prev, ...newPosts]);
        if (newPosts.length > 0) {
          setLastPrivatePostId(newPosts[newPosts.length - 1].$id);
        }
        setHasMorePrivatePosts(newPosts.length === POST_LIMIT_PRIVATE);
      }
    } catch (error) {
      console.error('Error loading more private posts:', error);
      setHasMorePrivatePosts(false);
    } finally {
      setIsLoadingMorePrivate(false);
    }
  }, [isLoadingMorePrivate, hasMorePrivatePosts, lastPrivatePostId]);

  if (loading && !user) { // Show main loading skeleton only if user data hasn't loaded yet
    return (
      <div className="container max-w-7xl py-10 animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-4xl animate-pulse">
            <div className="h-48 bg-secondary rounded-t-xl mb-0"></div>
            <div className="h-32 bg-secondary/30 rounded-b-xl mb-6 relative">
              <div className="absolute -top-8 left-10 h-24 w-24 rounded-full bg-secondary"></div>
            </div>
            <div className="h-8 bg-secondary rounded w-1/3 mb-4 mx-auto"></div>
            <div className="h-4 bg-secondary rounded w-1/2 mb-8 mx-auto"></div>
            <div className="h-10 bg-secondary rounded w-full mb-6"></div>
            <div className="h-64 bg-secondary rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container max-w-7xl py-10 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <Card className="w-full max-w-md p-6">
            <CardContent className="pt-6">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
              <p className="text-muted-foreground">
                {error || "The user you're looking for doesn't exist or has been removed."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const memberSince = user.$createdAt
    ? format(new Date(user.$createdAt), 'MMMM yyyy') 
    : 'Unknown';
  
  const profilePictureId = user.profilePictureId || user.profile_picture;
  const profilePictureUrl = profilePictureId 
    ? getProfilePictureUrl(profilePictureId).toString() 
    : null;

  console.log("Profile data:", { 
    userId: user.userId, 
    name: user.name, 
    profilePictureId, 
    profilePictureUrl 
  });


  return (
    <div className="container max-w-7xl mx-auto py-10 animate-fade-in px-4 sm:px-6">
      {/* Profile header */}
      <div className="mb-8">
        <Card className="overflow-hidden border shadow-sm">
          {/* Banner */}
          <div className="bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 h-48 relative"></div>
          
          {/* Profile content area */}
          <div className="relative px-6 pt-0 pb-6 sm:px-8">
            {/* Profile picture */}
            <div className="absolute -top-16 left-6 sm:left-8 h-32 w-32 rounded-full border-4 border-background overflow-hidden bg-secondary shadow-md">
              {profilePictureUrl ? (
                <Image 
                  src={profilePictureUrl}
                  alt={user.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary-foreground">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Profile info */}
            <div className="pt-16 pl-2">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground text-sm">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  <span>{user.posts.length} posts</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  <span>Member since {memberSince}</span>
                </div>
              </div>
              
              {user.bio && (
                <div className="mt-4 text-sm leading-relaxed max-w-prose">
                  <p>{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Content tabs */}
      <div className="mt-8">
        <Tabs defaultValue="public" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b mb-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:max-w-2xl">
              <TabsTrigger value="public" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Blog
              </TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="private" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Groups
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="public" className="mt-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              Public Posts by {user.name}
            </h2>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : user?.posts?.length === 0 ? (
              <div className="text-center py-10 bg-secondary/10 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium">No public posts yet</h3>
                <p className="text-muted-foreground mt-2">
                  {isOwnProfile ? "You haven't published any public standard posts." : "This user hasn't published any public standard posts."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user?.posts?.map((post: Post) => (
                    <PostCard
                      key={post.$id}
                      id={post.$id}
                      title={post.title}
                      content={post.content}
                      createdAt={post.created_at}
                      imageId={post.image}
                      userName={post.user_name}
                      className="h-full"
                      visibility={post.visibility}
                      groupIds={post.group_id}
                      postType={post.post_type}
                      label={post.label}
                    />
                  ))}
                </div>
                {/* Load More Button for Public Posts */} 
                {user?.hasMorePublicStandardPosts && (
                  <div className="mt-8 flex justify-center">
                    <Button 
                      onClick={loadMorePublicStandardPosts} 
                      disabled={isLoadingMorePublic}
                      variant="outline"
                    >
                      {isLoadingMorePublic ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                      ) : (
                        'Load More Public Posts'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="blog" className="mt-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Blog Posts by {user.name}
            </h2>
            {loadingBlog ? ( 
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="text-center py-10 bg-secondary/10 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium">No blog posts yet</h3>
                <p className="text-muted-foreground mt-2">
                  {isOwnProfile ? "You haven't published any blog posts." : "This user hasn't published any blog posts."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogPosts.map((post: Post) => (
                    <PostCard
                      key={post.$id}
                      id={post.$id}
                      title={post.title}
                      content={post.content}
                      createdAt={post.created_at}
                      imageId={post.image}
                      userName={post.user_name}
                      className="h-full"
                      visibility={post.visibility}
                      groupIds={post.group_id}
                      postType={post.post_type}
                      label={post.label}
                    />
                  ))}
                </div>
                {/* Load More Button for Blog Posts */} 
                {hasMoreBlogPosts && (
                  <div className="mt-8 flex justify-center">
                    <Button 
                      onClick={loadMoreBlogPosts} 
                      disabled={isLoadingMoreBlog}
                      variant="outline"
                    >
                      {isLoadingMoreBlog ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                      ) : (
                        'Load More Blog Posts'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {isOwnProfile && (
            <TabsContent value="private" className="mt-2">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary" />
                My Private Posts
              </h2>
              {loadingPrivate ? ( 
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : privatePosts.length === 0 ? (
                <div className="text-center py-10 bg-secondary/10 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium">No private posts yet</h3>
                  <p className="text-muted-foreground mt-2">Posts marked as private will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {privatePosts.map((post: Post) => (
                      <PostCard
                        key={post.$id}
                        id={post.$id}
                        title={post.title}
                        content={post.content}
                        createdAt={post.created_at}
                        imageId={post.image}
                        userName={post.user_name}
                        className="h-full"
                        visibility={post.visibility}
                        groupIds={post.group_id}
                        postType={post.post_type}
                        label={post.label}
                      />
                    ))}
                  </div>
                  {/* Load More Button for Private Posts */} 
                  {hasMorePrivatePosts && (
                    <div className="mt-8 flex justify-center">
                      <Button 
                        onClick={loadMorePrivatePosts} 
                        disabled={isLoadingMorePrivate}
                        variant="outline"
                      >
                        {isLoadingMorePrivate ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                        ) : (
                          'Load More Private Posts'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          )}

          {isOwnProfile && (
            <TabsContent value="groups" className="mt-2">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                My Groups
              </h2>
              <GroupManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
} 