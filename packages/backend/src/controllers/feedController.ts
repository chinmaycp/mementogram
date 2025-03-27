import { Request, Response, NextFunction } from "express";
import * as feedService from "../services/feedService";
import { UserJwtPayload } from "../types/express";

export const handleGetFeed = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    if (!user) {
      // Should be caught by 'protect' middleware
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    // Pagination from query parameters
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const feed = await feedService.getFeedForUser(user.userId, {
      limit,
      offset,
    });

    res.status(200).json({
      status: "success",
      results: feed.length,
      data: {
        feed,
      },
    });
  } catch (error: any) {
    console.error("Get Feed Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while retrieving the feed." });
  }
};
