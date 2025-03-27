// Represents the raw user record from the database (matches table columns)
export interface UserRecord {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  role_id: number;
  created_at: Date;
  updated_at: Date;
  full_name: string | null;
  bio: string | null;
  profile_pic_url: string | null;
  email_verified_at: Date | null;
}

// Represents user profile data returned internally or to logged-in user (no hash)
export interface UserProfile
  extends Omit<UserRecord, "password_hash" | "role_id"> {
  roleName: string; // Add role name after joining
  fullName: string | null; // Use consistent naming (optional mapping if needed)
  profilePicUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileOutput {
  id: number;
  email: string;
  username: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  roleName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Represents public user profile data (minimal, no email)
export interface PublicUserProfile {
  id: number;
  username: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  createdAt: Date;
  // followerCount?: number; // Example future addition
  // followingCount?: number; // Example future addition
}

export interface PublicUserProfileOutput {
  id: number;
  username: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  createdAt: Date;
}

export interface UserCreateInput {
  email: string;
  username: string;
  passwordHash: string;
  fullName?: string;
  // roleId is handled by default in DB schema for now
}

// Input for updating a user's own profile
export interface UserUpdateInput {
  fullName?: string | null;
  bio?: string | null;
  username?: string;
  profilePicUrl?: string | null;
  // Add other updatable fields (ensure they map to UserRecord fields for service)
}
