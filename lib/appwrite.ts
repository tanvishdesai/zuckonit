import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

// Environment variables
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'zuckonit_db';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'posts';
const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'post_images';
const APPWRITE_COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID || 'comments';

// Initialize Appwrite Client
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and collection constants
export const DATABASES = {
    MAIN: APPWRITE_DATABASE_ID
};

export const COLLECTIONS = {
    POSTS: APPWRITE_COLLECTION_ID,
    COMMENTS: APPWRITE_COMMENTS_COLLECTION_ID,
    USERS: 'users' // New collection for users
};

export const BUCKETS = {
    IMAGES: APPWRITE_BUCKET_ID
};

// Helper functions for authentication
export const createUserAccount = async (email: string, password: string, name: string) => {
    try {
        const userId = ID.unique();
        const newAccount = await account.create(userId, email, password, name);
        if (newAccount) {
            return await login(email, password);
        }
    } catch (error) {
        console.error("Error creating account:", error);
        throw error;
    }
};

export const login = async (email: string, password: string) => {
    try {
        // Ensure email is properly formatted and trimmed
        const cleanEmail = email.trim().toLowerCase();
        return await account.createEmailPasswordSession(cleanEmail, password);
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        return await account.deleteSession('current');
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch {
        return null;
    }
};

// User profile update functions
export const updateUserName = async (name: string) => {
    try {
        return await account.updateName(name);
    } catch (error) {
        console.error("Error updating name:", error);
        throw error;
    }
};

export const updateUserEmail = async (email: string, password: string) => {
    try {
        return await account.updateEmail(email, password);
    } catch (error) {
        console.error("Error updating email:", error);
        throw error;
    }
};

export const updateUserPassword = async (password: string, newPassword: string) => {
    try {
        return await account.updatePassword(password, newPassword);
    } catch (error) {
        console.error("Error updating password:", error);
        throw error;
    }
};

// Helper functions for posts
export const createPost = async (title: string, content: string, imageId?: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const post = await databases.createDocument(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            ID.unique(),
            {
                title,
                content,
                image: imageId || null,
                created_at: new Date().toISOString(),
                user_id: currentUser.$id,
                user_name: currentUser.name
            }
        );
        return post;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

export const getPosts = async (limit = 10, options?: { filter?: 'random' | 'popular' | 'latest', userId?: string }) => {
    try {
        const queries = [Query.limit(limit)];
        
        // Default sorting by created_at descending (latest first)
        if (!options?.filter || options.filter === 'latest') {
            queries.push(Query.orderDesc('created_at'));
        }
        
        // Filter by specific user if userId is provided
        if (options?.userId) {
            queries.push(Query.equal('user_id', options.userId));
        }
        
        // For random posts, we can use a random sort (simulated by various created_at ranges)
        if (options?.filter === 'random') {
            // Random ordering doesn't exist directly in Appwrite
            // We'll do client-side shuffling of the results
            const result = await databases.listDocuments(
                DATABASES.MAIN,
                COLLECTIONS.POSTS,
                queries
            );
            
            // Shuffle the array
            const shuffled = [...result.documents];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            return {
                ...result,
                documents: shuffled
            };
        }
        
        return await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            queries
        );
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

export const getPost = async (id: string) => {
    try {
        return await databases.getDocument(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            id
        );
    } catch (error) {
        console.error("Error fetching post:", error);
        throw error;
    }
};

export const updatePost = async (id: string, data: Partial<{ title: string, content: string, image: string }>) => {
    try {
        return await databases.updateDocument(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            id,
            data
        );
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
};

export const deletePost = async (id: string) => {
    try {
        return await databases.deleteDocument(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            id
        );
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};

// Helper function for image uploads
export const uploadImage = async (file: File) => {
    try {
        const upload = await storage.createFile(
            BUCKETS.IMAGES,
            ID.unique(),
            file
        );
        
        const fileUrl = await storage.getFileView(
            BUCKETS.IMAGES,
            upload.$id
        );
        
        return {
            id: upload.$id,
            url: fileUrl
        };
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

export const getImageUrl = (imageId: string) => {
    return storage.getFileView(BUCKETS.IMAGES, imageId);
};

// New comment-related functions

/**
 * Create a new comment on a post
 * @param postId Post ID to comment on
 * @param content Comment content
 * @returns The created comment document
 */
export const createComment = async (postId: string, content: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        console.log('Creating comment with:', {
            database: DATABASES.MAIN,
            collection: COLLECTIONS.COMMENTS,
            postId,
            userId: currentUser.$id,
            userName: currentUser.name
        });

        const comment = await databases.createDocument(
            DATABASES.MAIN,
            COLLECTIONS.COMMENTS,
            ID.unique(),
            {
                post_id: postId,
                content,
                created_at: new Date().toISOString(),
                user_id: currentUser.$id,
                user_name: currentUser.name
            }
        );
        return comment;
    } catch (error) {
        console.error("Error creating comment:", error);
        console.error("Database:", DATABASES.MAIN);
        console.error("Collection:", COLLECTIONS.COMMENTS);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        throw error;
    }
};

/**
 * Get all comments for a specific post
 * @param postId Post ID to get comments for
 * @returns Array of comments for the specified post
 */
export const getComments = async (postId: string) => {
    try {
        return await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.COMMENTS,
            [
                Query.equal('post_id', postId),
                Query.orderDesc('created_at')
            ]
        );
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
};

/**
 * Delete a comment
 * @param commentId Comment ID to delete
 * @returns Response from deletion operation
 */
export const deleteComment = async (commentId: string) => {
    try {
        return await databases.deleteDocument(
            DATABASES.MAIN,
            COLLECTIONS.COMMENTS,
            commentId
        );
    } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
    }
};

/**
 * Update a comment
 * @param commentId Comment ID to update
 * @param content New comment content
 * @returns Updated comment document
 */
export const updateComment = async (commentId: string, content: string) => {
    try {
        return await databases.updateDocument(
            DATABASES.MAIN,
            COLLECTIONS.COMMENTS,
            commentId,
            {
                content
            }
        );
    } catch (error) {
        console.error("Error updating comment:", error);
        throw error;
    }
};

// Function to get popular authors based on post count
export const getPopularAuthors = async (limit = 4) => {
    try {
        // First get all posts
        const posts = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            [Query.limit(100)] // Get a good sample size
        );

        // Count posts per author and sort by count, handling potential null values
        const authorStats = posts.documents.reduce((acc: { [key: string]: { userId: string, name: string, postCount: number } }, post) => {
            // Skip posts with missing user data
            if (!post.user_id || !post.user_name) return acc;
            
            if (!acc[post.user_id]) {
                acc[post.user_id] = {
                    userId: post.user_id,
                    name: post.user_name || 'Anonymous User', // Provide default name if missing
                    postCount: 0
                };
            }
            acc[post.user_id].postCount++;
            return acc;
        }, {});

        // Convert to array and sort by post count
        const sortedAuthors = Object.values(authorStats)
            .sort((a: { postCount: number }, b: { postCount: number }) => b.postCount - a.postCount)
            .slice(0, limit);

        return sortedAuthors;
    } catch (error) {
        console.error("Error fetching popular authors:", error);
        return []; // Return empty array instead of throwing
    }
};

// Function to search for users by name
export const searchUsers = async (searchTerm: string, limit = 10) => {
    try {
        // Get all posts to extract unique users
        const posts = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            [Query.limit(100)] // Get a good sample size
        );

        // Extract unique users from posts
        const usersMap = posts.documents.reduce((acc: { [key: string]: { userId: string, name: string, postCount: number } }, post) => {
            // Skip posts with missing user data
            if (!post.user_id || !post.user_name) return acc;
            
            if (!acc[post.user_id]) {
                acc[post.user_id] = {
                    userId: post.user_id,
                    name: post.user_name || 'Anonymous User',
                    postCount: 0
                };
            }
            acc[post.user_id].postCount++;
            return acc;
        }, {});

        // Filter users whose names match the search term
        const searchTermLower = searchTerm.toLowerCase();
        const matchingUsers = Object.values(usersMap)
            .filter((user: { name: string }) => 
                user.name.toLowerCase().includes(searchTermLower)
            )
            .sort((a: { postCount: number }, b: { postCount: number }) => b.postCount - a.postCount)
            .slice(0, limit);

        return matchingUsers;
    } catch (error) {
        console.error("Error searching users:", error);
        return []; // Return empty array instead of throwing
    }
};

// Function to get user by ID
export const getUserById = async (userId: string) => {
    try {
        // Get user's posts to calculate post count
        const posts = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            [Query.equal('user_id', userId)]
        );
        
        // If user has at least one post, we can get their data
        if (posts.documents.length > 0) {
            const firstPost = posts.documents[0];
            return {
                userId: userId,
                name: firstPost.user_name || 'Anonymous User',
                postCount: posts.documents.length,
                posts: posts.documents
            };
        }
        
        // If no posts found, return null
        return null;
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw error;
    }
}; 