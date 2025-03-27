import express, { Router } from "express";
import { handleGetUploadPresignedUrl } from "../controllers/uploadController";
import { protect } from "../middleware/authMiddleware";

const router: Router = express.Router();

// POST /api/v1/uploads/presigned-url - Get a presigned URL for S3 upload (Protected)
router.post("/presigned-url", protect, handleGetUploadPresignedUrl);

export default router;
