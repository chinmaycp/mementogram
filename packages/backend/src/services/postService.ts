import db from "../config/db";
import { NotFoundError, ForbiddenError } from "../errors";
import {
  PostRecord,
  PostOutput,
  PostCreateInput,
  PostUpdateInput,
  FeedPostOutput,
} from "../types/posts";
import * as likeService from "./likeService";
import * as commentService from "./commentService";
import * as userService from "./userService";
import { PaginationParams } from "../types/common";
import { VoteStatus } from "../types/likes";

const POSTS_TABLE = "posts";
const LIKES_TABLE = "likes";
const COMMENTS_TABLE = "comments";
const USERS_TABLE = "users";

// --- Service Functions ---

/**
 * Creates a new post in the database.
 * @param postData - Data for the new post, including userId.
 * @returns The newly created post record.
 */
export const createPost = async (
  postData: PostCreateInput,
): Promise<FeedPostOutput> => {
  const [newPostBasic] = await db<PostRecord>(POSTS_TABLE)
    .insert({
      user_id: postData.userId,
      content: postData.content,
      image_url: postData.imageUrl,
    })
    .returning(["id"]);

  return findPostById(newPostBasic.id, postData.userId);
};

/**
 * Finds a single post by its ID, including like count and like status for the current user.
 * @param postId - The ID of the post to find.
 * @param currentUserId - Optional ID of the user making the request (to check like status).
 * @returns The post output object if found.
 * @throws NotFoundError if post not found.
 */
export const findPostById = async (
  postId: number,
  currentUserId?: number,
): Promise<FeedPostOutput> => {
  const postRecordWithAuthor = await db(`${POSTS_TABLE} as p`)
    .join(`${USERS_TABLE} as u`, "p.user_id", "=", "u.id")
    .select(
      "p.*",
      "u.id as authorId",
      "u.username as authorUsername",
      "u.full_name as authorFullName",
      "u.profile_pic_url as authorProfilePicUrl",
    )
    .where({ "p.id": postId })
    .first<PostWithAuthorRecord>();

  if (!postRecordWithAuthor) {
    throw new NotFoundError(`Post with ID ${postId} not found.`);
  }

  // Fetch counts and vote status
  const [voteCounts, currentUserVote, commentCount] = await Promise.all([
    likeService.getVoteCounts(postId),
    likeService.getUserVoteOnPost(currentUserId, postId),
    commentService.getCommentCount(postId),
  ]);

  // Map to the final output structure
  return mapRecordToFeedOutput(
    postRecordWithAuthor,
    voteCounts.likeCount,
    commentCount,
    currentUserVote,
  );

  //   const enrichedPosts = await addCountsAndVotesToPosts(
  //     [postRecordWithAuthor as PostWithAuthorRecord],
  //     currentUserId,
  //   );
  //   return enrichedPosts[0];
};

/**
 * Finds all posts created by a specific user, with pagination.
 * @param targetUserId - The ID of the user whose posts to fetch.
 * @param pagination - Pagination parameters (limit, offset).
 * @param currentUserId - Optional ID of the user making the request (to determine vote status).
 * @returns A promise resolving to an array of PostOutput objects.
 * @throws NotFoundError if the target user does not exist.
 */
export const findPostsByUserId = async (
  targetUserId: number,
  pagination: PaginationParams = {},
  currentUserId?: number,
): Promise<FeedPostOutput[]> => {
  const { limit = 20, offset = 0 } = pagination;

  // 1. Verify target user exists (optional but good practice)
  // We can use a simple check or call userService.findUserById if it exists and is lightweight
  const targetUserExists = await db(USERS_TABLE)
    .where({ id: targetUserId })
    .first("id");
  if (!targetUserExists) {
    throw new NotFoundError(`User with ID ${targetUserId} not found.`);
  }

  // Fetch posts JOINING with author details
  const postRecordsWithAuthor = await db(`${POSTS_TABLE} as p`)
    .join(`${USERS_TABLE} as u`, "p.user_id", "=", "u.id")
    .select(
      "p.*", // Select all columns from posts table
      // Select author details with aliases
      "u.id as authorId",
      "u.username as authorUsername",
      "u.full_name as authorFullName",
      "u.profile_pic_url as authorProfilePicUrl",
    )
    .where({ "p.user_id": targetUserId }) // Filter by user_id from posts table
    .orderBy("p.created_at", "desc")
    .limit(limit)
    .offset(offset);

  // 3. Enrich posts with counts and vote status using the helper
  return addCountsAndVotesToPosts(
    postRecordsWithAuthor as PostWithAuthorRecord[],
    currentUserId,
  );
};

/**
 * Retrieves posts, including like count and like status for the current user.
 * Uses batch fetching for like information for efficiency.
 * @param pagination - Limit and offset for pagination.
 * @param currentUserId - Optional ID of the user making the request.
 * @returns An array of post output objects.
 */
export const findAllPosts = async (
  pagination: PaginationParams = {},
  currentUserId?: number,
): Promise<PostOutput[]> => {
  const { limit = 20, offset = 0 } = pagination;

  // 1. Fetch the batch of posts
  const postRecords = await db<PostRecord>(POSTS_TABLE)
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset)
    .select("*");

  if (postRecords.length === 0) {
    return [];
  }

  const postIds = postRecords.map((p) => p.id);

  // 2. Fetch like counts for these posts in one query
  const likeCountsResult = await db(LIKES_TABLE)
    .select("post_id")
    .count("* as count")
    .where("vote_type", 1) // filter for likes only
    .whereIn("post_id", postIds)
    .groupBy("post_id");

  // Create a map for easy lookup: postId -> likeCount
  const likeCountsMap = new Map<number, number>();
  likeCountsResult.forEach((row: any) => {
    likeCountsMap.set(row.post_id, parseInt((row.count as string) || "0", 10));
  });

  // 3. Fetch which of these posts the current user has liked (if userId provided)
  let likedPostIdsSet = new Set<number>();
  if (currentUserId) {
    const likedPostsResult = await db(LIKES_TABLE)
      .where({ user_id: currentUserId })
      .whereIn("post_id", postIds)
      .pluck("post_id"); // Get array of post IDs liked by the user
    likedPostIdsSet = new Set(likedPostsResult);
  }

  // 4. Fetch comment counts for these posts in one query
  const commentCountsResult = await db(COMMENTS_TABLE)
    .select("post_id")
    .count("* as commentCount")
    .whereIn("post_id", postIds)
    .groupBy("post_id");
  const commentCountsMap = new Map<number, number>();
  commentCountsResult.forEach((row: any) => {
    commentCountsMap.set(
      row.post_id,
      parseInt((row.commentCount as string) || "0", 10),
    );
  });

  // Fetch Current User's Vote Status (if logged in)
  const userVotesMap = new Map<number, VoteStatus>();
  if (currentUserId) {
    const userVotesResult = await db(LIKES_TABLE)
      .select("post_id", "vote_type")
      .where({ user_id: currentUserId })
      .whereIn("post_id", postIds);
    userVotesResult.forEach((row: any) => {
      userVotesMap.set(row.post_id, row.vote_type as VoteStatus);
    });
  }

  // 4. Combine the data
  const postOutputs = postRecords.map((record) => {
    const likeCount = likeCountsMap.get(record.id) || 0;
    const commentCount = commentCountsMap.get(record.id) || 0;
    const currentUserVote = userVotesMap.get(record.id) || 0;
    return mapPostRecordToOutput(
      record,
      likeCount,
      commentCount,
      currentUserVote,
    );
  });

  return postOutputs;
};

/**
 * Updates an existing post.
 * Verifies that the user attempting the update is the owner of the post.
 * @param postId - The ID of the post to update.
 * @param userId - The ID of the user attempting the update (for ownership check).
 * @param updateData - The data to update (content, imageUrl).
 * @returns The updated post record.
 * @throws NotFoundError if post not found for the user.
 * @throws ForbiddenError if user does not own the post (implicitly handled by query).
 */
export const updatePost = async (
  postId: number,
  userId: number,
  updateData: PostUpdateInput,
): Promise<FeedPostOutput> => {
  // Prepare data for update, excluding undefined fields
  const dataToUpdate: {
    full_name?: string | null;
    bio?: string | null;
    username?: string;
    profile_pic_url?: string | null;
    content?: string;
    image_url?: string | null;
  } = {};
  if (updateData.content !== undefined)
    dataToUpdate.content = updateData.content;
  if (updateData.imageUrl !== undefined)
    dataToUpdate.image_url = updateData.imageUrl;

  // Only update if content or imageUrl is provided
  if (Object.keys(dataToUpdate).length === 0) {
    // If nothing to update, fetch and return the current post if it belongs to user
    const currentPostRecord = await db<PostRecord>(POSTS_TABLE)
      .where({ id: postId, user_id: userId })
      .first();

    if (!currentPostRecord) {
      // Could be not found OR not owned. Check existence separately for better error.
      const postExists = await db(POSTS_TABLE)
        .where({ id: postId })
        .first("id");
      if (!postExists) {
        throw new NotFoundError(`Post with ID ${postId} not found.`);
      } else {
        throw new ForbiddenError(
          `You do not have permission to update post ID ${postId}.`,
        );
      }
    }

    return findPostById(postId, userId);
  }

  // Perform update only where id AND user_id match
  const [updatedRecordCheck] = await db<PostRecord>(POSTS_TABLE)
    .where({ id: postId, user_id: userId })
    .update(dataToUpdate)
    .returning(["id"]);

  if (!updatedRecordCheck) {
    const postExists = await db(POSTS_TABLE).where({ id: postId }).first("id");
    if (!postExists) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    } else {
      // Post exists but user_id didn't match
      throw new ForbiddenError(
        `You do not have permission to update post ID ${postId}.`,
      );
    }
  }

  return findPostById(postId, userId);
};

/**
 * Deletes a post.
 * Verifies that the user attempting the deletion is the owner of the post.
 * @param postId - The ID of the post to delete.
 * @param userId - The ID of the user attempting the deletion.
 * @returns Promise resolving when deletion is successful.
 * @throws NotFoundError if post not found for the user.
 * @throws ForbiddenError if user does not own the post (implicitly handled by query).
 */
export const deletePost = async (
  postId: number,
  userId: number,
): Promise<void> => {
  // Perform delete only where id AND user_id match
  const deletedCount = await db<PostRecord>(POSTS_TABLE)
    .where({ id: postId, user_id: userId }) // *** Ownership check ***
    .del(); // .del() returns the number of rows deleted

  if (deletedCount === 0) {
    // If no rows were deleted, check if post exists at all to differentiate error
    const postExists = await db(POSTS_TABLE).where({ id: postId }).first();
    if (!postExists) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    } else {
      // Post exists but user_id didn't match
      throw new ForbiddenError(
        `You do not have permission to delete post ID ${postId}.`,
      );
    }
  }
};

const mapPostRecordToOutput = (
  record: PostRecord,
  likeCount: number,
  commentCount: number,
  currentUserVote: VoteStatus,
): PostOutput => {
  return {
    id: record.id,
    content: record.content,
    imageUrl: record.image_url, // Map from snake_case
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    likeCount: likeCount,
    commentCount: commentCount,
    currentUserVote: currentUserVote,
  };
};

// Helper to map the combined data
const mapRecordToFeedOutput = (
  record: PostWithAuthorRecord,
  likeCount: number,
  commentCount: number,
  currentUserVote: VoteStatus,
): FeedPostOutput => ({
  id: record.id,
  content: record.content,
  imageUrl: record.image_url,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  author: {
    id: record.authorId,
    username: record.authorUsername,
    fullName: record.authorFullName,
    profilePicUrl: record.authorProfilePicUrl,
  },
  likeCount: likeCount,
  commentCount: commentCount,
  currentUserVote: currentUserVote,
});

// Define a type for the richer input record
type PostWithAuthorRecord = PostRecord & {
  authorId: number;
  authorUsername: string;
  authorFullName: string | null;
  authorProfilePicUrl: string | null;
};

// Helper Function to enrich Post Records with counts and vote status
const addCountsAndVotesToPosts = async (
  postRecords: PostWithAuthorRecord[],
  currentUserId?: number,
): Promise<FeedPostOutput[]> => {
  if (postRecords.length === 0) return [];
  const postIds = postRecords.map((p) => p.id);

  // Fetch Like Counts
  const likeCountsResult = await db(LIKES_TABLE)
    .select("post_id")
    .count("* as count")
    .where("vote_type", 1)
    .whereIn("post_id", postIds)
    .groupBy("post_id");
  const likeCountsMap = new Map<number, number>();
  likeCountsResult.forEach((row: any) => {
    likeCountsMap.set(row.post_id, parseInt((row.count as string) || "0", 10));
  });

  // Fetch Comment Counts
  const commentCountsResult = await db(COMMENTS_TABLE)
    .select("post_id")
    .count("* as count")
    .whereIn("post_id", postIds)
    .groupBy("post_id");
  const commentCountsMap = new Map<number, number>();
  commentCountsResult.forEach((row: any) => {
    commentCountsMap.set(
      row.post_id,
      parseInt((row.count as string) || "0", 10),
    );
  });

  // Fetch Current User's Vote Status (if logged in)
  const userVotesMap = new Map<number, VoteStatus>();
  if (currentUserId) {
    const userVotesResult = await db(LIKES_TABLE)
      .select("post_id", "vote_type")
      .where({ user_id: currentUserId })
      .whereIn("post_id", postIds);
    userVotesResult.forEach((row: any) => {
      userVotesMap.set(row.post_id, row.vote_type as VoteStatus);
    });
  }

  // Combine data into FeedPostOutput structure
  const postOutputs: FeedPostOutput[] = postRecords.map((record) => {
    const likeCount = likeCountsMap.get(record.id) || 0;
    const commentCount = commentCountsMap.get(record.id) || 0;
    const currentUserVote = userVotesMap.get(record.id) || 0;

    return {
      // <-- Map to FeedPostOutput
      id: record.id,
      content: record.content,
      imageUrl: record.image_url,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      author: {
        // <-- Create nested author object
        id: record.authorId,
        username: record.authorUsername,
        fullName: record.authorFullName,
        profilePicUrl: record.authorProfilePicUrl,
      },
      likeCount: likeCount,
      commentCount: commentCount,
      currentUserVote: currentUserVote,
    };
  });

  return postOutputs;

  //   // Combine data using the existing mapper
  //   const postOutputs = postRecords.map((record) => {
  //     const likeCount = likeCountsMap.get(record.id) || 0;
  //     const commentCount = commentCountsMap.get(record.id) || 0;
  //     const currentUserVote = userVotesMap.get(record.id) || 0;
  //     return mapPostRecordToOutput(
  //       record,
  //       likeCount,
  //       commentCount,
  //       currentUserVote,
  //     );
  //   });

  //   return postOutputs;
};

// Optional but recommended: Refactor findAllPosts and findPostById to use this helper
// e.g., in findAllPosts, after getting postRecords:
// return addCountsAndVotesToPosts(postRecords, currentUserId);
// e.g., in findPostById, after getting postRecord:
// const enrichedPosts = await addCountsAndVotesToPosts([postRecord], currentUserId);
// return enrichedPosts[0]; // Assuming it always returns at least one if postRecord exists
