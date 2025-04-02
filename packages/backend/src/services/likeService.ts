import db from "../config/db"; // Knex instance
import { NotFoundError, BadRequestError } from "../errors"; // Use BadRequestError maybe for self-vote

const LIKES_TABLE = "likes";
const POSTS_TABLE = "posts";

export type VoteStatus = 1 | -1 | 0; // 1: Liked, -1: Disliked, 0: No Vote

/**
 * Casts or removes a user's vote (like/dislike) on a post.
 * Handles switching between like/dislike and removing existing votes.
 * @param userId - The ID of the user voting.
 * @param postId - The ID of the post being voted on.
 * @param voteTypeToSet - The intended vote type (1 for like, -1 for dislike).
 * @returns The new vote status for the user on this post (1, -1, or 0).
 * @throws NotFoundError if the post does not exist.
 */
const castOrRemoveVote = async (
  userId: number,
  postId: number,
  voteTypeToSet: 1 | -1,
): Promise<VoteStatus> => {
  // 1. Check if the post exists
  const postExists = await db(POSTS_TABLE).where({ id: postId }).first("id");
  if (!postExists) {
    throw new NotFoundError(`Post with ID ${postId} not found.`);
  }

  // 2. Find the current vote status
  const currentVote = await db(LIKES_TABLE)
    .where({ user_id: userId, post_id: postId })
    .first("vote_type");

  let finalStatus: VoteStatus = 0; // Default to 0 (no vote)

  // 3. Determine action based on current vote
  if (currentVote) {
    // Vote exists
    if (currentVote.vote_type === voteTypeToSet) {
      // User clicked the same button again - remove the vote
      await db(LIKES_TABLE).where({ user_id: userId, post_id: postId }).del();
      finalStatus = 0; // Vote removed
      console.log(`Vote removed for user ${userId} on post ${postId}`);
    } else {
      // User clicked the other button - switch the vote
      await db(LIKES_TABLE).where({ user_id: userId, post_id: postId }).update({
        vote_type: voteTypeToSet,
        created_at: db.fn.now(), // Optionally update timestamp on switch
      });
      finalStatus = voteTypeToSet; // Vote switched
      console.log(
        `Vote switched to ${voteTypeToSet} for user ${userId} on post ${postId}`,
      );
    }
  } else {
    // No vote exists - insert the new vote
    await db(LIKES_TABLE).insert({
      user_id: userId,
      post_id: postId,
      vote_type: voteTypeToSet,
    });
    finalStatus = voteTypeToSet; // Vote added
    console.log(
      `Vote added (${voteTypeToSet}) for user ${userId} on post ${postId}`,
    );
  }

  return finalStatus;
};

/**
 * Records a 'like' (vote_type = 1) for a post by a user.
 * Handles switching from dislike or removing the like if already liked.
 * @param userId - The ID of the user liking the post.
 * @param postId - The ID of the post being liked.
 * @returns The new vote status (1 or 0).
 */
export const likePost = async (
  userId: number,
  postId: number,
): Promise<VoteStatus> => {
  return castOrRemoveVote(userId, postId, 1);
};

/**
 * Records a 'dislike' (vote_type = -1) for a post by a user.
 * Handles switching from like or removing the dislike if already disliked.
 * @param userId - The ID of the user disliking the post.
 * @param postId - The ID of the post being disliked.
 * @returns The new vote status (-1 or 0).
 */
export const dislikePost = async (
  userId: number,
  postId: number,
): Promise<VoteStatus> => {
  // Prevent self interaction could be added here or controller if needed
  // if (userId === postAuthorId) throw new BadRequestError(...)
  return castOrRemoveVote(userId, postId, -1);
};

/**
 * Gets the current vote status of a specific user on a specific post.
 * @param userId - The ID of the user. Can be undefined/null for anonymous users.
 * @param postId - The ID of the post.
 * @returns The vote status (1 for like, -1 for dislike, 0 for no vote).
 */
export const getUserVoteOnPost = async (
  userId: number | undefined | null,
  postId: number,
): Promise<VoteStatus> => {
  if (!userId) {
    return 0; // Anonymous users have no vote
  }
  const vote = await db(LIKES_TABLE)
    .where({
      user_id: userId,
      post_id: postId,
    })
    .first("vote_type");

  // Return vote_type (1 or -1) or 0 if no record found
  return (vote?.vote_type as VoteStatus) || 0;
};

/**
 * Gets the total like and dislike counts for a specific post.
 * @param postId - The ID of the post.
 * @returns An object with likeCount and dislikeCount.
 */
export const getVoteCounts = async (
  postId: number,
): Promise<{ likeCount: number; dislikeCount: number }> => {
  const result = await db(LIKES_TABLE)
    .select(
      // Count likes (vote_type = 1)
      db.raw(
        'SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END)::integer as "likeCount"',
      ),
      // Count dislikes (vote_type = -1)
      db.raw(
        'SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END)::integer as "dislikeCount"',
      ),
    )
    .where({ post_id: postId })
    .first(); // Returns one row like { likeCount: '5', dislikeCount: '1' } or { likeCount: '0', dislikeCount: '0' }

  return {
    likeCount: result?.likeCount || 0, // Default to 0 if null/undefined
    dislikeCount: result?.dislikeCount || 0, // Default to 0
  };
};
