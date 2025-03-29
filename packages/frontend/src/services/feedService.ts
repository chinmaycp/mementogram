import apiClient from "./apiClient"; // Import the configured axios instance
import { FeedPost } from "../types/posts"; // Import the FeedPost type
import { PaginationParams } from "../types/common"; // Import PaginationParams

// Define the structure returned by the backend API endpoint
interface GetFeedResponse {
  status: string;
  results: number;
  data: {
    feed: FeedPost[];
  };
}

/**
 * Fetches the user's feed posts from the backend API.
 * Assumes the JWT token is automatically added by the apiClient interceptor.
 * @param pagination - Optional limit and offset for pagination.
 * @returns Promise resolving with an array of FeedPost objects.
 * @throws AxiosError on failure.
 */
export const getFeed = async (
  pagination?: PaginationParams,
): Promise<FeedPost[]> => {
  // Construct query parameters for pagination if provided
  const params = {
    limit: pagination?.limit,
    offset: pagination?.offset,
  };

  // Make GET request to the feed endpoint with query params
  const response = await apiClient.get<GetFeedResponse>("/api/v1/feed", {
    params,
  });

  // Return the feed array from the response structure
  return response.data.data.feed;
};
