// Represents the raw post record from the database
export interface PostRecord {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// Standard Post Output
export interface PostOutput {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  isLikedByCurrentUser?: boolean; // true if liked by requester, undefined/false otherwise
  commentCount: number;
  // Add author info here if needed for single post view context?
  // author?: PublicUserProfile;
}

// Input for creating a post (requires content and userId)
export interface PostCreateInput {
  content: string;
  imageUrl?: string;
  userId: number;
}

// Input for updating a post (fields are optional)
export interface PostUpdateInput {
  content?: string;
  imageUrl?: string | null; // Allow setting to null explicitly
}

// Represents a post including basic author information, suitable for feeds
export interface FeedPostOutput {
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
  isLikedByCurrentUser?: boolean; // true if liked by requester, undefined/false otherwise
  commentCount: number;
}
