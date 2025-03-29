import { Request, Response, NextFunction } from "express";
import * as commentService from "../services/commentService"; // Import comment service
import { BadRequestError, NotFoundError } from "../errors"; // Import custom errors
import { UserJwtPayload } from "../types/express"; // For logged-in user info

// --- Add Comment to Post ---
export const handleAddComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload; // From 'protect' middleware
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const postId = parseInt(req.params.postId, 10);
    const { content } = req.body;

    // Validation
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID." });
      return;
    }
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      res.status(400).json({ message: "Comment content cannot be empty." });
      return;
    }

    const commentData = {
      userId: user.userId,
      postId: postId,
      content: content.trim(),
    };

    // Call service to create the comment
    const newComment = await commentService.createComment(commentData);

    res.status(201).json({
      // 201 Created
      status: "success",
      data: { comment: newComment },
    });
  } catch (error: any) {
    console.error("Add Comment Error:", error);
    if (error instanceof BadRequestError) {
      // e.g., Empty content from service
      res.status(400).json({ message: error.message });
    } else if (error instanceof NotFoundError) {
      // e.g., Post not found
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error adding comment." });
    }
  }
};

// --- Get Comments for a Post ---
export const handleGetComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId, 10);

    // Validation
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID." });
      return;
    }

    // Pagination (optional query params)
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    // Validate pagination params (optional but good)
    if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
      res.status(400).json({ message: "Invalid pagination parameters." });
      return;
    }

    // Call service to get comments
    const comments = await commentService.getCommentsForPost(postId, {
      limit,
      offset,
    });

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: { comments },
    });
  } catch (error: any) {
    console.error("Get Comments Error:", error);
    // Service might throw NotFoundError if post doesn't exist, or just return empty array.
    // Handle based on service behavior, or just send 500 for unexpected errors.
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error retrieving comments." });
    }
  }
};

// --- TODO: Add handlers for updateComment, deleteComment later ---
// Remember to include ownership checks in the service/controller for update/delete
