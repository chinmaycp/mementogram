import { Request, Response, NextFunction } from "express";
import * as postService from "../services/postService";
import { NotFoundError, ForbiddenError } from "../services/postService";
import { UserJwtPayload } from "../types/express";

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

    const postData: postService.PostCreateInput = {
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
    // TODO: Add pagination query params later (e.g., req.query.page, req.query.limit)
    const posts = await postService.findAllPosts();

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
    const postId = parseInt(req.params.postId, 10);

    // Basic Validation
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID." });
      return;
    }

    const post = await postService.findPostById(postId);

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

    const updateData: postService.PostUpdateInput = { content, imageUrl };

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
