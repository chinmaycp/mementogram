// mementogram/packages/backend/src/routes/postRoutes.ts

import express, { Router } from "express";
import {
  handleCreatePost,
  handleGetAllPosts,
  handleGetPostById,
  handleUpdatePost,
  handleDeletePost,
  handleLikePost,
  handleDislikePost,
} from "../controllers/postController"; // Import controller functions
import {
  handleAddComment,
  handleGetComments,
} from "../controllers/commentController";
import { protect } from "../middleware/authMiddleware"; // Import protect middleware

const router: Router = express.Router();

// --- Post Routes ---

// GET /api/v1/posts - Get all posts (Public)
router.get("/", handleGetAllPosts);

// POST /api/v1/posts - Create a new post (Protected)
// 'protect' middleware runs first to ensure user is logged in
router.post("/", protect, handleCreatePost);

// GET /api/v1/posts/:postId - Get a single post by ID (Public)
router.get("/:postId", handleGetPostById);

// PUT /api/v1/posts/:postId - Update a post by ID (Protected)
// 'protect' middleware runs first. Ownership check is done inside the controller/service.
router.put("/:postId", protect, handleUpdatePost);
// NOTE: Could also use PATCH for partial updates, often preferred over PUT.
// router.patch('/:postId', protect, handleUpdatePost);

// DELETE /api/v1/posts/:postId - Delete a post by ID (Protected)
// 'protect' middleware runs first. Ownership check is done inside the controller/service.
router.delete("/:postId", protect, handleDeletePost);

// --- Like/Dislike Routes ---

// POST /api/v1/posts/:postId/like - Like a post (Protected)
router.post("/:postId(\\d+)/like", protect, handleLikePost);

// POST /api/v1/posts/:postId/dislike - Unlike a post (Protected)
router.post("/:postId(\\d+)/dislike", protect, handleDislikePost);

// --- Comment Routes ---

// GET /api/v1/posts/:postId/comments - Get comments for a post (Public)
router.get("/:postId(\\d+)/comments", handleGetComments);

// POST /api/v1/posts/:postId/comments - Add a comment to a post (Protected)
router.post("/:postId(\\d+)/comments", protect, handleAddComment);

// TODO: Add routes for updating/deleting comments later
// e.g., router.put('/:postId(\\d+)/comments/:commentId(\\d+)', protect, handleUpdateComment);
// e.g., router.delete('/:postId(\\d+)/comments/:commentId(\\d+)', protect, handleDeleteComment);

// TODO: Make sure to not get fetch comments for a non-existent post

export default router;
