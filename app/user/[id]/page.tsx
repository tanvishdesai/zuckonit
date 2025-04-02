'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getUserById, getProfilePictureUrl, getPrivatePosts } from '@/lib/appwrite';
import { PostCard } from '@/components/ui/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Calendar, User, Lock, Users } from 'lucide-react';
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
  visibility?: string;
  group_id?: string[];
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
}

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privatePosts, setPrivatePosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState('public');
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  
  const isOwnProfile = currentUser && currentUser.$id === id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(id as string);
        
        // Ensure userData has the expected structure before setting it
        if (userData) {
          const userPosts = Array.isArray(userData.posts) ? userData.posts : [];
          setUser({
            ...userData,
            posts: userPosts,
            postCount: userPosts.length
          } as unknown as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Could not load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  useEffect(() => {
    // Only fetch private posts if viewing own profile
    if (isOwnProfile) {
      const fetchPrivatePosts = async () => {
        try {
          setLoadingPrivate(true);
          const result = await getPrivatePosts();
          setPrivatePosts(result.documents as unknown as Post[]);
        } catch (err) {
          console.error('Error fetching private posts:', err);
        } finally {
          setLoadingPrivate(false);
        }
      };
      
      fetchPrivatePosts();
    }
  }, [isOwnProfile]);

  if (loading) {
    return (
      <div className="container max-w-6xl py-10 animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-3xl animate-pulse">
            <div className="h-40 bg-secondary rounded-lg mb-6"></div>
            <div className="h-8 bg-secondary rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-secondary rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-secondary rounded-lg"></div>
              ))}
            </div>
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

  // Format date of first post for user's "member since" date
  const memberSince = user.posts && user.posts.length > 0 
    ? format(new Date(user.posts[user.posts.length - 1].created_at), 'MMMM yyyy')
    : 'Unknown';
  
  // Check both possible profile picture ID field names  
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
    <div className="container max-w-6xl py-10 animate-fade-in">
      <div className="mb-10">
        {/* User Profile Header */}
        <Card className="overflow-hidden border-2 mb-10">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-40 relative">
            <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full border-4 border-background overflow-hidden">
              {profilePictureUrl ? (
                <Image 
                  src={profilePictureUrl}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary-foreground">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <CardContent className="pt-20 pb-6 px-8">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-6 mt-2 text-muted-foreground">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>{user.postCount} posts</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since {memberSince}</span>
              </div>
            </div>
            
            {user.bio && (
              <div className="mt-4 text-sm leading-relaxed">
                <p>{user.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User's Posts */}
        {isOwnProfile ? (
          <div>
            <Tabs defaultValue="public" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="public" className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Public Posts
                </TabsTrigger>
                <TabsTrigger value="private" className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Private Threads
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  My Groups
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="public">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                  Posts by {user.name}
                </h2>

                {user.posts && user.posts.filter(post => post && post.visibility !== 'private').length === 0 ? (
                  <div className="text-center py-10 bg-secondary/20 rounded-lg">
                    <h3 className="text-lg font-medium">No posts yet</h3>
                    <p className="text-muted-foreground">You haven&apos;t published any public posts.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user.posts && 
                      user.posts
                        .filter(post => post && post.visibility !== 'private')
                        .map((post: Post) => (
                          <PostCard
                            key={post.$id}
                            id={post.$id}
                            title={post.title}
                            content={post.content}
                            createdAt={post.created_at}
                            imageId={post.image}
                            userName={post.user_name}
                            className="h-full"
                            visibility={post.visibility as 'public' | 'private' | 'groups'}
                            groupIds={post.group_id}
                          />
                        ))
                    }
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="private">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-primary" />
                  Private Threads
                </h2>
                
                {loadingPrivate ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-64 bg-secondary rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : privatePosts.length === 0 ? (
                  <div className="text-center py-10 bg-secondary/20 rounded-lg">
                    <h3 className="text-lg font-medium">No private threads</h3>
                    <p className="text-muted-foreground">You haven&apos;t created any private posts yet.</p>
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
                        visibility="private"
                        groupIds={post.group_id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="groups">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Manage Your Groups
                </h2>
                
                <div className="mb-6">
                  <p className="text-muted-foreground mb-4">
                    Create and manage groups of users. You can share posts exclusively with specific groups.
                  </p>
                  <GroupManager />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              Posts by {user.name}
            </h2>

            {user.posts && user.posts.length === 0 ? (
              <div className="text-center py-10 bg-secondary/20 rounded-lg">
                <h3 className="text-lg font-medium">No posts yet</h3>
                <p className="text-muted-foreground">This user hasn&apos;t published any posts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.posts && 
                  user.posts
                    .filter(post => post && post.visibility !== 'private')
                    .map((post: Post) => (
                      <PostCard
                        key={post.$id}
                        id={post.$id}
                        title={post.title}
                        content={post.content}
                        createdAt={post.created_at}
                        imageId={post.image}
                        userName={post.user_name}
                        className="h-full"
                        visibility={post.visibility as 'public' | 'private' | 'groups'}
                        groupIds={post.group_id}
                      />
                    ))
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 