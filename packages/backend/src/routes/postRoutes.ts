// mementogram/packages/backend/src/routes/postRoutes.ts

import express, { Router } from "express";
import {
  handleCreatePost,
  handleGetAllPosts,
  handleGetPostById,
  handleUpdatePost,
  handleDeletePost,
} from "../controllers/postController"; // Import controller functions
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

// --- TODO: Routes for likes, comments on posts ---
// e.g., router.post('/:postId/like', protect, handleLikePost);
// e.g., router.post('/:postId/comments', protect, handleCreateComment);

export default router;
