import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as commentService from "../../../services/commentService"; // Adjust path
import { Comment } from "../../../types/comments"; // Adjust path
import { CommentItem } from "./CommentItem"; // Adjust path

interface CommentListProps {
  postId: number;
  refreshKey?: number;
}

const COMMENT_LIMIT = 5;

export const CommentList: React.FC<CommentListProps> = ({
  postId,
  refreshKey,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchComments = useCallback(
    async (currentOffset: number) => {
      if (currentOffset === 0) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      try {
        const newComments = await commentService.getComments(postId, {
          limit: COMMENT_LIMIT,
          offset: currentOffset,
        });
        setComments((prev) =>
          currentOffset === 0 ? newComments : [...prev, ...newComments],
        );
        setOffset(currentOffset + newComments.length);
        setHasMore(newComments.length === COMMENT_LIMIT);
      } catch (err: unknown) {
        console.error("Failed to fetch comments:", err);
        let message = "Failed to load comments.";
        if (axios.isAxiosError(err) && err.response) {
          message = err.response.data?.message || message;
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        setHasMore(false);
      } finally {
        if (currentOffset === 0) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [postId],
  ); // Depend on postId

  // Initial fetch
  useEffect(() => {
    // Reset when postId or refreshKey changes (if component stays mounted but post changes)
    console.log(
      `CommentList useEffect running for postId: ${postId}, refreshKey: ${refreshKey}`,
    );
    setComments([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    fetchComments(0);
  }, [fetchComments, postId, refreshKey]); // Refetch if postId changes

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchComments(offset);
    }
  };

  // --- Render Logic ---
  if (isLoading)
    return <p className="text-sm text-gray-500 py-2">Loading comments...</p>;
  // Don't show main error if just load more failed, show it near button instead
  if (error && comments.length === 0)
    return <p className="text-sm text-red-500 py-2">Error: {error}</p>;
  if (!isLoading && comments.length === 0)
    return <p className="text-sm text-gray-500 py-2">No comments yet.</p>;

  return (
    <div className="mt-3">
      {/* List */}
      <div className="space-y-1">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Load More / Error */}
      <div className="text-center mt-3">
        {isLoadingMore && (
          <p className="text-xs text-gray-500">Loading more...</p>
        )}
        {!isLoadingMore && hasMore && (
          <button
            onClick={handleLoadMore}
            className="text-xs text-blue-600 hover:underline focus:outline-none"
          >
            Load More Comments
          </button>
        )}
        {error && comments.length > 0 && (
          <p className="text-red-500 text-xs mt-1">Error: {error}</p>
        )}
      </div>
    </div>
  );
};
