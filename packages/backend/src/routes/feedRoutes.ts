import express, { Router } from "express";
import { handleGetFeed } from "../controllers/feedController";
import { protect } from "../middleware/authMiddleware";

const router: Router = express.Router();

// --- Feed Route (GET /api/v1/feed) ---

router.get("/", protect, handleGetFeed);

export default router;
