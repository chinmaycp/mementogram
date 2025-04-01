import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import * as postService from "../services/postService";
import { PostOutput } from "../types/posts"; // Or specific type for detailed post view
import { Comment } from "../types/comments";
import { AddCommentForm } from "../features/comments/components/AddCommentForm";
import { CommentList } from "../features/comments/components/CommentList";
import { useAuth } from "../contexts/AuthContext"; // To check if user is logged in for AddCommentForm

const PostDetailPage: React.FC = () => {
  const { postId: postIdParam } = useParams<{ postId: string }>(); // Get postId from URL
  const [post, setPost] = useState<PostOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [commentListKey, setCommentListKey] = useState<number>(0); // For refreshing comment list

  const { isAuthenticated } = useAuth(); // Check if user is logged in
  const navigate = useNavigate();

  // Convert postId param to number
  const postId = postIdParam ? parseInt(postIdParam, 10) : NaN;

  useEffect(() => {
    if (isNaN(postId)) {
      setError("Invalid Post ID.");
      setIsLoading(false);
      return;
    }

    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPost = await postService.getPostById(postId);
        setPost(fetchedPost);
      } catch (err: unknown) {
        console.error("Failed to fetch post:", err);
        let message = "Failed to load post.";
        if (axios.isAxiosError(err) && err.response) {
          if (err.response.status === 404) {
            message = "Post not found.";
          } else {
            message = err.response.data?.message || message;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]); // Refetch if postId changes

  // Callback for when a new comment is added by the form
  const handleNewCommentAdded = (newComment: Comment) => {
    // Increment comment count on the displayed post optimistically
    setPost((currentPost) =>
      currentPost
        ? { ...currentPost, commentCount: currentPost.commentCount + 1 }
        : null,
    );
    // Trigger comment list refresh
    setCommentListKey((prev) => prev + 1);
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="p-4 text-center">Loading post...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!post) {
    // Should be caught by error state if fetch fails, but good failsafe
    return <div className="p-4 text-center">Post data not available.</div>;
  }

  // --- Display Post and Comments ---
  // Reuse PostCard logic/styles or create a dedicated detailed view
  // For now, let's display basic info + comments section
  const formattedDate = new Date(post.createdAt).toLocaleString();
  return (
    <div className="container mx-auto p-4 max-w-xl">
      {/* Back navigation (optional) */}
      <button
        onClick={() => navigate(-1)}
        className="text-blue-600 hover:underline mb-4"
      >
        &larr; Back
      </button>

      {/* Post Details Section (Simplified PostCard Structure) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center space-x-3">
          {/* Author Pic Placeholder */}
          {/* Placeholder - Fetch author details separately if needed or ensure included in getPostById */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-600">
            A
          </div>
          <div>
            {/* Placeholder username */}
            <span className="font-semibold text-sm text-gray-800">
              Author Username
            </span>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </div>
        {/* Content */}
        <div className="px-4 pb-2">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
        {/* Image */}
        {post.imageUrl && (
          <div className="mt-2">
            <img
              src={post.imageUrl}
              alt={`Post by author`}
              className="w-full object-cover"
            />
          </div>
        )}
        {/* Footer - Counts */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-600 space-x-4">
            {post.likeCount > 0 && <span>{post.likeCount} Likes</span>}
            {post.commentCount > 0 && <span>{post.commentCount} Comments</span>}
          </div>
          {/* TODO: Add Like button here too */}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">
          Comments ({post.commentCount})
        </h2>
        {/* Add Comment Form (only if logged in) */}
        {isAuthenticated ? (
          <AddCommentForm
            postId={postId}
            onCommentAdded={handleNewCommentAdded}
          />
        ) : (
          <p className="text-sm text-gray-500 my-4">
            <Link to="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>{" "}
            to add a comment.
          </p>
        )}
        {/* Comment List */}
        <div className="mt-4">
          <CommentList postId={postId} refreshKey={commentListKey} />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
