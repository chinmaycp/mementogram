import apiClient from "./apiClient";
import { FeedPost, PostOutput } from "../types/posts";

// Define input for creating a post via API
interface CreatePostData {
  content: string;
  imageUrl?: string | null; // Can be null or the S3 URL
}

// Define expected response structure from POST /posts
interface CreatePostResponse {
  status: string;
  data: {
    // Assuming backend returns the created post in a structure compatible with PostOutput/FeedPost
    post: PostOutput;
  };
}

// Define expected response for getting a single post
interface GetPostResponse {
  status: string;
  data: {
    post: FeedPost;
  };
}

/**
 * Creates a new post by calling the backend API.
 * Requires authentication (token handled by apiClient).
 * @param postData - Object containing content and optional imageUrl.
 * @returns Promise resolving with the newly created post data.
 * @throws AxiosError on API failure.
 */
export const createPost = async (
  postData: CreatePostData,
): Promise<PostOutput> => {
  const response = await apiClient.post<CreatePostResponse>(
    "/api/v1/posts",
    postData,
  );
  return response.data.data.post;
};

/**
 * Fetches a single post by its ID from the backend API.
 * Includes authentication token via interceptor for like status.
 * @param postId - The ID of the post to fetch.
 * @returns Promise resolving with the PostOutput object.
 * @throws AxiosError on failure (e.g., post not found - 404).
 */
export const getPostById = async (postId: number): Promise<FeedPost> => {
  const response = await apiClient.get<GetPostResponse>(
    `/api/v1/posts/${postId}`,
  );
  return response.data.data.post;
};

/**
 * Likes a post by calling the backend API.
 * @param postId - The ID of the post to like.
 * @returns Promise resolving on success.
 * @throws AxiosError on API failure.
 */
export const likePost = async (postId: number): Promise<void> => {
  // Token is added automatically by apiClient interceptor
  await apiClient.post(`/api/v1/posts/${postId}/like`);
  // No response body needed, success is indicated by 2xx status
};

/**
 * Dislikes a post or removes dislike by calling the backend API.
 * Requires authentication (token handled by apiClient).
 * @param postId - The ID of the post to dislike/undislike.
 * @returns Promise resolving on success. Backend might return new vote status.
 * @throws AxiosError on API failure.
 */
export const dislikePost = async (postId: number): Promise<void> => {
  // Or Promise<{ voteStatus: VoteStatus }> if backend returns it
  // Token is added automatically by apiClient interceptor
  await apiClient.post(`/api/v1/posts/${postId}/dislike`);
  // We might want the backend to return the new VoteStatus here
  // const response = await apiClient.post<{ voteStatus: VoteStatus }>(`/api/v1/posts/${postId}/dislike`);
  // return response.data;
};

// --- TODO: Add functions for getPost, updatePost, deletePost later ---
