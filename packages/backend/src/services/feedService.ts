import db from "../config/db"; // Knex instance
import * as followService from "./followService"; // To get the following list
import { FeedPostOutput } from "../types/posts"; // Import the feed post type
import { PaginationParams } from "../types/common"; // Reuse pagination type for consistency
import * as likeService from "./likeService";
import * as commentService from "./commentService";
import { VoteStatus } from "../types/likes";

const POSTS_TABLE = "posts";
const USERS_TABLE = "users";
const LIKES_TABLE = "likes";
const COMMENTS_TABLE = "comments";

export const getFeedForUser = async (
  userId: number, // The user requesting the feed
  pagination: PaginationParams = {},
): Promise<FeedPostOutput[]> => {
  const { limit = 20, offset = 0 } = pagination;

  // 1. Get IDs of users being followed + self
  const followingUsers = await followService.getFollowing(userId, {
    limit: 1000,
  });
  const followingIds = followingUsers.map((user) => user.id);
  const authorIds = [userId, ...followingIds];

  // 2. Fetch the batch of feed posts joining author details
  const feedPostRecords = await db(`${POSTS_TABLE} as p`)
    .join(`${USERS_TABLE} as u`, "p.user_id", "=", "u.id")
    .select(
      "p.id",
      "p.content",
      "p.image_url",
      "p.created_at",
      "p.updated_at",
      "u.id as authorId",
      "u.username as authorUsername",
      "u.full_name as authorFullName",
      "u.profile_pic_url as authorProfilePicUrl",
    )
    .whereIn("p.user_id", authorIds)
    .orderBy("p.created_at", "desc")
    .limit(limit)
    .offset(offset);

  if (feedPostRecords.length === 0) return [];

  const postIds = feedPostRecords.map((p) => p.id);

  // 3. Fetch like counts for these posts in one query
  const likeCountsResult = await db(LIKES_TABLE)
    .select("post_id")
    .count("* as count")
    .where("vote_type", 1) // filtering for likes only
    .whereIn("post_id", postIds)
    .groupBy("post_id");
  const likeCountsMap = new Map<number, number>();
  likeCountsResult.forEach((row: any) => {
    likeCountsMap.set(
      row.post_id,
      parseInt((row.likeCount as string) || "0", 10),
    );
  });

  // 4. Fetch which of these posts the current requesting user (userId) has liked
  const likedPostsResult = await db(LIKES_TABLE)
    .where({ user_id: userId }) // Use the requesting user's ID
    .whereIn("post_id", postIds)
    .pluck("post_id");
  const likedPostIdsSet = new Set(likedPostsResult);

  // 5. Fetch comment counts for these posts in one query
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

  // Fetch Current User's Vote Status (use requesting userId)
  const userVotesResult = await db(LIKES_TABLE)
    .select("post_id", "vote_type")
    .where({ user_id: userId }) // Use requesting user's ID
    .whereIn("post_id", postIds);
  const userVotesMap = new Map<number, VoteStatus>();
  userVotesResult.forEach((row: any) => {
    userVotesMap.set(row.post_id, row.vote_type as VoteStatus);
  });

  // 5. Combine data into FeedPostOutput structure
  const formattedFeed: FeedPostOutput[] = feedPostRecords.map((record) => ({
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
    likeCount: likeCountsMap.get(record.id) || 0,
    commentCount: commentCountsMap.get(record.id) || 0,
    currentUserVote: userVotesMap.get(record.id) || 0,
  }));

  return formattedFeed;
};
