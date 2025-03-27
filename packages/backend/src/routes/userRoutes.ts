import express, { Router, Request, Response } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware"; // Import both
import { getMe, updateMe } from "../controllers/userController";

const router: Router = express.Router();

// --- Get/Update Logged-in User's Info (Path: GET/PUT /api/v1/users/me) ---

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

// --- TODO: Routes for public user profiles ---
// GET /api/v1/users/:username (Get specific user profile by username - public)
// import { getUserProfile } from '../controllers/userController';
// router.get('/:username', getUserProfile);

// --- TODO: Admin routes for managing users (would use restrictTo) ---
// GET /api/v1/users (Get all users - ADMIN only)
// DELETE /api/v1/users/:id (Delete a user - ADMIN only)

export default router;
