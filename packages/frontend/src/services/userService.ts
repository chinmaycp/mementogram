// mementogram/packages/frontend/src/services/userService.ts
import apiClient from "./apiClient"; // Import the configured axios instance

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

// --- TODO: Add other user service functions later ---
// e.g., updateUserProfile, getPublicUserProfile(username)
