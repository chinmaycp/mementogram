import db from "../config/db"; // Knex instance
import { NotFoundError, BadRequestError } from "../errors"; // Custom errors
import {
  CommentRecord,
  CommentOutput,
  CommentCreateInput,
} from "../types/comments";
import { PaginationParams } from "../types/common"; // Import pagination type

const COMMENTS_TABLE = "comments";
const USERS_TABLE = "users";
const POSTS_TABLE = "posts";

/**
 * Creates a new comment on a post.
 * @param commentData - Data for the new comment (userId, postId, content).
 * @returns The newly created comment with author details.
 * @throws NotFoundError if the post does not exist.
 * @throws BadRequestError if content is empty.
 */
export const createComment = async (
  commentData: CommentCreateInput,
): Promise<CommentOutput> => {
  const { userId, postId, content } = commentData;

  if (!content?.trim()) {
    throw new BadRequestError("Comment content cannot be empty.");
  }

  // 1. Check if the post exists
  const postExists = await db(POSTS_TABLE).where({ id: postId }).first("id");
  if (!postExists) {
    throw new NotFoundError(`Post with ID ${postId} not found.`);
  }

  // 2. Insert the comment
  const [newCommentId] = await db(COMMENTS_TABLE)
    .insert({
      user_id: userId,
      post_id: postId,
      content: content.trim(), // Trim whitespace
    })
    .returning("id"); // Get the ID of the newly inserted comment

  // Ensure newCommentId is an object with an id property, Knex types can be tricky
  const commentId =
    typeof newCommentId === "object" ? newCommentId.id : newCommentId;

  if (!commentId) {
    throw new Error("Failed to create comment or retrieve its ID.");
  }

  // 3. Fetch the newly created comment with author details to return
  const createdComment = await getCommentWithAuthor(commentId);
  return createdComment;
};

/**
 * Retrieves comments for a specific post, with author details, ordered by creation date.
 * @param postId - The ID of the post whose comments are requested.
 * @param pagination - Optional limit and offset for pagination.
 * @returns An array of comment output objects.
 */
export const getCommentsForPost = async (
  postId: number,
  pagination: PaginationParams = {},
): Promise<CommentOutput[]> => {
  const { limit = 20, offset = 0 } = pagination;

  // Optional: Check if post exists first
  // const postExists = await db(POSTS_TABLE).where({ id: postId }).first('id');
  // if (!postExists) return []; // Return empty if post doesn't exist, or throw NotFoundError

  const comments = await db(`${COMMENTS_TABLE} as c`)
    .join(`${USERS_TABLE} as u`, "c.user_id", "=", "u.id")
    .select(
      "c.id",
      "c.post_id",
      "c.content",
      "c.created_at",
      "c.updated_at",
      "u.id as authorId",
      "u.username as authorUsername",
      "u.profile_pic_url as authorProfilePicUrl", // Use snake_case from DB
    )
    .where("c.post_id", postId)
    .orderBy("c.created_at", "desc") // Show newest comments first usually
    .limit(limit)
    .offset(offset);

  // Map the flat result to the nested CommentOutput structure
  return comments.map(mapCommentRecordToOutput);
};

/**
 * Gets the total number of comments for a specific post.
 * @param postId - The ID of the post.
 * @returns The number of comments.
 */
export const getCommentCount = async (postId: number): Promise<number> => {
  const result = await db(COMMENTS_TABLE)
    .where({ post_id: postId })
    .count({ count: "*" })
    .first();
  const count = parseInt((result?.count as string) || "0", 10);
  return count;
};

// --- Helper Functions ---

/**
 * Fetches a single comment by its ID and includes author details.
 * @param commentId - The ID of the comment.
 * @returns The comment output object.
 * @throws NotFoundError if the comment does not exist.
 */
const getCommentWithAuthor = async (
  commentId: number,
): Promise<CommentOutput> => {
  const comment = await db(`${COMMENTS_TABLE} as c`)
    .join(`${USERS_TABLE} as u`, "c.user_id", "=", "u.id")
    .select(
      "c.id",
      "c.post_id",
      "c.content",
      "c.created_at",
      "c.updated_at",
      "u.id as authorId",
      "u.username as authorUsername",
      "u.profile_pic_url as authorProfilePicUrl",
    )
    .where("c.id", commentId)
    .first();

  if (!comment) {
    throw new NotFoundError(`Comment with ID ${commentId} not found.`);
  }
  return mapCommentRecordToOutput(comment);
};

/**
 * Maps a raw comment record (with joined author data) to the CommentOutput structure.
 */
const mapCommentRecordToOutput = (record: any): CommentOutput => {
  // TODO: Define a stricter type for the joined record if possible
  return {
    id: record.id,
    postId: record.post_id,
    content: record.content,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    author: {
      id: record.authorId,
      username: record.authorUsername,
      profilePicUrl: record.authorProfilePicUrl,
    },
  };
};

// --- TODO: Add deleteComment, updateComment later ---
// Remember ownership checks for delete/update
