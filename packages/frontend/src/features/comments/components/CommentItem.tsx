import React from "react";
import { Link } from "react-router-dom";
import { Comment } from "../../../types/comments"; // Adjust path if needed

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const formattedDate = new Date(comment.createdAt).toLocaleDateString(); // Basic date

  return (
    <div className="flex space-x-2 py-2 border-b border-gray-100 last:border-b-0">
      {/* Author Pic Placeholder */}
      <Link to={`/users/${comment.author.username}`}>
        <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0 mt-1 flex items-center justify-center text-xs font-semibold">
          {comment.author.profilePicUrl ? (
            <img
              src={comment.author.profilePicUrl}
              alt={comment.author.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            comment.author.username?.charAt(0).toUpperCase()
          )}
        </div>
      </Link>
      {/* Comment Content */}
      <div className="flex-1">
        <p className="text-sm">
          <Link
            to={`/users/${comment.author.username}`}
            className="font-semibold text-gray-800 mr-1 hover:underline"
          >
            {comment.author.username}
          </Link>
          <span className="text-gray-700">{comment.content}</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{formattedDate}</p>
        {/* TODO: Add Like button for comment? Edit/Delete options? */}
      </div>
    </div>
  );
};
