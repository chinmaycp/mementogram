// Represents the raw comment record from the database
export interface CommentRecord {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// Represents a comment including basic author information
export interface CommentOutput {
  id: number;
  postId: number; // Use camelCase for consistency in API output
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    // Nested author info
    id: number;
    username: string;
    profilePicUrl: string | null;
  };
}

// Input type for creating a comment
export interface CommentCreateInput {
  userId: number;
  postId: number;
  content: string;
}
