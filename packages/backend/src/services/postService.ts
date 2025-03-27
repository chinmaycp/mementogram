import db from "../config/db";

// --- Interfaces (Temporary - move to shared-types later) ---

export interface PostRecord {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PostCreateInput {
  content: string;
  imageUrl?: string;
  userId: number; // ID of user creating post
}

export interface PostUpdateInput {
  content?: string;
  imageUrl?: string;
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// --- Service Functions ---

/**
 * Creates a new post in the database.
 * @param postData - Data for the new post, including userId.
 * @returns The newly created post record.
 */
export const createPost = async (
  postData: PostCreateInput,
): Promise<PostRecord> => {
  const [newPost] = await db<PostRecord>("posts")
    .insert({
      user_id: postData.userId,
      content: postData.content,
      image_url: postData.imageUrl,
    })
    .returning("*"); // Return all columns

  return newPost;
};

/**
 * Finds a single post by its ID.
 * @param postId - The ID of the post to find.
 * @returns The post record if found, otherwise throws NotFoundError.
 */
export const findPostById = async (postId: number): Promise<PostRecord> => {
  const post = await db<PostRecord>("posts").where({ id: postId }).first();

  if (!post) {
    throw new NotFoundError(`Post with ID ${postId} not found.`);
  }
  return post;
};

/**
 * Retrieves all posts, ordered by creation date (newest first).
 * TODO: Add pagination (limit, offset) later.
 * @returns An array of post records.
 */
export const findAllPosts = async (): Promise<PostRecord[]> => {
  const posts = await db<PostRecord>("posts")
    .orderBy("created_at", "desc")
    .select("*");

  return posts;
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
): Promise<PostRecord> => {
  // Prepare data for update, excluding undefined fields
  const dataToUpdate: { content?: string; image_url?: string | null } = {};
  if (updateData.content !== undefined) {
    dataToUpdate.content = updateData.content;
  }
  if (updateData.imageUrl !== undefined) {
    // Allow setting image_url to null or a new string
    dataToUpdate.image_url =
      updateData.imageUrl === null ? null : updateData.imageUrl;
  }

  // Only update if content or imageUrl is provided
  if (Object.keys(dataToUpdate).length === 0) {
    // If nothing to update, fetch and return the current post if it belongs to user
    const currentPost = await findPostById(postId);
    if (currentPost.user_id !== userId) {
      throw new ForbiddenError("You do not own this post.");
    }
    return currentPost;
  }

  // Perform update only where id AND user_id match
  const [updatedPost] = await db<PostRecord>("posts")
    .where({ id: postId, user_id: userId }) // *** Ownership check ***
    .update(dataToUpdate)
    .returning("*"); // Return the updated record

  if (!updatedPost) {
    // If update returned nothing, it means either post didn't exist OR user didn't own it.
    // Check if post exists at all to differentiate error type
    const postExists = await db("posts").where({ id: postId }).first();
    if (!postExists) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    } else {
      // Post exists but user_id didn't match
      throw new ForbiddenError(
        `You do not have permission to update post ID ${postId}.`,
      );
    }
  }

  return updatedPost;
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
  const deletedCount = await db<PostRecord>("posts")
    .where({ id: postId, user_id: userId }) // *** Ownership check ***
    .del(); // .del() returns the number of rows deleted

  if (deletedCount === 0) {
    // If no rows were deleted, check if post exists at all to differentiate error
    const postExists = await db("posts").where({ id: postId }).first();
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
