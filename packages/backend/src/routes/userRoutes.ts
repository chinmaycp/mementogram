import express, { Router, Request, Response } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware"; // Import both

const router: Router = express.Router();

// --- Get Logged-in User's Info (Path: GET /api/v1/users/me) ---

// 1. 'protect' middleware runs first: verifies JWT, attaches req.user
// 2. Optional 'restrictTo' middleware could run next (e.g., restrictTo('USER', 'ADMIN'))
// 3. Final handler runs, accesses req.user
router.get("/me", protect, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized." });
  }

  // For now, just return the user payload attached by the middleware
  // Later, can fetch full user details from DB using req.user.userId
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

// --- TODO: Other user routes ---
// GET /api/v1/users/:id  (Get specific user profile - might be public or protected)
// PUT /api/v1/users/me   (Update logged-in user profile - protected)

export default router;
