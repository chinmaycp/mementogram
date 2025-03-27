import { Request, Response, NextFunction } from "express";
import * as followService from "../services/followService";
import { BadRequestError, ConflictError, NotFoundError } from "../errors";
import { UserJwtPayload } from "../types/express";
import { PublicUserProfile } from "../types/users"; // For list return types

// --- Follow User ---
export const handleFollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const follower = req.user as UserJwtPayload; // From 'protect' middleware
    const followingId = parseInt(req.params.userId, 10); // ID of user TO follow (from URL)

    if (!follower) {
      res.status(401).json({ message: "Not authorized" }); // Should be caught by 'protect'
      return;
    }
    if (isNaN(followingId)) {
      res.status(400).json({ message: "Invalid user ID parameter." });
      return;
    }

    await followService.followUser(follower.userId, followingId);

    res.status(200).json({
      // 200 OK or 201 Created are both reasonable
      status: "success",
      message: "User followed successfully.",
    });
  } catch (error: any) {
    console.error("Follow User Error:", error);
    if (error instanceof BadRequestError) {
      // e.g., self-follow
      res.status(400).json({ message: error.message });
    } else if (error instanceof NotFoundError) {
      // Target user not found
      res.status(404).json({ message: error.message });
    } else if (error instanceof ConflictError) {
      // Already following
      res.status(409).json({ message: error.message });
    } else {
      res.status(500).json({
        message: "An error occurred while trying to follow the user.",
      });
    }
  }
};

// --- Unfollow User ---
export const handleUnfollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const follower = req.user as UserJwtPayload; // From 'protect' middleware
    const followingId = parseInt(req.params.userId, 10); // ID of user TO unfollow (from URL)

    if (!follower) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }
    if (isNaN(followingId)) {
      res.status(400).json({ message: "Invalid user ID parameter." });
      return;
    }

    await followService.unfollowUser(follower.userId, followingId);

    res.status(204).send(); // 204 No Content is standard for successful DELETE/unfollow
  } catch (error: any) {
    console.error("Unfollow User Error:", error);
    if (error instanceof NotFoundError) {
      // Not following this user
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({
        message: "An error occurred while trying to unfollow the user.",
      });
    }
  }
};

// --- Get Following List ---
export const handleGetFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10); // ID of user whose following list we want

    // Basic Validation
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID parameter." });
      return;
    }

    // Pagination (optional query params)
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const followingList: PublicUserProfile[] = await followService.getFollowing(
      userId,
      { limit, offset },
    );

    res.status(200).json({
      status: "success",
      results: followingList.length,
      data: {
        users: followingList,
      },
    });
  } catch (error: any) {
    console.error("Get Following Error:", error);
    // Usually don't send 404 if user exists but follows no one, just empty list.
    // Handle potential DB errors.
    res.status(500).json({
      message: "An error occurred while retrieving the following list.",
    });
  }
};

// --- Get Followers List ---
export const handleGetFollowers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10); // ID of user whose followers list we want

    // Basic Validation
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID parameter." });
      return;
    }

    // Pagination
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const followersList: PublicUserProfile[] = await followService.getFollowers(
      userId,
      { limit, offset },
    );

    res.status(200).json({
      status: "success",
      results: followersList.length,
      data: {
        users: followersList,
      },
    });
  } catch (error: any) {
    console.error("Get Followers Error:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the followers list.",
    });
  }
};
