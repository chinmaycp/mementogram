import React, { useState, useEffect, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FeedPost } from "../../../types/posts";
import { Comment } from "../../../types/comments";
import * as postService from "../../../services/postService";
import { useAuth } from "../../../contexts/AuthContext";
import { formatCompactNumber } from "../../../utils/formatNumber";
import {
  FaHeart,
  FaRegHeart,
  FaRegCommentAlt,
  FaShareSquare,
  FaRegBookmark,
  FaBookmark,
  FaChartBar,
  FaEllipsisH,
} from "react-icons/fa";
import { Dialog, Transition } from "@headlessui/react";
import { AddCommentForm } from "../../comments/components/AddCommentForm";

interface PostCardProps {
  post: FeedPost;
  // TODO: Add prop like isBookmarkedByCurrentUser?: boolean later
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formattedDate =
    new Date(post.createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }) +
    " · " +
    new Date(post.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // State
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false);
  const [currentLikeCount, setCurrentLikeCount] = useState(post.likeCount);
  const [currentCommentCount, setCurrentCommentCount] = useState(
    post.commentCount,
  );
  const [isLiking, setIsLiking] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false); // TODO: Initialize from props later
  const [isBookmarking, setIsBookmarking] = useState(false); // Loading state for bookmark

  // Sync state from props
  useEffect(() => {
    setIsLiked(post.isLikedByCurrentUser ?? false);
    setCurrentLikeCount(post.likeCount);
    setCurrentCommentCount(post.commentCount);
    // TODO: Sync isBookmarked from props when available
    // setIsBookmarked(post.isBookmarkedByCurrentUser ?? false);
  }, [post.isLikedByCurrentUser, post.likeCount, post.commentCount]); // Add post.isBookmarked when available

  // --- Handlers ---
  const stopEventPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleLikeToggle = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    stopEventPropagation(event); // Stop propagation
    if (isLiking || !isAuthenticated) return;
    setIsLiking(true);
    setLikeError(null);
    const previousIsLiked = isLiked;
    const previousLikeCount = currentLikeCount;
    setIsLiked(!previousIsLiked);
    setCurrentLikeCount((prev) => (previousIsLiked ? prev - 1 : prev + 1));
    try {
      if (previousIsLiked) await postService.unlikePost(post.id);
      else await postService.likePost(post.id);
    } catch (error) {
      /* ... roll back state, set error ... */
    } finally {
      setIsLiking(false);
    }
  };

  const openCommentModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event); // Stop propagation
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsCommentModalOpen(true);
  };

  const closeCommentModal = () => setIsCommentModalOpen(false);

  const handleNewCommentAdded = (newComment: Comment) => {
    setCurrentCommentCount((prev) => prev + 1);
    closeCommentModal();
    console.log("Comment added via modal:", newComment);
    // TODO: Add Toast notification for success
  };

  const handleNavigateToPost = () => navigate(`/posts/${post.id}`);

  // --- Placeholder Handlers for New Icons ---
  const handleBookmarkToggle = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    stopEventPropagation(event);
    if (isBookmarking || !isAuthenticated) return;
    setIsBookmarking(true);
    // Simulate API call
    console.log("Bookmark toggled for post:", post.id);
    await new Promise((res) => setTimeout(res, 500)); // Simulate delay
    setIsBookmarked((prev) => !prev); // Optimistic update
    // TODO: Add actual API call for bookmarking
    setIsBookmarking(false);
  };

  const handleShare = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event);
    console.log("Share clicked for post:", post.id);
    // TODO: Implement sharing logic (e.g., copy link, native share API)
    alert("Sharing functionality not implemented yet.");
  };

  const handleViewMetrics = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event);
    console.log("View Metrics clicked for post:", post.id);
    // TODO: Implement metrics modal/view
    alert("Post metrics not available yet.");
  };

  const handleMoreOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event);
    console.log("More options clicked for post:", post.id);
    // TODO: Implement dropdown menu with actions (Report, Block, etc.)
    alert("More options not available yet.");
  };

  return (
    <>
      {/* Main Post Card Area with bottom margin */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden transition-colors duration-150 ease-in-out">
        {" "}
        {/* Added mb-4 */}
        {/* Wrapper for clickable content area */}
        <div
          onClick={handleNavigateToPost}
          className="cursor-pointer hover:bg-gray-50/50"
        >
          {/* Card Header: Author Info & Timestamp */}
          <div className="p-4 flex items-center space-x-3">
            {/* Author Pic Link */}
            <Link
              to={`/users/${post.author.username}`}
              onClick={stopEventPropagation}
              className="z-10 relative flex-shrink-0 block"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-600 overflow-hidden">
                {/* ... profile pic img/placeholder ... */}
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
            {/* Author Username & Timestamp */}
            <div className="flex-1 min-w-0">
              {/* Username Link */}
              <Link
                to={`/users/${post.author.username}`}
                onClick={stopEventPropagation}
                className="font-semibold text-sm text-gray-800 hover:underline z-10 relative inline-block w-fit"
              >
                {post.author.username}
              </Link>
              {/* Timestamp (Not a link) */}
              <p className="text-xs text-gray-500 truncate">{formattedDate}</p>
            </div>
            {/* More Options Button */}
            <button
              onClick={handleMoreOptions}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 z-10 relative"
              aria-label="More options"
            >
              <FaEllipsisH />
            </button>
          </div>

          {/* Card Content */}
          <div className="px-4 pb-3">
            <p className="text-gray-800 text-sm whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Card Image */}
          {post.imageUrl && (
            <div className="-mx-px mt-1">
              {" "}
              {/* Adjusted margin slightly */}
              <img
                src={post.imageUrl}
                alt={`Post by ${post.author.username}`}
                className="w-full object-cover max-h-[60vh] border-y border-gray-100"
              />{" "}
              {/* Adjusted max height */}
            </div>
          )}
        </div>{" "}
        {/* End of clickable area */}
        {/* Card Footer: Actions Row */}
        <div className="px-4 pt-2 pb-3 flex justify-between items-center">
          {/* Left Actions: Comment, Like, Share */}
          <div className="flex items-center space-x-6">
            {/* Comment Icon/Button */}
            <button
              onClick={openCommentModal}
              className="flex items-center space-x-1.5 text-gray-500 hover:text-blue-500 p-1 -ml-1 transition-colors"
              aria-label="Comment on post"
            >
              <FaRegCommentAlt className="w-5 h-5" />
              <span className="text-xs font-medium">
                {formatCompactNumber(currentCommentCount)}
              </span>
            </button>

            {/* Like Icon/Button */}
            <button
              onClick={handleLikeToggle}
              disabled={isLiking || !isAuthenticated}
              className={`flex items-center space-x-1.5 ${isLiked ? "text-red-500" : "text-gray-500"} ${!isLiked ? "hover:text-red-500" : "hover:text-red-600"} disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 rounded-full`}
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              {isLiked ? (
                <FaHeart className="w-5 h-5" />
              ) : (
                <FaRegHeart className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">
                {formatCompactNumber(currentLikeCount)}
              </span>
              {likeError && (
                <span className="text-red-500 ml-1 font-bold text-xs">
                  {likeError}
                </span>
              )}
            </button>

            {/* Share Icon/Button */}
            <button
              onClick={handleShare}
              className="flex items-center text-gray-500 hover:text-green-500 p-1 rounded-full"
              aria-label="Share post"
            >
              <FaShareSquare className="w-5 h-5" />
            </button>

            {/* Metrics Icon/Button */}
            <button
              onClick={handleViewMetrics}
              className="flex items-center text-gray-500 hover:text-purple-500 p-1 rounded-full"
              aria-label="View post metrics"
            >
              <FaChartBar className="w-5 h-5" />
            </button>
          </div>

          {/* Right Actions: Bookmark */}
          <div>
            <button
              onClick={handleBookmarkToggle}
              disabled={isBookmarking || !isAuthenticated}
              className={`flex items-center ${isBookmarked ? "text-yellow-600 hover:text-yellow-700" : "text-gray-500 hover:text-yellow-600"} disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 rounded-full`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            >
              {isBookmarked ? (
                <FaBookmark className="w-5 h-5" />
              ) : (
                <FaRegBookmark className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {/* Removed "Add a comment..." link here, action is via icon */}
      </div>

      {/* Comment Modal (keep as before) */}
      <Transition appear show={isCommentModalOpen} as={Fragment}>
        {/* ... Dialog structure ... */}
        <Dialog.Panel className="w-full max-w-md ...">
          {/* ... Dialog Title ... */}
          <AddCommentForm
            postId={post.id}
            onCommentAdded={handleNewCommentAdded}
          />
          {/* ... Cancel button ... */}
        </Dialog.Panel>
        {/* ... Dialog structure ... */}
      </Transition>
    </>
  );
};
