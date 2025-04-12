import apiClient from "./apiClient";
import { PublicUserProfile } from "../types/users";
import { PostOutput } from "../types/posts";
import { PaginationParams } from "../types/common";
import { FeedPost } from "../types/posts";

// Define the expected shape of the user profile data from GET /me
// TODO: Move to shared types package later
export interface UserProfile {
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

// Define the structure returned by the API endpoint
interface GetMeResponse {
  status: string;
  data: {
    user: UserProfile;
  };
}

/**
 * Fetches the profile of the currently logged-in user.
 * Assumes the JWT token is automatically added by the apiClient interceptor.
 * @returns Promise resolving with the UserProfile.
 * @throws AxiosError on failure.
 */
export const getMe = async (): Promise<UserProfile> => {
  // Use relative path because of Vite proxy for /api
  const response = await apiClient.get<GetMeResponse>("/api/v1/users/me");
  return response.data.data.user; // Extract the user object from the response structure
};

// Define structure for the get user posts API response
interface GetUserPostsResponse {
  status: string;
  count: number;
  data: {
    posts: FeedPost[];
  };
}

/**
 * Fetches posts created by a specific user from the backend API.
 * Includes authentication token via interceptor for like status on posts.
 * @param userId - The ID of the user whose posts to fetch.
 * @param pagination - Optional limit and offset for pagination.
 * @returns Promise resolving with an array of PostOutput objects.
 * @throws AxiosError on failure.
 */
export const getUserPosts = async (
  userId: number,
  pagination?: PaginationParams,
): Promise<FeedPost[]> => {
  const params = {
    limit: pagination?.limit,
    offset: pagination?.offset,
  };
  // Use the backend endpoint we created: /users/:userId/posts
  const response = await apiClient.get<GetUserPostsResponse>(
    `/api/v1/users/${userId}/posts`,
    { params },
  );
  return response.data.data.posts;
};

// Define expected response structure for public profile endpoint
interface GetPublicProfileResponse {
  status: string;
  data: {
    user: PublicUserProfile; // Backend returns the public profile structure
  };
}

/**
 * Fetches the public profile of a user by their username.
 * @param username - The username of the profile to fetch.
 * @returns Promise resolving with the PublicUserProfile.
 * @throws AxiosError on failure (e.g., user not found - 404).
 */
export const getPublicUserProfile = async (
  username: string,
): Promise<PublicUserProfile> => {
  const response = await apiClient.get<GetPublicProfileResponse>(
    `/api/v1/users/${username}`,
  );
  return response.data.data.user; // Extract the user object
};
