import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // For linking to user profiles later
import { FeedPost } from "../../../types/posts"; // Import the type for the post prop
import * as postService from "../../../services/postService";

// Define the props expected by the PostCard component
interface PostCardProps {
  post: FeedPost;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  // Basic date formatting (can be improved with a library like date-fns later)
  const formattedDate = new Date(post.createdAt).toLocaleString();

  // --- State for Optimistic UI Updates ---
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false);
  const [currentLikeCount, setCurrentLikeCount] = useState(post.likeCount);
  const [isLiking, setIsLiking] = useState(false); // Prevent double clicks
  const [likeError, setLikeError] = useState<string | null>(null);

  // Sync state if the initial prop changes (e.g., feed refreshes)
  useEffect(() => {
    setIsLiked(post.isLikedByCurrentUser ?? false);
    setCurrentLikeCount(post.likeCount);
  }, [post.isLikedByCurrentUser, post.likeCount]);

  // --- Like/Unlike Handler ---
  const handleLikeToggle = async () => {
    if (isLiking) return; // Prevent multiple requests

    setIsLiking(true);
    setLikeError(null);

    // Store previous state for potential rollback on error
    const previousIsLiked = isLiked;
    const previousLikeCount = currentLikeCount;

    // Optimistic UI update
    setIsLiked(!previousIsLiked);
    setCurrentLikeCount((prev) => (previousIsLiked ? prev - 1 : prev + 1));

    try {
      if (previousIsLiked) {
        // If previously liked, call unlike service
        await postService.unlikePost(post.id);
      } else {
        // If not previously liked, call like service
        await postService.likePost(post.id);
      }
      // Success: Optimistic state is correct
    } catch (error) {
      console.error("Failed to toggle like:", error);
      // Rollback UI on error
      setIsLiked(previousIsLiked);
      setCurrentLikeCount(previousLikeCount);
      setLikeError("Failed to update like status.");
      // Optionally hide error after a few seconds
      setTimeout(() => setLikeError(null), 3000);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      {/* Card Header: Author Info & Timestamp */}
      <div className="p-4 flex items-center space-x-3">
        {/* Author Profile Pic Placeholder */}
        <Link to={`/users/${post.author.username}`}>
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-600">
            {post.author.profilePicUrl ? (
              <img
                src={post.author.profilePicUrl}
                alt={post.author.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              post.author.username?.charAt(0).toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1">
          <Link
            to={`/users/${post.author.username}`}
            className="font-semibold text-sm text-gray-800 hover:underline"
          >
            {post.author.username}
          </Link>
          {/* Optional: Show Full Name */}
          {/* {post.author.fullName && <p className="text-xs text-gray-500">{post.author.fullName}</p>} */}
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
        {/* Optional: Add options menu (e.g., for delete/edit) later */}
      </div>

      {/* Card Content */}
      <div className="px-4 pb-2">
        <p className="text-gray-700 text-sm whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Card Image (if exists) */}
      {post.imageUrl && (
        <div className="mt-2">
          {" "}
          {/* No extra padding needed if image spans full width */}
          <img
            src={post.imageUrl}
            alt={`Post by ${post.author.username}`}
            className="w-full object-cover" // Adjust object-fit as needed (cover, contain, etc.)
          />
        </div>
      )}

      {/* Card Footer (Actions & Like Count) */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center space-x-1 text-sm ${
              isLiked
                ? "text-red-500 hover:text-red-600"
                : "text-gray-500 hover:text-red-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {/* Basic Heart Placeholder - Replace with Icons later */}
            <span>{isLiked ? "❤️" : "🤍"}</span>
            <span>Like</span>
          </button>
          {/* Comment Button */}
          <button className="text-gray-500 hover:text-blue-500 text-sm flex items-center space-x-1">
            {/* Replace with Icon later */}
            <span>💬</span>
            <span>Comment (TODO)</span>
          </button>
        </div>

        {/* Like Count Display */}
        {(currentLikeCount > 0 || likeError) && (
          <div className="mt-2 text-sm">
            {currentLikeCount > 0 && (
              <span className="font-semibold text-gray-700">
                {currentLikeCount} {currentLikeCount === 1 ? "like" : "likes"}
              </span>
            )}
            {likeError && (
              <span className="text-red-500 ml-2">{likeError}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
