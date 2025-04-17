'use client';

import { useState, useEffect } from 'react';
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
}

// Define UserProfile interface
interface UserProfile {
  userId: string;
  name: string;
  postCount: number;
  posts: Post[];
  profilePictureId?: string | null;
  profile_picture?: string | null;
  bio?: string | null;
  $createdAt: string;
}

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
  
  const isOwnProfile = currentUser && currentUser.$id === id;
  const userId = id as string;

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        
        if (userData) {
          const standardPosts = (Array.isArray(userData.posts) ? userData.posts : [])
             .filter((post: any) => post && post.post_type !== 'blog');

          setUser({
            ...userData,
            posts: standardPosts as Post[],
            postCount: userData.postCount || 0,
          } as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Could not load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      if (!userId) return;
      try {
        setLoadingBlog(true);
        const result = await getUserBlogPosts(userId);
        const posts = result.documents.map((doc: any) => ({
           $id: doc.$id,
           title: doc.title,
           content: doc.content,
           image: doc.image,
           created_at: doc.created_at,
           user_id: doc.user_id,
           user_name: doc.user_name,
           visibility: doc.visibility,
           group_id: doc.group_id,
           post_type: doc.post_type
         }));
        setBlogPosts(posts as Post[]);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoadingBlog(false);
      }
    };

    fetchBlogPosts();

    if (isOwnProfile) {
      const fetchPrivatePosts = async () => {
        try {
          setLoadingPrivate(true);
          const result = await getPrivatePosts();
          const posts = result.documents.map((doc: any) => ({
             $id: doc.$id,
             title: doc.title,
             content: doc.content,
             image: doc.image,
             created_at: doc.created_at,
             user_id: doc.user_id,
             user_name: doc.user_name,
             visibility: doc.visibility,
             group_id: doc.group_id,
             post_type: doc.post_type
           }));
          setPrivatePosts(posts as Post[]);
        } catch (err) {
          console.error('Error fetching private posts:', err);
        } finally {
          setLoadingPrivate(false);
        }
      };
      
      fetchPrivatePosts();
    }
  }, [userId, isOwnProfile]);

  if (loading) {
    return (
      <div className="container max-w-6xl py-10 animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-3xl animate-pulse">
            <div className="h-40 bg-secondary rounded-lg mb-6"></div>
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
      <div className="container max-w-6xl py-10 animate-fade-in">
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

  const publicStandardPosts = user.posts.filter(post => post && post.visibility !== 'private' && post.post_type !== 'blog');

  return (
    <div className="container max-w-6xl py-10 animate-fade-in">
      <div className="mb-10">
        <Card className="overflow-hidden border mb-10">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-40 relative">
            <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full border-4 border-background overflow-hidden bg-secondary">
              {profilePictureUrl ? (
                <Image 
                  src={profilePictureUrl}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary-foreground">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <CardContent className="pt-20 pb-6 px-8">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-2 text-muted-foreground text-sm">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                <span>{user.postCount} posts</span>
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
          </CardContent>
        </Card>

        <Tabs defaultValue="public" value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4">
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
          
          <TabsContent value="public">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              Public Posts by {user.name}
            </h2>
            {loading ? ( <p>Loading posts...</p> ) : publicStandardPosts.length === 0 ? (
              <div className="text-center py-10 bg-secondary/20 rounded-lg">
                <h3 className="text-lg font-medium">No public posts yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You haven't published any public standard posts." : "This user hasn't published any public standard posts."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicStandardPosts.map((post: Post) => (
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
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blog">
             <h2 className="text-2xl font-bold mb-6 flex items-center">
               <BookOpen className="h-5 w-5 mr-2 text-primary" />
               Blog Posts by {user.name}
             </h2>
             {loadingBlog ? ( 
                <div className="flex justify-center items-center py-10">
                   <Loader2 className="h-6 w-6 animate-spin text-primary" />
                 </div>
              ) : blogPosts.length === 0 ? (
               <div className="text-center py-10 bg-secondary/20 rounded-lg">
                 <h3 className="text-lg font-medium">No blog posts yet</h3>
                 <p className="text-muted-foreground">
                   {isOwnProfile ? "You haven't published any blog posts." : "This user hasn't published any blog posts."}
                 </p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                   />
                 ))}
               </div>
             )}
           </TabsContent>
          
          {isOwnProfile && (
            <TabsContent value="private">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary" />
                My Private Posts
              </h2>
              {loadingPrivate ? ( 
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
               ) : privatePosts.length === 0 ? (
                <div className="text-center py-10 bg-secondary/20 rounded-lg">
                  <h3 className="text-lg font-medium">No private posts yet</h3>
                  <p className="text-muted-foreground">Posts marked as 'private' will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {isOwnProfile && (
            <TabsContent value="groups">
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