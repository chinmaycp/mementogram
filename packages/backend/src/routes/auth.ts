import express, { Router, Request, Response } from "express";
import { registerUser, loginUser } from "../controllers/authController";

const router: Router = express.Router();

// --- Registration Route - Path: POST /api/v1/auth/register ---

router.post("/register", registerUser);

// --- Login Route - Path: POST /api/v1/auth/login ---

router.post("/login", loginUser);

export default router;
