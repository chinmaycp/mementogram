import db from "../config/db";
import { NotFoundError, ForbiddenError } from "../errors";
import {
  PostRecord,
  PostOutput,
  PostCreateInput,
  PostUpdateInput,
} from "../types/posts";
import * as likeService from "./likeService";
import { PaginationParams } from "../types/common";

const POSTS_TABLE = "posts";
const LIKES_TABLE = "likes";

// --- Service Functions ---

/**
 * Creates a new post in the database.
 * @param postData - Data for the new post, including userId.
 * @returns The newly created post record.
 */
export const createPost = async (
  postData: PostCreateInput,
): Promise<PostOutput> => {
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
): Promise<PostOutput> => {
  const postRecord = await db<PostRecord>(POSTS_TABLE)
    .where({ id: postId })
    .first();

  if (!postRecord) {
    throw new NotFoundError(`Post with ID ${postId} not found.`);
  }

  // Fetch like count and like status in parallel
  const [likeCount, isLiked] = await Promise.all([
    likeService.getLikeCount(postId),
    likeService.checkIfUserLikedPost(currentUserId, postId),
  ]);

  return mapPostRecordToOutput(postRecord, likeCount, isLiked);
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
    .count("* as likeCount")
    .whereIn("post_id", postIds)
    .groupBy("post_id");

  // Create a map for easy lookup: postId -> likeCount
  const likeCountsMap = new Map<number, number>();
  likeCountsResult.forEach((row: any) => {
    likeCountsMap.set(
      row.post_id,
      parseInt((row.likeCount as string) || "0", 10),
    );
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

  // 4. Combine the data
  const postOutputs = postRecords.map((record) => {
    const likeCount = likeCountsMap.get(record.id) || 0;
    const isLiked = currentUserId ? likedPostIdsSet.has(record.id) : undefined;
    return mapPostRecordToOutput(record, likeCount, isLiked);
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
): Promise<PostOutput> => {
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
  isLiked?: boolean, // Optional based on whether a user context is provided
): PostOutput => {
  return {
    id: record.id,
    content: record.content,
    imageUrl: record.image_url, // Map from snake_case
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    likeCount: likeCount,
    isLikedByCurrentUser: isLiked,
  };
};
