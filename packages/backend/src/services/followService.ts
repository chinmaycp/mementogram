import db from "../config/db"; // Knex instance
import { NotFoundError, ConflictError, BadRequestError } from "../errors";
import { PublicUserProfile } from "../types/users";
import { PaginationParams } from "../types/common";

const FOLLOWS_TABLE = "follows";
const USERS_TABLE = "users";

/**
 * Creates a follow relationship between two users.
 * @param followerId - The ID of the user initiating the follow.
 * @param followingId - The ID of the user being followed.
 * @throws BadRequestError if followerId and followingId are the same.
 * @throws NotFoundError if the user being followed does not exist.
 * @throws ConflictError if the follow relationship already exists.
 */
export const followUser = async (
  followerId: number,
  followingId: number,
): Promise<void> => {
  if (followerId === followingId) {
    throw new BadRequestError("You cannot follow yourself.");
  }

  // Check if the target user exists
  const targetUser = await db(USERS_TABLE)
    .where({ id: followingId })
    .first("id");
  if (!targetUser) {
    throw new NotFoundError("User to follow not found.");
  }

  // Check if already following
  const existingFollow = await db(FOLLOWS_TABLE)
    .where({ follower_id: followerId, following_id: followingId })
    .first("follower_id"); // Select any column just to check existence

  if (existingFollow) {
    throw new ConflictError("Already following this user.");
  }

  // Create the follow relationship
  await db(FOLLOWS_TABLE).insert({
    follower_id: followerId,
    following_id: followingId,
  });
};

/**
 * Removes a follow relationship between two users.
 * @param followerId - The ID of the user initiating the unfollow.
 * @param followingId - The ID of the user being unfollowed.
 * @throws NotFoundError if the follow relationship does not exist.
 */
export const unfollowUser = async (
  followerId: number,
  followingId: number,
): Promise<void> => {
  const deletedCount = await db(FOLLOWS_TABLE)
    .where({ follower_id: followerId, following_id: followingId })
    .del();

  if (deletedCount === 0) {
    throw new NotFoundError("Not following this user.");
  }
};

/**
 * Checks if a user is following another user.
 * @param followerId - The ID of the potential follower.
 * @param followingId - The ID of the potential user being followed.
 * @returns True if the followerId is following followingId, false otherwise.
 */
export const isFollowing = async (
  followerId: number,
  followingId: number,
): Promise<boolean> => {
  const follow = await db(FOLLOWS_TABLE)
    .where({ follower_id: followerId, following_id: followingId })
    .first("follower_id");
  return !!follow; // Return true if a record exists, false otherwise
};

/**
 * Gets the list of users that a specific user is following.
 * @param userId - The ID of the user whose following list is requested.
 * @param pagination - Optional limit and offset for pagination.
 * @returns A list of public user profiles.
 */
export const getFollowing = async (
  userId: number,
  pagination: PaginationParams = {},
): Promise<PublicUserProfile[]> => {
  const { limit = 20, offset = 0 } = pagination; // Default pagination

  const followingList = await db(USERS_TABLE + " as u")
    .select(
      "u.id",
      "u.username",
      "u.full_name as fullName",
      "u.bio",
      "u.profile_pic_url as profilePicUrl",
      "u.created_at as createdAt",
    )
    .join(FOLLOWS_TABLE + " as f", "u.id", "=", "f.following_id")
    .where("f.follower_id", userId)
    .orderBy("f.created_at", "desc") // Order by when the follow happened
    .limit(limit)
    .offset(offset);

  return followingList as PublicUserProfile[];
};

/**
 * Gets the list of users who are following a specific user.
 * @param userId - The ID of the user whose followers list is requested.
 * @param pagination - Optional limit and offset for pagination.
 * @returns A list of public user profiles.
 */
export const getFollowers = async (
  userId: number,
  pagination: PaginationParams = {},
): Promise<PublicUserProfile[]> => {
  const { limit = 20, offset = 0 } = pagination; // Default pagination

  const followersList = await db(USERS_TABLE + " as u")
    .select(
      "u.id",
      "u.username",
      "u.full_name as fullName",
      "u.bio",
      "u.profile_pic_url as profilPicUrl",
      "u.created_at as createdAt",
    ) // Select only public fields
    .join(FOLLOWS_TABLE + " as f", "u.id", "=", "f.follower_id")
    .where("f.following_id", userId)
    .orderBy("f.created_at", "desc") // Order by when the follow happened
    .limit(limit)
    .offset(offset);

  return followersList as PublicUserProfile[];
};

// --- Potential Future Enhancements ---
// export const getFollowCounts = async (userId: number): Promise<{ followingCount: number, followerCount: number }> => {
//     const followingPromise = db(FOLLOWS_TABLE).where({ follower_id: userId }).count({ count: '*' }).first();
//     const followersPromise = db(FOLLOWS_TABLE).where({ following_id: userId }).count({ count: '*' }).first();
//     const [followingResult, followersResult] = await Promise.all([followingPromise, followersPromise]);
//     return {
//         followingCount: Number(followingResult?.count || 0),
//         followerCount: Number(followersResult?.count || 0),
//     };
// };
