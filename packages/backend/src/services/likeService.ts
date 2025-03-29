import db from "../config/db"; // Knex instance
import { NotFoundError, ConflictError } from "../errors"; // Custom errors

const LIKES_TABLE = "likes";
const POSTS_TABLE = "posts";

/**
 * Adds a like from a user to a post.
 * @param userId - The ID of the user liking the post.
 * @param postId - The ID of the post being liked.
 * @throws NotFoundError if the post does not exist.
 * @throws ConflictError if the user has already liked the post.
 */
export const likePost = async (
  userId: number,
  postId: number,
): Promise<void> => {
  // 1. Check if the post exists (optional, DB foreign key provides some safety, but better UX)
  const postExists = await db(POSTS_TABLE).where({ id: postId }).first("id");
  if (!postExists) {
    throw new NotFoundError(`Post with ID ${postId} not found.`);
  }

  // 2. Attempt to insert the like
  try {
    await db(LIKES_TABLE).insert({
      user_id: userId,
      post_id: postId,
    });
    // console.log(`User ${userId} liked post ${postId}`); // Optional logging
  } catch (error: any) {
    // Check if the error is a unique constraint violation (already liked)
    // PostgreSQL error code for unique violation is '23505'
    if (error.code === "23505") {
      throw new ConflictError("You have already liked this post.");
    }
    // Re-throw other unexpected errors
    console.error("Error liking post:", error);
    throw new Error("Could not like post due to a database error.");
  }
};

/**
 * Removes a like from a user on a post.
 * @param userId - The ID of the user unliking the post.
 * D@param postId - The ID of the post being unliked.
 * @throws NotFoundError if the user hasn't liked the post.
 */
export const unlikePost = async (
  userId: number,
  postId: number,
): Promise<void> => {
  const deletedCount = await db(LIKES_TABLE)
    .where({
      user_id: userId,
      post_id: postId,
    })
    .del(); // .del() returns the number of rows deleted

  if (deletedCount === 0) {
    // Could also check if post exists first, but simplest is just checking if the like existed
    throw new NotFoundError("You haven't liked this post.");
  }
  // console.log(`User ${userId} unliked post ${postId}`); // Optional logging
};

/**
 * Checks if a specific user has liked a specific post.
 * @param userId - The ID of the user.
 * @param postId - The ID of the post.
 * @returns True if the user has liked the post, false otherwise.
 */
export const checkIfUserLikedPost = async (
  userId: number | undefined | null,
  postId: number,
): Promise<boolean> => {
  // If userId is not provided (e.g., anonymous user), they haven't liked it
  if (!userId) {
    return false;
  }
  const like = await db(LIKES_TABLE)
    .where({
      user_id: userId,
      post_id: postId,
    })
    .first("user_id"); // Select any column just to check existence

  return !!like; // Convert result to boolean
};

/**
 * Gets the total number of likes for a specific post.
 * @param postId - The ID of the post.
 * @returns The number of likes.
 */
export const getLikeCount = async (postId: number): Promise<number> => {
  const result = await db(LIKES_TABLE)
    .where({ post_id: postId })
    .count({ count: "*" }) // Use Knex count aggregation
    .first(); // Result will be object like { count: '5' } or { count: '0' }

  // Parse count string to number, default to 0 if result is undefined/null
  const count = parseInt((result?.count as string) || "0", 10);
  return count;
};

/**
 * Gets the list of user IDs who liked a specific post (for potential future use).
 * @param postId - The ID of the post.
 * @returns An array of user IDs.
 */
export const getLikerIds = async (postId: number): Promise<number[]> => {
  const results = await db(LIKES_TABLE)
    .where({ post_id: postId })
    .pluck("user_id"); // Efficiently select only the user_id column into an array
  return results;
};
