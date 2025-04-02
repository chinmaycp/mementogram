import { Request, Response, NextFunction } from "express";
import { UserJwtPayload } from "../types/express";
import * as postService from "../services/postService";
import * as likeService from "../services/likeService";
import { PostCreateInput, PostUpdateInput } from "src/types/posts";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
  BadRequestError,
} from "../errors";

// --- Create Post ---
export const handleCreatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // req.user is attached by the 'protect' middleware
    const user = req.user as UserJwtPayload; // Type assertion after 'protect' middleware
    if (!user) {
      // Should not happen if 'protect' middleware is used, but good practice to check
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { content, imageUrl } = req.body;

    // Basic Validation
    if (!content) {
      res.status(400).json({ message: "Post content is required." });
      return;
    }

    const postData: PostCreateInput = {
      content,
      imageUrl, // Optional, will be undefined if not provided
      userId: user.userId,
    };

    const newPost = await postService.createPost(postData);

    res.status(201).json({
      // 201 Created
      status: "success",
      data: { post: newPost },
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    // Pass error to a potential centralized error handler (optional)
    // next(error);
    // Or handle directly:
    res.status(500).json({ message: "Error creating post." });
  }
};

// --- Get All Posts ---
export const handleGetAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const posts = await postService.findAllPosts(
      { limit, offset },
      currentUserId,
    );

    res.status(200).json({
      status: "success",
      results: posts.length, // Good practice to include result count
      data: { posts },
    });
  } catch (error) {
    console.error("Get All Posts Error:", error);
    res.status(500).json({ message: "Error retrieving posts." });
  }
};

// --- Get Single Post ---
export const handleGetPostById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const postId = parseInt(req.params.postId, 10);

    // Basic Validation
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID." });
      return;
    }

    const post = await postService.findPostById(postId, currentUserId);

    // Service throws NotFoundError if post doesn't exist
    res.status(200).json({
      status: "success",
      data: { post },
    });
  } catch (error: any) {
    console.error("Get Post By ID Error:", error);
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error retrieving post." });
    }
  }
};

// --- Update Post ---
export const handleUpdatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const postId = parseInt(req.params.postId, 10);
    const { content, imageUrl } = req.body;

    // Basic Validation
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID." });
      return;
    }
    // Ensure at least one field is being updated (optional check)
    if (content === undefined && imageUrl === undefined) {
      res
        .status(400)
        .json({ message: "No update data provided (content or imageUrl)." });
      return;
    }

    const updateData: PostUpdateInput = { content, imageUrl };

    const updatedPost = await postService.updatePost(
      postId,
      user.userId,
      updateData,
    );

    // Service throws NotFoundError or ForbiddenError if applicable
    res.status(200).json({
      status: "success",
      data: { post: updatedPost },
    });
  } catch (error: any) {
    console.error("Update Post Error:", error);
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error updating post." });
    }
  }
};

// --- Delete Post ---
export const handleDeletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const postId = parseInt(req.params.postId, 10);

    // Basic Validation
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID." });
      return;
    }

    await postService.deletePost(postId, user.userId);

    // Service throws NotFoundError or ForbiddenError if applicable
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error: any) {
    console.error("Delete Post Error:", error);
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error deleting post." });
    }
  }
};

// --- Like Post ---
export const handleLikePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const postId = parseInt(req.params.postId, 10);
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID." });
      return;
    }

    // Call the like service
    const newVoteStatus = await likeService.likePost(user.userId, postId);

    res.status(200).json({
      status: "success",
      message:
        newVoteStatus === 1 ? "Post liked successfully." : "Post like removed.",
      voteStatus: newVoteStatus,
    });
  } catch (error: any) {
    console.error("Like Post Error:", error);
    // Map known errors to status codes
    if (error instanceof NotFoundError)
      res.status(404).json({ message: error.message });
    else if (error instanceof BadRequestError)
      res.status(400).json({ message: error.message });
    // ConflictError is less likely now with toggle logic, but keep just in case
    else if (error instanceof ConflictError)
      res.status(409).json({ message: error.message });
    else if (error instanceof UnauthorizedError)
      res.status(401).json({ message: error.message });
    else res.status(500).json({ message: "Error liking post." });
  }
};

// Handles Disliking OR removing a Dislike if already disliked
export const handleDislikePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    if (!user) {
      throw new UnauthorizedError();
    }

    const postId = parseInt(req.params.postId, 10);
    if (isNaN(postId)) {
      throw new BadRequestError("Invalid post ID.");
    }

    // Call the new dislike service function
    const newVoteStatus = await likeService.dislikePost(user.userId, postId);

    res.status(200).json({
      status: "success",
      message:
        newVoteStatus === -1
          ? "Post disliked successfully."
          : "Post dislike removed.",
      voteStatus: newVoteStatus, // Return new status (-1 or 0)
    });
  } catch (error: any) {
    console.error("Dislike Post Error:", error);
    if (error instanceof NotFoundError)
      res.status(404).json({ message: error.message });
    else if (error instanceof BadRequestError)
      res.status(400).json({ message: error.message });
    else if (error instanceof UnauthorizedError)
      res.status(401).json({ message: error.message });
    else res.status(500).json({ message: "Error disliking post." });
  }
};
