import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';

// Environment variables - Consider moving to a dedicated config file
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id'; // Replace with your actual project ID
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'zuckonit_db';
const APPWRITE_POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'posts';
const APPWRITE_COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID || 'comments';
const APPWRITE_USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_ID || 'users';
const APPWRITE_GROUPS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GROUPS_ID || 'groups';
const APPWRITE_GROUP_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GROUP_MEMBERS_ID || 'group_members';
const APPWRITE_POST_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'post_images';
const APPWRITE_PROFILE_PICTURES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID || 'profile_pictures';

// Initialize Appwrite Client
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export ID and Query for convenience in other modules
export { ID, Query };

// Database and collection constants
export const DATABASES = {
    MAIN: APPWRITE_DATABASE_ID
} as const;

export const COLLECTIONS = {
    POSTS: APPWRITE_POSTS_COLLECTION_ID,
    COMMENTS: APPWRITE_COMMENTS_COLLECTION_ID,
    USERS: APPWRITE_USERS_COLLECTION_ID,
    GROUPS: APPWRITE_GROUPS_COLLECTION_ID,
    GROUP_MEMBERS: APPWRITE_GROUP_MEMBERS_COLLECTION_ID
} as const;

export const BUCKETS = {
    POST_IMAGES: APPWRITE_POST_IMAGES_BUCKET_ID,
    PROFILE_PICTURES: APPWRITE_PROFILE_PICTURES_BUCKET_ID
} as const;

// Basic error handling or logging wrapper (optional but recommended)
export const appwriteCall = async <T>(call: Promise<T>): Promise<T> => {
    try {
        return await call;
    } catch (error) {
        // Log error more systematically (e.g., to a logging service)
        console.error("Appwrite API Error:", error);
        // Re-throw or handle as appropriate for your application
        throw error;
    }
}; 