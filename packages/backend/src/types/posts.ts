// Represents the raw post record from the database
export interface PostRecord {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// Standard Post Output (can be enhanced later with user details)
export interface PostOutput extends Omit<PostRecord, "user_id"> {
  // Optionally include author details here later via joins
  // author?: { username: string; profilePicUrl: string | null };
  imageUrl: string | null; // Ensure consistent naming if mapped
  createdAt: Date;
  updatedAt: Date;
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
  // Post Details
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Author Details (Nested)
  author: {
    id: number;
    username: string;
    fullName: string | null;
    profilePicUrl: string | null;
  };
  // Add like counts, comment counts later if needed
}
