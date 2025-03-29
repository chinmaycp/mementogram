import React, { useState, useEffect, useCallback } from "react";
import axios from "axios"; // For error type checking
import * as feedService from "../services/feedService"; // Import the feed service
import { FeedPost } from "../types/posts"; // Import the FeedPost type
import { PostCard } from "../features/posts/components/PostCard"; // Import the PostCard component

// Define pagination limit
const FEED_LIMIT = 10;

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initial load state
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false); // Loading more state
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true); // Assume there are more posts initially

  // Function to fetch feed posts
  const fetchFeed = useCallback(async (currentOffset: number) => {
    // Decide which loading state to set
    if (currentOffset === 0) {
      setIsLoading(true); // Initial load
    } else {
      setIsLoadingMore(true); // Subsequent loads
    }
    setError(null);

    try {
      const newPosts = await feedService.getFeed({
        limit: FEED_LIMIT,
        offset: currentOffset,
      });

      setPosts(
        (prevPosts) =>
          currentOffset === 0 ? newPosts : [...prevPosts, ...newPosts], // Replace on initial load, append on subsequent loads
      );
      setOffset(currentOffset + newPosts.length);
      setHasMore(newPosts.length === FEED_LIMIT); // If fewer posts than limit returned, no more exist
    } catch (err: unknown) {
      console.error("Failed to fetch feed:", err);
      let message = "Failed to load feed.";
      if (axios.isAxiosError(err) && err.response) {
        message = err.response.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      setHasMore(false); // Stop trying to load more if there's an error
    } finally {
      if (currentOffset === 0) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []); // useCallback with empty dependency array as getFeed doesn't depend on component state directly

  // Effect for initial data load
  useEffect(() => {
    fetchFeed(0); // Fetch the first batch on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFeed]); // Include fetchFeed in dependency array (safe due to useCallback)

  // Handler for the "Load More" button
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchFeed(offset); // Fetch next batch using the current offset
    }
  };

  // --- Render Logic ---

  // Initial Loading State
  if (isLoading && posts.length === 0) {
    return <div className="p-4 text-center text-gray-500">Loading feed...</div>; // TODO: Use a spinner
  }

  // Error State
  if (error && posts.length === 0) {
    // Only show full page error if initial load failed
    return (
      <div className="p-4 text-center text-red-500">
        Error loading feed: {error}
      </div>
    );
  }

  // Empty Feed State
  if (!isLoading && posts.length === 0 && !error) {
    return (
      <div className="p-4 text-center text-gray-500">
        Your feed is empty. Follow some users or create a post!
      </div>
    );
  }

  // Display Feed Posts
  return (
    <div className="container mx-auto p-4 max-w-xl">
      {" "}
      {/* Constrain width */}
      <h1 className="text-2xl font-bold mb-4">Your Feed</h1>
      {/* List of Posts */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {/* Load More Button & Loading Indicator */}
      <div className="text-center my-6">
        {isLoadingMore && (
          <p className="text-gray-500">Loading more posts...</p> // TODO: Use a spinner
        )}
        {!isLoadingMore && hasMore && (
          <button
            onClick={handleLoadMore}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded"
          >
            Load More
          </button>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-500">You've reached the end!</p>
        )}
        {/* Display error below button if subsequent load fails */}
        {error && posts.length > 0 && (
          <p className="text-red-500 text-sm mt-2">
            Error loading more: {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
