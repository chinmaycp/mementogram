import express, { Router, Request, Response } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware";
import { getMe, updateMe, getUserProfile } from "../controllers/userController";
import {
  handleFollowUser,
  handleUnfollowUser,
  handleGetFollowing,
  handleGetFollowers,
} from "../controllers/followController";

const router: Router = express.Router();

// --- Get/Update Logged-in User's Info (Path: GET/PUT /api/v1/users) ---

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

// --- Follow/Unfollow Routes ---

// POST /api/v1/users/:userId/follow
// The :userId in the URL is the user being followed. The follower is req.user.
router.post("/:userId/follow", protect, handleFollowUser);

// DELETE /api/v1/users/:userId/follow
// The :userId in the URL is the user being unfollowed. The unfollower is req.user.
router.delete("/:userId/follow", protect, handleUnfollowUser);

// --- Get Following / Followers Lists ---

// GET /api/v1/users/:userId/following
router.get("/:userId/following", handleGetFollowing);

// GET /api/v1/users/:userId/followers
router.get("/:userId/followers", handleGetFollowers);

// --- Get User Public Profile (GET /api/v1/users/:username) ---

router.get("/:username", getUserProfile);

// --- TODO: Admin routes for managing users (would use restrictTo) ---
// GET /api/v1/users (Get all users - ADMIN only)
// DELETE /api/v1/users/:id (Delete a user - ADMIN only)

export default router;
