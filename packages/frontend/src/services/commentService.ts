import apiClient from "./apiClient";
import { Comment, CommentOutput } from "../types/comments";
import { PaginationParams } from "../types/common";

// Response structure for getting comments
interface GetCommentsResponse {
  status: string;
  results: number;
  data: {
    comments: Comment[];
  };
}

// Interface for create comment input data
interface CreateCommentData {
  content: string;
}

// Define structure for expected API response when creating comment
interface CreateCommentResponse {
  status: string;
  data: {
    comment: CommentOutput;
  };
}

/**
 * Creates a new comment on a specific post.
 * Requires authentication (token handled by apiClient).
 * @param postId - The ID of the post to comment on.
 * @param content - The text content of the comment.
 * @returns Promise resolving with the newly created CommentOutput object.
 * @throws AxiosError on API failure.
 */
export const createComment = async (
  postId: number,
  content: string,
): Promise<Comment> => {
  const postData: CreateCommentData = { content };
  const response = await apiClient.post<CreateCommentResponse>(
    `/api/v1/posts/${postId}/comments`,
    postData,
  );
  return response.data.data.comment;
};

/**
 * Fetches comments for a specific post.
 * @param postId - The ID of the post whose comments are requested.
 * @param pagination - Optional limit and offset for pagination.
 * @returns Promise resolving with an array of Comment objects.
 * @throws AxiosError on API failure.
 */
export const getComments = async (
  postId: number,
  pagination?: PaginationParams,
): Promise<Comment[]> => {
  const params = {
    limit: pagination?.limit,
    offset: pagination?.offset,
  };
  const response = await apiClient.get<GetCommentsResponse>(
    `/api/v1/posts/${postId}/comments`,
    { params }, // Send pagination as query params
  );
  return response.data.data.comments;
};
