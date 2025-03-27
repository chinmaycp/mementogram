import db from "../config/db"; // Knex instance
import * as followService from "./followService"; // To get the following list
import { FeedPostOutput } from "../types/posts"; // Import the feed post type
import { PaginationParams } from "../types/common"; // Reuse pagination type for consistency

const POSTS_TABLE = "posts";
const USERS_TABLE = "users";

/**
 * Retrieves the feed for a given user, including posts from followed users and self.
 * Posts are ordered by creation date (newest first).
 * @param userId - The ID of the user requesting the feed.
 * @param pagination - Limit and offset for pagination.
 * @returns An array of feed post objects including author details.
 */
export const getFeedForUser = async (
  userId: number,
  pagination: PaginationParams = {},
): Promise<FeedPostOutput[]> => {
  const { limit = 20, offset = 0 } = pagination; // Default pagination

  // 1. Get the list of users the current user is following
  // Note: For users following thousands, fetching ALL IDs might be inefficient.
  // Real-world feeds use more complex strategies (fan-out, dedicated feed tables).
  // For now, let's fetch a reasonable number or all if feasible for MVP.
  const followingUsers = await followService.getFollowing(userId, {
    limit: 1000,
  }); // Get up to 1000 followed users
  const followingIds = followingUsers.map((user) => user.id);

  // 2. Create list of author IDs for the feed (followed users + self)
  const authorIds = [userId, ...followingIds];

  // 3. Fetch posts from these authors, joining with user data for author details
  const feedPosts = await db(`${POSTS_TABLE} as p`) // Alias posts table as 'p'
    .join(`${USERS_TABLE} as u`, "p.user_id", "=", "u.id") // Join users table (aliased 'u')
    .select(
      "p.id",
      "p.content",
      "p.image_url", // Use snake_case from DB
      "p.created_at",
      "p.updated_at",
      // Select author details with aliases matching FeedPostOutput structure
      "u.id as authorId",
      "u.username as authorUsername",
      "u.full_name as authorFullName", // Use snake_case from DB
      "u.profile_pic_url as authorProfilePicUrl", // Use snake_case from DB
    )
    .whereIn("p.user_id", authorIds) // Filter posts by author IDs
    .orderBy("p.created_at", "desc") // Order by post creation time, newest first
    .limit(limit)
    .offset(offset);

  // 4. Map the flat result from DB to the nested FeedPostOutput structure
  const formattedFeed: FeedPostOutput[] = feedPosts.map((post) => ({
    id: post.id,
    content: post.content,
    imageUrl: post.image_url,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    author: {
      id: post.authorId,
      username: post.authorUsername,
      fullName: post.authorFullName,
      profilePicUrl: post.authorProfilePicUrl,
    },
  }));

  return formattedFeed;
};
