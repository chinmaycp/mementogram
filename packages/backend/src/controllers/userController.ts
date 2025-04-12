import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import * as postService from "../services/postService";
import { UserUpdateInput } from "../types/users";
import { NotFoundError, ConflictError, BadRequestError } from "../errors";
import { UserJwtPayload } from "../types/express";
import { PaginationParams } from "../types/common";

// --- Get Current Logged-In User Profile (/me) ---
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    if (!user) {
      // Should be caught by 'protect' middleware, but good failsafe
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    // Fetch full user details from service using the ID from the JWT payload
    const userProfile = await userService.findUserById(user.userId);

    // Service should handle 'not found', but double-check
    if (!userProfile) {
      res.status(404).json({ message: "User profile not found." });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        user: userProfile,
      },
    });
  } catch (error: any) {
    console.error("Get Me Error:", error);
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error retrieving user profile." });
    }
  }
};

// --- Update Current Logged-In User Profile (/me) ---
export const updateMe = async (
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

    const { fullName, bio, username, profilePicUrl } = req.body;

    // Basic Validation: Ensure at least something is being updated
    const updateData: UserUpdateInput = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (username !== undefined) updateData.username = username;
    if (profilePicUrl !== undefined) updateData.profilePicUrl = profilePicUrl;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        message:
          "No update data provided (e.g., fullName, bio, username, profilePicUrl).",
      });
      return;
    }

    // TODO: Add more specific validation for each field (length, format, etc.)
    // TODO: If updating username, need to check for uniqueness BEFORE updating

    const updatedUser = await userService.updateUser(user.userId, updateData);

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error: any) {
    console.error("Update Me Error:", error);

    if (error instanceof ConflictError) {
      res.status(409).json({ message: "Username already taken." });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error updating user profile." });
    }
  }
};

// --- Get User Profile by Username (Public) ---
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const username = req.params.username;

    // Basic validation
    if (!username) {
      res.status(400).json({ message: "Username parameter is required." });
      return;
    }

    // Call the service function to get public profile data
    const userProfile = await userService.findUserProfileByUsername(username);

    // Service throws NotFoundError if user doesn't exist
    res.status(200).json({
      status: "success",
      data: {
        user: userProfile,
      },
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error retrieving user profile." });
    }
  }
};

/**
 * Handles request to get posts for a specific user.
 */
export const handleGetUserPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (isNaN(targetUserId)) {
      throw new BadRequestError("Invalid user ID.");
    }

    // Extract pagination from query, providing defaults
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);
    const pagination: PaginationParams = { limit, offset };

    // Get current user ID if logged in (optional)
    const currentUser = req.user as UserJwtPayload | undefined;
    const currentUserId = currentUser?.userId;

    // Call the service function
    const posts = await postService.findPostsByUserId(
      targetUserId,
      pagination,
      currentUserId,
    );

    res.status(200).json({
      status: "success",
      count: posts.length, // Optional: return count for this page
      data: {
        posts,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ status: "fail", message: error.message });
    } else if (error instanceof BadRequestError) {
      res.status(400).json({ status: "fail", message: error.message });
    } else {
      // Pass other errors to the global error handler or handle generically
      console.error("Get User Posts Error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to retrieve user posts." });
    }
  }
};
