import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

// Environment variables
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'zuckonit_db';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'posts';
const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'post_images';
const APPWRITE_COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID || 'comments';
const APPWRITE_PROFILE_PICTURES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID || 'profile_pictures';
const APPWRITE_USERS_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_ID || 'users';
const APPWRITE_GROUPS_ID = process.env.NEXT_PUBLIC_APPWRITE_GROUPS_ID || 'groups';
const APPWRITE_GROUP_MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_GROUP_MEMBERS_ID || 'group_members';
const APPWRITE_BOOKMARKS_ID = process.env.NEXT_PUBLIC_APPWRITE_BOOKMARKS_ID || 'bookmarks';

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
    USERS: APPWRITE_USERS_ID, // New collection for users
    GROUPS: APPWRITE_GROUPS_ID, // Collection for user groups
    GROUP_MEMBERS: APPWRITE_GROUP_MEMBERS_ID, // Collection for group members
    BOOKMARKS: APPWRITE_BOOKMARKS_ID // Collection for bookmarks
};

export const BUCKETS = {
    IMAGES: APPWRITE_BUCKET_ID,
    PROFILE_PICTURES: APPWRITE_PROFILE_PICTURES_BUCKET_ID
};

// Interface for author/user objects
interface AuthorData {
    userId: string;
    name: string;
    postCount: number;
    profilePictureId?: string;
}

// Interface for user groups
export interface Group {
    id: string; // Assuming id should be a string, adjust if necessary
    $id: string;
    name: string;
    description?: string;
    creator_id: string;
    created_at: string;
}

// Interface for group members
export interface GroupMember {
    $id: string;
    group_id: string;
    user_id: string;
    added_at: string;
}

// Interface for post visibility
export type PostVisibility = 'public' | 'private' | 'groups';

// Helper functions for authentication
export const createUserAccount = async (email: string, password: string, name: string) => {
    try {
        const userId = ID.unique();
        const newAccount = await account.create(userId, email, password, name);
        
        // Create user record in users collection
        await databases.createDocument(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            userId, // Use same ID as the auth account for easy reference
            {
                userId: userId,
                name: name,
                email: email,
                profilePictureId: null,
                bio: "", // Initialize empty bio field
                created_at: new Date().toISOString()            }
        );
        
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
        // Update name in Appwrite Auth
        const result = await account.updateName(name);
        
        // Also update in users collection
        const currentUser = await account.get();
        await databases.updateDocument(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            currentUser.$id,
            {
                name: name
            }
        );
        
        return result;
    } catch (error) {
        console.error("Error updating name:", error);
        throw error;
    }
};

export const updateUserEmail = async (email: string, password: string) => {
    try {
        // Update email in Appwrite Auth
        const result = await account.updateEmail(email, password);
        
        // Also update in users collection
        const currentUser = await account.get();
        await databases.updateDocument(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            currentUser.$id,
            {
                email: email
            }
        );
        
        return result;
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

// Upload profile picture
export const uploadProfilePicture = async (file: File) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        // Upload image to storage
        const upload = await storage.createFile(
            BUCKETS.PROFILE_PICTURES,
            ID.unique(),
            file
        );
        
        // Update user preferences (for current session user)
        await updateUserPrefs({
            ...currentUser.prefs,
            profilePictureId: upload.$id
        });
        
        // Also update the users collection document
        await databases.updateDocument(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            currentUser.$id,
            {
                profilePictureId: upload.$id
            }
        );
        
        const fileUrl = await storage.getFileView(
            BUCKETS.PROFILE_PICTURES,
            upload.$id
        );
        
        return {
            id: upload.$id,
            url: fileUrl
        };
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw error;
    }
};

// Get profile picture URL
export const getProfilePictureUrl = (imageId: string) => {
    return storage.getFileView(BUCKETS.PROFILE_PICTURES, imageId);
};

// Update user preferences with profile picture
export const updateUserPrefs = async (prefs: Record<string, unknown>) => {
    try {
        return await account.updatePrefs(prefs);
    } catch (error) {
        console.error("Error updating preferences:", error);
        throw error;
    }
};

// Helper functions for posts
export const createPost = async (
    title: string,
    content: string, // Will be JSON stringified
    visibility: PostVisibility = 'public',
    groupIds: string[] = [],
    imageId?: string,
    status: 'published' | 'draft' = 'published',
    postType: 'standard' | 'blog' = 'standard',
    label: 'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema' = 'Work'
) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const timeNow = new Date().toISOString();
        
        // Create post document
        const post = await databases.createDocument(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            ID.unique(),
            {
                title,
                content,
                created_at: timeNow,
                user_id: currentUser.$id,
                user_name: currentUser.name,
                image: imageId || null,
                visibility: visibility,
                group_id: groupIds,
                post_type: postType,
                status: status,
                label: label
            }
        );
        
        // Try to update the user's post count - but don't let it prevent post creation if it fails
        try {
            const userData = await databases.listDocuments(
                DATABASES.MAIN,
                COLLECTIONS.USERS,
                [
                    Query.equal('userId', currentUser.$id)
                ]
            );
            
            if (userData.documents.length > 0) {
                const userDoc = userData.documents[0];
                const currentPostCount = userDoc.postCount || 0;
                
                await databases.updateDocument(
                    DATABASES.MAIN,
                    COLLECTIONS.USERS,
                    userDoc.$id,
                    {
                        postCount: currentPostCount + 1
                    }
                );
            }
        } catch (updateError) {
            // If updating postCount fails, log the error but continue
            // This likely means the postCount field doesn't exist in the schema
            console.warn("Could not update user postCount:", updateError);
            // The post was still created successfully, so we'll return it
        }
        
        return post;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

export const getPosts = async (limit = 10, options?: { filter?: 'random' | 'popular' | 'latest', userId?: string, includeBlogPosts?: boolean }) => {
    try {
        const queries = [
            Query.limit(limit),
            Query.equal('status', 'published')
        ];
        
        // Default sorting by created_at descending (latest first)
        if (!options?.filter || options.filter === 'latest') {
            queries.push(Query.orderDesc('created_at'));
        }
        
        // Filter by specific user if userId is provided
        if (options?.userId) {
            queries.push(Query.equal('user_id', options.userId));
        }
        
        // By default, exclude blog posts unless explicitly requested
        if (!options?.includeBlogPosts) {
            queries.push(Query.equal('post_type', 'standard'));
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

export const updatePost = async (
    id: string,
    data: Partial<{
        title: string,
        content: string, // JSON stringified
        image: string,
        visibility: PostVisibility,
        group_id: string[],
        post_type: 'standard' | 'blog', // New attribute
        status: 'published' | 'draft', // Add status field
        label: 'Work' | 'Philosophy' | 'Art' | 'literature' | 'Cinema' // Label field
    }>
) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        // Remove the timestamp since it's not in the schema
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
            [
                Query.equal('status', 'published'),
                Query.limit(100) // Get a good sample size
            ]
        );

        // Count posts per author and sort by count, handling potential null values
        const authorStats = posts.documents.reduce((acc: { [key: string]: AuthorData }, post) => {
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
            .sort((a: AuthorData, b: AuthorData) => b.postCount - a.postCount)
            .slice(0, limit);

        // Fetch profile pictures for these authors from users collection
        for (const author of sortedAuthors) {
            try {
                // Try to get user document from the users collection
                const userDoc = await getUserProfile(author.userId);
                if (userDoc && userDoc.profilePictureId) {
                    author.profilePictureId = userDoc.profilePictureId;
                } else {
                    // Fallback to current user's prefs if the user is the current user
                    const currentUser = await account.get();
                    if (currentUser.$id === author.userId && currentUser.prefs?.profilePictureId) {
                        author.profilePictureId = currentUser.prefs.profilePictureId;
                    }
                }
            } catch  {
                // Ignore errors - we just won't have profile picture
            }
        }

        return sortedAuthors;
    } catch (error) {
        console.error("Error fetching popular authors:", error);
        return []; // Return empty array instead of throwing
    }
};

// Function to search for users by name
export const searchUsers = async (searchTerm: string, limit = 10) => {
    try {
        /* 
        // First try to search directly in the users collection using fulltext index
        // This requires a fulltext index on the 'name' field in your Appwrite database
        // If you're seeing errors, you need to create this index in the Appwrite console
        // or rely only on the fallback method below
        const usersResult = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            [
                Query.limit(limit),
                Query.search('name', searchTerm)
            ]
        );
        
        if (usersResult.documents.length > 0) {
            // Map response to expected format
            return usersResult.documents.map(doc => ({
                userId: doc.userId,
                name: doc.name,
                postCount: 0, // We'll need to fetch post count separately
                profilePictureId: doc.profilePictureId
            }));
        }
        */
        
        // Fallback to searching in posts
        const posts = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            [
                Query.equal('status', 'published'),
                Query.limit(100) // Get a good sample size
            ]
        );

        // Extract unique users from posts
        const usersMap = posts.documents.reduce((acc: { [key: string]: AuthorData }, post) => {
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
            .filter((user: AuthorData) => 
                user.name.toLowerCase().includes(searchTermLower)
            )
            .sort((a: AuthorData, b: AuthorData) => b.postCount - a.postCount)
            .slice(0, limit);

        // Fetch profile pictures for these users from users collection
        for (const user of matchingUsers) {
            try {
                // Try to get user document from the users collection
                const userDoc = await getUserProfile(user.userId);
                if (userDoc && userDoc.profilePictureId) {
                    user.profilePictureId = userDoc.profilePictureId;
                }
            } catch  {
                // Ignore errors - we just won't have profile picture
            }
        }

        return matchingUsers;
    } catch (error) {
        console.error("Error searching users:", error);
        return []; // Return empty array instead of throwing
    }
};

// Updated getUserById to fetch only necessary profile fields and paginate *public* standard posts
export const getUserById = async (userId: string, postLimit = 10, postCursor?: string): Promise<Record<string, unknown> | null> => {
    try {
        // Fetch user document details
        const userDoc = await databases.getDocument(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            userId
        );

        // Fetch user's *public*, *published*, *standard* posts for the profile preview
        const postQueries = [
            Query.equal('user_id', userId),
            Query.equal('visibility', 'public'),
            Query.equal('status', 'published'),
            Query.equal('post_type', 'standard'),
            Query.orderDesc('created_at'),
            Query.limit(postLimit)
        ];

        if (postCursor) {
            postQueries.push(Query.cursorAfter(postCursor));
        }

        const posts = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            postQueries
        );

        // Fetch total public post count (consider performance impact)
        // This might require a separate query without limit/cursor if needed accurately
        // For simplicity, we might omit the separate count query for now.

        return {
            ...(userDoc as Record<string, unknown>),
            // Return only the first page of public standard posts
            posts: posts.documents, 
            // Indicate if more public standard posts might exist
            hasMorePublicStandardPosts: posts.documents.length === postLimit 
            // postCount: posts.total // This total would be for the *query*, not all user posts
        };
    } catch (error) {
        if (error instanceof Error) {
            console.log(`User document not found for ID: ${userId}`);
            return null;
        } else {
            console.error("Error fetching user by ID:", error);
            throw error;
        }
    }
};

// Function to get user profile data by user ID
export const getUserProfile = async (userId: string) => {
    try {
        // Try to get the user document from the users collection
        const userDoc = await databases.getDocument(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            userId
        );
        
        return userDoc;
    } catch (error) {
        // If document not found, return null
        console.error("Error fetching user profile:", error);
        return null;
    }
};

// Update user bio
export const updateUserBio = async (bio: string) => {
    try {
        // Get current user
        const currentUser = await account.get();
        
        // Update bio in users collection
        await databases.updateDocument(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            currentUser.$id,
            {
                bio: bio
            }
        );
        
        return true;
    } catch (error) {
        console.error("Error updating bio:", error);
        throw error;
    }
};

// Group management functions

/**
 * Create a new group
 * @param name Group name
 * @param description Optional group description
 * @returns Created group document
 */
export const createGroup = async (name: string, description: string = '') => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const group = await databases.createDocument(
            DATABASES.MAIN,
            COLLECTIONS.GROUPS,
            ID.unique(),
            {
                name,
                description,
                creator_id: currentUser.$id,
                created_at: new Date().toISOString()
            }
        );
        return group;
    } catch (error) {
        console.error("Error creating group:", error);
        throw error;
    }
};

/**
 * Get all groups created by the current user
 * @returns Array of groups created by the current user
 */
export const getUserGroups = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const groups = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.GROUPS,
            [Query.equal('creator_id', currentUser.$id)]
        );
        return groups.documents.map(doc => ({
            $id: doc.$id,
            name: doc.name,
            description: doc.description,
            creator_id: doc.creator_id,
            created_at: doc.created_at
        })) as Group[];
    } catch (error) {
        console.error("Error fetching user groups:", error);
        throw error;
    }
};

/**
 * Get a specific group by ID
 * @param groupId Group ID to fetch
 * @returns Group document
 */
export const getGroup = async (groupId: string) => {
    try {
        const doc = await databases.getDocument(
            DATABASES.MAIN,
            COLLECTIONS.GROUPS,
            groupId
        );
        return {
            $id: doc.$id,
            name: doc.name,
            description: doc.description,
            creator_id: doc.creator_id,
            created_at: doc.created_at
        } as Group;
    } catch (error) {
        console.error("Error fetching group:", error);
        throw error;
    }
};

/**
 * Update a group
 * @param groupId Group ID to update
 * @param data New group data
 * @returns Updated group document
 */
export const updateGroup = async (
    groupId: string, 
    data: Partial<{ name: string, description: string }>
) => {
    try {
        const doc = await databases.updateDocument(
            DATABASES.MAIN,
            COLLECTIONS.GROUPS,
            groupId,
            data
        );
        return {
            $id: doc.$id,
            name: doc.name,
            description: doc.description,
            creator_id: doc.creator_id,
            created_at: doc.created_at
        } as Group;
    } catch (error) {
        console.error("Error updating group:", error);
        throw error;
    }
};

/**
 * Delete a group
 * @param groupId Group ID to delete
 * @returns Response from delete operation
 */
export const deleteGroup = async (groupId: string) => {
    try {
        // First delete all group members
        const members = await getGroupMembers(groupId);
        for (const member of members) {
            await removeUserFromGroup(groupId, member.user_id);
        }
        
        // Then delete the group
        return await databases.deleteDocument(
            DATABASES.MAIN,
            COLLECTIONS.GROUPS,
            groupId
        );
    } catch (error) {
        console.error("Error deleting group:", error);
        throw error;
    }
};

/**
 * Add a user to a group
 * @param groupId Group ID to add user to
 * @param userId User ID to add to group
 * @returns Created group member document
 */
export const addUserToGroup = async (groupId: string, userId: string) => {
    try {
        // Check if user is already in the group
        const existingMember = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.GROUP_MEMBERS,
            [
                Query.equal('group_id', groupId),
                Query.equal('user_id', userId)
            ]
        );
        
        if (existingMember.documents.length > 0) {
            const doc = existingMember.documents[0];
            return {
                $id: doc.$id,
                group_id: doc.group_id,
                user_id: doc.user_id,
                added_at: doc.added_at
            } as GroupMember;
        }
        
        // Add user to group
        const doc = await databases.createDocument(
            DATABASES.MAIN,
            COLLECTIONS.GROUP_MEMBERS,
            ID.unique(),
            {
                group_id: groupId,
                user_id: userId,
                added_at: new Date().toISOString()
            }
        );
        return {
            $id: doc.$id,
            group_id: doc.group_id,
            user_id: doc.user_id,
            added_at: doc.added_at
        } as GroupMember;
    } catch (error) {
        console.error("Error adding user to group:", error);
        throw error;
    }
};

/**
 * Remove a user from a group
 * @param groupId Group ID to remove user from
 * @param userId User ID to remove from group
 * @returns Response from delete operation
 */
export const removeUserFromGroup = async (groupId: string, userId: string) => {
    try {
        // Find the group member document
        const memberDoc = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.GROUP_MEMBERS,
            [
                Query.equal('group_id', groupId),
                Query.equal('user_id', userId)
            ]
        );
        
        if (memberDoc.documents.length === 0) {
            throw new Error('User is not a member of this group');
        }
        
        // Delete the group member document
        return await databases.deleteDocument(
            DATABASES.MAIN,
            COLLECTIONS.GROUP_MEMBERS,
            memberDoc.documents[0].$id
        );
    } catch (error) {
        console.error("Error removing user from group:", error);
        throw error;
    }
};

/**
 * Get all members of a group
 * @param groupId Group ID to get members for
 * @returns Array of group members with user details
 */
export const getGroupMembers = async (groupId: string) => {
    try {
        const members = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.GROUP_MEMBERS,
            [Query.equal('group_id', groupId)]
        );
        
        // Get user details for each member
        const membersWithDetails = await Promise.all(
            members.documents.map(async (doc) => {
                try {
                    // Get user profile to get the name
                    const userProfile = await getUserProfile(doc.user_id);
                    
                    return {
                        $id: doc.$id,
                        group_id: doc.group_id,
                        user_id: doc.user_id,
                        user_name: userProfile?.name || 'Unknown User',
                        added_at: doc.added_at
                    };
                } catch  {
                    // If there's an error getting the user, return basic info
                    return {
                        $id: doc.$id,
                        group_id: doc.group_id,
                        user_id: doc.user_id,
                        user_name: 'Unknown User',
                        added_at: doc.added_at
                    };
                }
            })
        );
        
        return membersWithDetails;
    } catch (error) {
        console.error("Error fetching group members:", error);
        throw error;
    }
};

/**
 * Get all groups that a user is a member of
 * @param userId User ID to get groups for (defaults to current user)
 * @returns Array of groups
 */
export const getUserMemberships = async (userId?: string) => {
    try {
        if (!userId) {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            userId = currentUser.$id;
        }
        
        // Get all group memberships for the user
        const memberships = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.GROUP_MEMBERS,
            [Query.equal('user_id', userId)]
        );
        
        // Fetch group details for each membership
        const groupPromises = memberships.documents.map(membership => {
            // Return the membership document directly, which contains group_id
            return membership as unknown as GroupMember; // Cast to GroupMember
        });
        
        return groupPromises;
    } catch (error) {
        console.error("Error fetching user memberships:", error);
        throw error;
    }
};

// Get posts visible to the current user (public or group-based if member)
export const getVisiblePosts = async (limit = 10, cursor?: string) => {
    const user = await getCurrentUser();
    const baseQueries = [
        Query.equal('status', 'published'), // Ensure only published posts are fetched
        Query.orderDesc('created_at'), // Use created_at instead of $createdAt for user-defined field
        Query.limit(limit)
    ];

    if (cursor) {
        baseQueries.push(Query.cursorAfter(cursor));
    }

    const visibilityQueries: Array<ReturnType<typeof Query.equal | typeof Query.and | typeof Query.or>> = [];

    if (user) {
        // Logged-in users see: public posts, their own posts, and posts in their groups
        visibilityQueries.push(Query.equal('visibility', 'public'));
        visibilityQueries.push(Query.equal('user_id', user.$id)); // Own posts (any visibility? check requirements)
        
        try {
            const memberships = await getUserMemberships(user.$id);
            const userGroupIds = memberships.map(m => m.group_id);

            if (userGroupIds.length > 0) {
                // Add query for posts visible to user's groups
                // Appwrite's Query.contains works for checking if a value exists in an array attribute.
                 visibilityQueries.push(
                     Query.and([
                         Query.equal('visibility', 'groups'),
                         Query.contains('group_id', userGroupIds) 
                     ])
                 );
            }
        } catch (error) {
            console.error("Error fetching user memberships for visible posts:", error);
            // Proceed without group posts if membership check fails
        }

    } else {
        // Anonymous users only see public posts
        visibilityQueries.push(Query.equal('visibility', 'public'));
    }

    // Combine base queries with OR conditions for visibility
    const finalQueries = [
      ...baseQueries,
      Query.or(visibilityQueries)
    ];

    return await databases.listDocuments(
        DATABASES.MAIN,
        COLLECTIONS.POSTS,
        finalQueries
    );
};

// Updated getPrivatePosts to support pagination
export const getPrivatePosts = async (limit = 10, cursor?: string) => {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    const queries = [
        Query.equal('user_id', user.$id),
        Query.equal('visibility', 'private'),
        // Query.equal('status', 'published'), // Should private posts show drafts? Decide based on requirements
        Query.orderDesc('created_at'),
        Query.limit(limit)
    ];

    if (cursor) {
        queries.push(Query.cursorAfter(cursor));
    }

    return await databases.listDocuments(
        DATABASES.MAIN,
        COLLECTIONS.POSTS,
        queries
    );
};

/**
 * Get all users from the database
 * @param limit Maximum number of users to return, defaults to 100
 * @returns Array of user objects
 */
export const getAllUsers = async (limit = 100) => {
    try {
        // Get all users from the users collection
        const usersResult = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.USERS,
            [Query.limit(limit)]
        );
        
        return usersResult.documents.map(doc => ({
            userId: doc.userId || doc.$id,
            name: doc.name || 'Anonymous User',
            email: doc.email,
            profilePictureId: doc.profilePictureId,
            bio: doc.bio || null,
            created_at: doc.created_at
        }));
    } catch {
        console.error("Error fetching all users");
        return []; // Return empty array instead of throwing
    }
};

// Updated getUserBlogPosts to support pagination
export const getUserBlogPosts = async (userId: string, limit = 10, cursor?: string) => {
     const queries = [
         Query.equal('user_id', userId),
         Query.equal('post_type', 'blog'),
         Query.equal('status', 'published'), // Only show published blog posts on profile?
         Query.orderDesc('created_at'),
         Query.limit(limit)
     ];

     if (cursor) {
         queries.push(Query.cursorAfter(cursor));
     }

    return await databases.listDocuments(
        DATABASES.MAIN,
        COLLECTIONS.POSTS,
        queries
    );
};

/**
 * Update existing posts in the database to set default values for status and post_type
 * This function sets status='published' and post_type='standard' for posts that have these fields as null
 * @returns Number of updated posts
 */
export const updateExistingPostsWithDefaults = async () => {
    try {
        // Fetch all posts that need updating (where status or post_type is null)
        const postsToUpdate = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.POSTS,
            [Query.limit(100)] // Get up to 100 posts at a time
        );
        
        let updatedCount = 0;
        
        // Process each post
        for (const post of postsToUpdate.documents) {
            const updateData: Record<string, unknown> = {};
            
            // Check if status is null and set default
            if (post.status === null || post.status === undefined) {
                updateData.status = 'published';
            }
            
            // Check if post_type is null and set default
            if (post.post_type === null || post.post_type === undefined) {
                updateData.post_type = 'standard';
            }
            
            // Only update if there are fields that need updating
            if (Object.keys(updateData).length > 0) {
                await databases.updateDocument(
                    DATABASES.MAIN,
                    COLLECTIONS.POSTS,
                    post.$id,
                    updateData
                );
                updatedCount++;
            }
        }
        
        return updatedCount;
    } catch (error) {
        console.error("Error updating existing posts:", error);
        throw error;
    }
};

/**
 * Bookmark a post for the current user
 * @param postId The ID of the post to bookmark
 * @returns The created bookmark document
 */
export const bookmarkPost = async (postId: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }


        // Check if bookmark already exists
        const existingBookmarks = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.BOOKMARKS,
            [
                Query.equal('user_id', currentUser.$id),
                Query.equal('post_id', postId)
            ]
        );

        if (existingBookmarks.total > 0) {
            // Bookmark already exists, return it
            return existingBookmarks.documents[0];
        }

        // Create new bookmark - store only the post ID
        const bookmark = await databases.createDocument(
            DATABASES.MAIN,
            COLLECTIONS.BOOKMARKS,
            ID.unique(),
            {
                user_id: currentUser.$id,
                post_id: postId,
                created_at: new Date().toISOString()
            }
        );

        return bookmark;
    } catch (error) {
        console.error("Error bookmarking post:", error);
        throw error;
    }
};

/**
 * Remove a bookmark for the current user
 * @param postId The ID of the post to remove from bookmarks
 * @returns Boolean indicating if the operation was successful
 */
export const removeBookmark = async (postId: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Find the bookmark document
        const bookmarks = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.BOOKMARKS,
            [
                Query.equal('user_id', currentUser.$id),
                Query.equal('post_id', postId)
            ]
        );

        if (bookmarks.total === 0) {
            // No bookmark found
            return false;
        }

        // Delete the bookmark
        await databases.deleteDocument(
            DATABASES.MAIN,
            COLLECTIONS.BOOKMARKS,
            bookmarks.documents[0].$id
        );

        return true;
    } catch (error) {
        console.error("Error removing bookmark:", error);
        throw error;
    }
};

/**
 * Get all bookmarks for the current user
 * @returns List of bookmark documents with the related post data
 */
export const getUserBookmarks = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Get all bookmarks for this user
        const bookmarks = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.BOOKMARKS,
            [
                Query.equal('user_id', currentUser.$id),
                Query.orderDesc('created_at')
            ]
        );

        // Fetch the post for each bookmark
        if (bookmarks.total > 0) {
            const bookmarksWithPosts = await Promise.all(
                bookmarks.documents.map(async (bookmark) => {
                    try {
                        const post = await databases.getDocument(
                            DATABASES.MAIN,
                            COLLECTIONS.POSTS,
                            bookmark.post_id
                        );
                        
                        return {
                            ...bookmark,
                            post: post
                        };
                    } catch (error) {
                        console.error(`Error fetching post for bookmark ${bookmark.$id}:`, error);
                        // Return the bookmark without the post data if post not found
                        return bookmark;
                    }
                })
            );
            
            return {
                ...bookmarks,
                documents: bookmarksWithPosts
            };
        }

        return bookmarks;
    } catch (error) {
        console.error("Error fetching user bookmarks:", error);
        throw error;
    }
};

/**
 * Check if a post is bookmarked by the current user
 * @param postId The post ID to check
 * @returns Boolean indicating if the post is bookmarked
 */
export const isPostBookmarked = async (postId: string) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return false;
        }

        const bookmarks = await databases.listDocuments(
            DATABASES.MAIN,
            COLLECTIONS.BOOKMARKS,
            [
                Query.equal('user_id', currentUser.$id),
                Query.equal('post_id', postId)
            ]
        );

        return bookmarks.total > 0;
    } catch (error) {
        console.error("Error checking bookmark status:", error);
        return false;
    }
};

export { Query };
