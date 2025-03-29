import React, { useState, FormEvent } from "react";
import axios from "axios";
import * as commentService from "../../../services/commentService"; // Adjust path
import { Comment } from "../../../types/comments"; // Adjust path

interface AddCommentFormProps {
  postId: number;
  // Callback function to notify parent when a comment is added
  onCommentAdded: (newComment: Comment) => void;
}

export const AddCommentForm: React.FC<AddCommentFormProps> = ({
  postId,
  onCommentAdded,
}) => {
  const [commentText, setCommentText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newComment = await commentService.createComment(
        postId,
        commentText.trim(),
      );
      console.log("Comment added:", newComment);

      // Notify parent component about the new comment
      onCommentAdded(newComment);

      // Clear the form
      setCommentText("");
    } catch (err: unknown) {
      console.error("Failed to add comment:", err);
      let message = "Failed to add comment.";
      if (axios.isAxiosError(err) && err.response) {
        message = err.response.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <div className="flex items-start space-x-2">
        {/* Could add user profile pic placeholder here */}
        <textarea
          rows={1} // Start small, auto-expand potentially later
          className="flex-1 shadow appearance-none border rounded py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300 resize-none" // Added resize-none
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmitting}
          required
        />
        <button
          type="submit"
          className={`bg-blue-500 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isSubmitting || !commentText.trim()}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
};
