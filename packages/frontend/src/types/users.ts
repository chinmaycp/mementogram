// Represents public user profile data (minimal, no email)
export interface PublicUserProfile {
  id: number; // <-- Make sure ID is included
  username: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  createdAt: Date | string; // Allow string if backend sends stringified date
  // Add follower/following counts here later if needed
}
