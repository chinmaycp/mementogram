import React, { useState, useEffect, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FeedPost } from "../../../types/posts"; // Adjust path if needed
import { Comment } from "../../../types/comments"; // Adjust path if needed
import { VoteStatus } from "../../../types/likes"; // Adjust path if needed
import * as postService from "../../../services/postService"; // Adjust path if needed
import { useAuth } from "../../../contexts/AuthContext"; // Adjust path if needed
import { formatCompactNumber } from "../../../utils/formatNumber"; // Adjust path if needed
// Import Icons from react-icons
import {
  FaHeart,
  FaRegHeart,
  FaRegCommentAlt,
  FaShareSquare,
  FaRegBookmark,
  FaBookmark,
  FaChartBar,
  FaEllipsisH,
  FaThumbsUp,
  FaRegThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
} from "react-icons/fa";
// Import Headless UI for Modal
import { Dialog, Transition } from "@headlessui/react";
// Import AddCommentForm
import { AddCommentForm } from "../../comments/components/AddCommentForm"; // Adjust path if needed

interface PostCardProps {
  post: FeedPost;
  // TODO: Add prop like isBookmarkedByCurrentUser?: boolean later
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  // --- Hooks ---
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

  // --- State ---
  const [currentUserVote, setCurrentUserVote] = useState<VoteStatus>(
    post.currentUserVote ?? 0,
  );
  const [currentLikeCount, setCurrentLikeCount] = useState(post.likeCount);
  const [currentCommentCount, setCurrentCommentCount] = useState(
    post.commentCount,
  );
  const [isVoting, setIsVoting] = useState(false); // Combined loading state for like/dislike
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false); // Placeholder state, init from props later
  const [isBookmarking, setIsBookmarking] = useState(false); // Loading state for bookmark

  // --- Effects ---
  // Sync local state if props change (e.g., feed refresh)
  useEffect(() => {
    setCurrentUserVote(post.currentUserVote ?? 0);
    setCurrentLikeCount(post.likeCount);
    setCurrentCommentCount(post.commentCount);
    // setIsBookmarked(post.isBookmarkedByCurrentUser ?? false); // Sync bookmark later
  }, [post.currentUserVote, post.likeCount, post.commentCount]); // Add post.isBookmarked... later

  // --- Handlers ---
  const stopEventPropagation = (event: React.MouseEvent) => {
    // Helper to prevent clicks on interactive elements triggering parent navigation
    event.stopPropagation();
  };

  // Central handler for liking (1) or disliking (-1)
  const handleVote = async (
    event: React.MouseEvent<HTMLButtonElement>,
    voteType: 1 | -1,
  ) => {
    stopEventPropagation(event);
    if (isVoting || !isAuthenticated) return; // Prevent multiple clicks or actions when logged out

    setIsVoting(true);
    setVoteError(null);

    const previousVote = currentUserVote;
    const previousLikeCount = currentLikeCount;

    // Optimistic Update Logic
    const newVote: VoteStatus = previousVote === voteType ? 0 : voteType;
    let newLikeCount = previousLikeCount;
    if (newVote === 1) {
      // If ending up in 'liked' state
      newLikeCount =
        previousVote !== 1 ? previousLikeCount + 1 : previousLikeCount;
    } else if (previousVote === 1) {
      // If removing a 'like' (ending in 0 or -1)
      newLikeCount = previousLikeCount - 1;
    }
    // Note: Dislike actions don't change the optimistic like count directly

    setCurrentUserVote(newVote);
    setCurrentLikeCount(newLikeCount);

    // API Call
    try {
      if (voteType === 1) {
        // Intention was to Like (or Un-Like if already liked)
        await postService.likePost(post.id);
      } else if (voteType === -1) {
        // Intention was to Dislike (or Un-Dislike if already disliked)
        await postService.dislikePost(post.id);
      }
      // Optional: Refetch exact counts from API response if backend returns them
    } catch (error) {
      console.error("Failed to vote:", error);
      // Rollback UI on error
      setCurrentUserVote(previousVote);
      setCurrentLikeCount(previousLikeCount);
      setVoteError("!"); // Simple error indicator
      setTimeout(() => setVoteError(null), 2000); // Clear error after delay
    } finally {
      setIsVoting(false);
    }
  };

  // Specific handlers for buttons
  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    handleVote(e, 1);
  const handleDislikeClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    handleVote(e, -1);

  // Comment Modal handlers
  const openCommentModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event);
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsCommentModalOpen(true);
  };
  const closeCommentModal = () => setIsCommentModalOpen(false);

  // Callback from AddCommentForm upon successful submission
  const handleNewCommentAdded = (newComment: Comment) => {
    setCurrentCommentCount((prev) => prev + 1); // Optimistically update count
    closeCommentModal(); // Close modal
    console.log("Comment added via modal:", newComment);
    // TODO: Consider adding a toast notification for success
  };

  // Navigation handler for the main clickable area
  const handleNavigateToPost = () => navigate(`/posts/${post.id}`);

  // --- Placeholder Handlers ---
  const handleBookmarkToggle = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    stopEventPropagation(event);
    if (isBookmarking || !isAuthenticated) return;
    setIsBookmarking(true);
    console.log("Bookmark toggled for post:", post.id);
    await new Promise((res) => setTimeout(res, 500));
    setIsBookmarked((prev) => !prev);
    setIsBookmarking(false);
    // TODO: Add actual bookmark API call
  };
  const handleShare = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event);
    alert("Share functionality TBD.");
  };
  const handleViewMetrics = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event);
    alert("Metrics functionality TBD.");
  };
  const handleMoreOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopEventPropagation(event);
    alert("More options TBD.");
  };

  // --- Render ---
  return (
    <>
      {/* Card container with bottom margin */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden transition-colors duration-150 ease-in-out">
        {/* Clickable area for content/image -> navigates to post detail */}
        <div
          onClick={handleNavigateToPost}
          className="cursor-pointer hover:bg-gray-50/50"
        >
          {/* Header: Author Info, Timestamp, More Options */}
          <div className="p-4 flex items-center space-x-3">
            <Link
              to={`/users/${post.author.username}`} // TODO: Remove post if it doesn't work!!!
              onClick={stopEventPropagation}
              className="z-10 relative flex-shrink-0 block"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-600 overflow-hidden">
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
            <div className="flex-1 min-w-0">
              <Link
                to={`/users/${post.author.username}`}
                onClick={stopEventPropagation}
                className="font-semibold text-sm text-gray-800 hover:underline z-10 relative inline-block w-fit"
              >
                {post.author.username}
              </Link>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {formattedDate}
              </p>
            </div>
            <button
              onClick={handleMoreOptions}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 z-10 relative"
              aria-label="More options"
            >
              <FaEllipsisH />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            <p className="text-gray-800 text-sm whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Image */}
          {post.imageUrl && (
            <div className="-mx-px mt-1">
              <img
                src={post.imageUrl}
                alt={`Post by ${post.author.username}`}
                className="w-full object-cover max-h-[60vh] border-y border-gray-100"
              />
            </div>
          )}
        </div>{" "}
        {/* End of Clickable Area */}
        {/* Footer: Action Icons - Spaced Out */}
        <div className="px-4 pt-2 pb-3 flex justify-around items-center">
          {" "}
          {/* justify-around for even spacing */}
          {/* Comment Button */}
          <button
            onClick={openCommentModal}
            className="flex items-center space-x-1.5 text-gray-500 hover:text-blue-500 p-1 transition-colors"
            aria-label="Comment on post"
          >
            <FaRegCommentAlt className="w-5 h-5" />
            <span className="text-xs font-medium">
              {formatCompactNumber(currentCommentCount)}
            </span>
          </button>
          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            disabled={isVoting || !isAuthenticated}
            className={`flex items-center space-x-1.5 ${currentUserVote === 1 ? "text-blue-500" : "text-gray-500"} hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1`}
            aria-label={currentUserVote === 1 ? "Unlike post" : "Like post"}
          >
            {currentUserVote === 1 ? (
              <FaThumbsUp className="w-5 h-5" />
            ) : (
              <FaRegThumbsUp className="w-5 h-5" />
            )}
            <span className="text-xs font-medium">
              {formatCompactNumber(currentLikeCount)}
            </span>
            {/* Display small error indicator next to count if vote failed */}
            {voteError && (
              <span className="text-red-500 ml-1 font-bold text-xs">
                {voteError}
              </span>
            )}
          </button>
          {/* Dislike Button */}
          <button
            onClick={handleDislikeClick}
            disabled={isVoting || !isAuthenticated}
            className={`flex items-center space-x-1.5 ${currentUserVote === -1 ? "text-red-500" : "text-gray-500"} hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1`}
            aria-label={
              currentUserVote === -1 ? "Remove dislike" : "Dislike post"
            }
          >
            {currentUserVote === -1 ? (
              <FaThumbsDown className="w-5 h-5" />
            ) : (
              <FaRegThumbsDown className="w-5 h-5" />
            )}
            {/* No count displayed for dislikes */}
          </button>
          {/* Metrics Button */}
          <button
            onClick={handleViewMetrics}
            className="flex items-center text-gray-500 hover:text-purple-500 p-1"
            aria-label="View post metrics"
          >
            <FaChartBar className="w-5 h-5" />
          </button>
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center text-gray-500 hover:text-green-500 p-1"
            aria-label="Share post"
          >
            <FaShareSquare className="w-5 h-5" />
          </button>
          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            disabled={isBookmarking || !isAuthenticated}
            className={`flex items-center ${isBookmarked ? "text-yellow-600 hover:text-yellow-700" : "text-gray-500 hover:text-yellow-600"} disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1`}
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

      {/* Comment Modal (Rendered outside main card div for stacking context) */}
      <Transition appear show={isCommentModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeCommentModal}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          {/* Modal Content */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4"
                  >
                    Add Comment
                  </Dialog.Title>
                  <AddCommentForm
                    postId={post.id}
                    onCommentAdded={handleNewCommentAdded}
                  />
                  <div className="mt-4 text-right">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeCommentModal}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

// Default export might be needed if used directly in routes without index files
// export default PostCard; // Or keep named export if imported via index
