// Represents a comment including basic author information (Should match CommentOutput from backend types)
export interface Comment {
  // Using simpler name 'Comment' for frontend type
  id: number;
  postId: number;
  content: string;
  createdAt: Date | string; // Allow string if backend sends stringified date
  updatedAt: Date | string;
  author: {
    id: number;
    username: string;
    profilePicUrl: string | null;
  };
}

// Represents the raw comment record from the database
export interface CommentRecord {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// Represents a comment including basic author information, returned by the API
export interface CommentOutput {
  id: number;
  postId: number; // Use camelCase for API consistency
  content: string;
  createdAt: Date; // Use camelCase
  updatedAt: Date; // Use camelCase
  author: {
    // Nested author info
    id: number;
    username: string;
    profilePicUrl: string | null; // Use camelCase
  };
}

// Input type for creating a comment
export interface CommentCreateInput {
  userId: number;
  postId: number;
  content: string;
}
