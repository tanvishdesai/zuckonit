// Interface for author/user objects
export interface AuthorData {
    userId: string;
    name: string;
    postCount: number; // Consider if this should be dynamically calculated or stored
    profilePictureId?: string | null; // Allow null if no picture
}

// Interface for user groups
export interface Group {
    $id: string;
    name: string;
    description?: string;
    creator_id: string;
    created_at: string; // ISO String date
    // You might want to add member count or other relevant fields later
}

// Interface for group members
export interface GroupMember {
    $id: string;
    group_id: string;
    user_id: string;
    added_at: string; // ISO String date
}

// Interface for post visibility
export type PostVisibility = 'public' | 'private' | 'groups'; // Add 'friends' maybe later?

// Interface for basic User profile data stored in DB
export interface UserProfile {
    $id: string; // Usually same as Auth ID
    userId: string; // Explicitly storing Auth ID if different or for clarity
    name: string;
    email: string; // May not be needed if only using Auth email
    profilePictureId?: string | null;
    bio?: string;
    created_at: string; // ISO String date
    // Add other profile fields as needed: location, website, etc.
}

// Interface for Post data stored in DB
export interface Post {
    $id: string;
    title: string;
    content: string; // Tiptap JSON stringified
    user_id: string; // ID of the author (from Auth)
    image_id?: string | null; // Optional image ID from Storage
    post_type: 'standard' | 'blog';
    visibility: PostVisibility;
    group_ids?: string[]; // IDs of groups if visibility is 'groups'
    created_at: string; // ISO String date
    updated_at: string; // ISO String date
    // Add future fields like tags, likes_count, comments_count etc.
}

// Interface for Comment data stored in DB
export interface Comment {
    $id: string;
    post_id: string; // ID of the post it belongs to
    user_id: string; // ID of the commenter
    content: string;
    created_at: string; // ISO String date
    updated_at: string; // ISO String date
} 