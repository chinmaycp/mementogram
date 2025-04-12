import { VoteStatus } from "./likes";

// Represents the raw post record from the database
export interface PostRecord {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// --- Add/Ensure this export exists ---
// Standard Post Output structure returned by services/controllers
export interface PostOutput {
  id: number;
  content: string;
  imageUrl: string | null; // Use consistent naming (e.g., camelCase)
  createdAt: Date;
  updatedAt: Date;
  // Add author info here later if needed for certain contexts,
  // or use the FeedPostOutput type for feed-specific data
  // author?: { username: string; profilePicUrl: string | null; };
}
// --- End of Added/Ensured Export ---

// Input for creating a post (requires content and userId)
export interface PostCreateInput {
  content: string;
  imageUrl?: string; // Optional
  userId: number;
}

// Input for updating a post (fields are optional)
export interface PostUpdateInput {
  content?: string;
  imageUrl?: string | null; // Allow setting to null explicitly
}

// Represents a post including basic author information for feeds
// (Should match FeedPostOutput from backend)
export interface FeedPost {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    fullName: string | null;
    profilePicUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  currentUserVote: VoteStatus;
}
