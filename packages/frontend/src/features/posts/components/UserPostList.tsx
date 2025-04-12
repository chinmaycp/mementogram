import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as userService from "../../../services/userService"; // Import user service
import { PostOutput, FeedPost } from "../../../types/posts";
import { PostCard } from "./PostCard"; // Import PostCard

interface UserPostListProps {
  userId: number; // The ID of the user whose posts we want to display
}

const POSTS_LIMIT = 9; // Number of posts per page/load

export const UserPostList: React.FC<UserPostListProps> = ({ userId }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchUserPosts = useCallback(
    async (currentOffset: number) => {
      if (currentOffset === 0) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      try {
        const newPosts = await userService.getUserPosts(userId, {
          limit: POSTS_LIMIT,
          offset: currentOffset,
        });
        setPosts((prev) =>
          currentOffset === 0 ? newPosts : [...prev, ...newPosts],
        );
        setOffset(currentOffset + newPosts.length);
        setHasMore(newPosts.length === POSTS_LIMIT);
      } catch (err: unknown) {
        console.error(`Failed to fetch posts for user ${userId}:`, err);
        let message = "Failed to load posts.";
        // ... (axios error handling as in FeedPage) ...
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
    [userId],
  ); // Depend on userId

  // Initial fetch and refetch if userId changes
  useEffect(() => {
    setPosts([]); // Reset posts when userId changes
    setOffset(0);
    setHasMore(true);
    setError(null);
    fetchUserPosts(0);
  }, [fetchUserPosts, userId]); // Add userId dependency

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchUserPosts(offset);
    }
  };

  // --- Render Logic ---
  if (isLoading)
    return <p className="text-center text-gray-500 py-4">Loading posts...</p>;
  if (error && posts.length === 0)
    return <p className="text-center text-red-500 py-4">Error: {error}</p>;
  if (!isLoading && posts.length === 0)
    return (
      <p className="text-center text-gray-500 py-4">
        This user hasn't posted yet.
      </p>
    );

  return (
    <div className="mt-6">
      {/* Post Grid */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More / Error */}
      <div className="text-center my-8">
        {isLoadingMore && <p className="text-gray-500">Loading more...</p>}
        {!isLoadingMore && hasMore && (
          <button
            onClick={handleLoadMore}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded"
          >
            Load More
          </button>
        )}
        {error && posts.length > 0 && (
          <p className="text-red-500 text-sm mt-2">
            Error loading more: {error}
          </p>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-500 text-sm mt-2">No more posts.</p>
        )}
      </div>
    </div>
  );
};
