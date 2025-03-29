import type { Knex } from "knex";

const TABLE_NAME = "comments";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    // Primary Key
    table.increments("id").primary();

    // Foreign Key to posts table
    table
      .integer("post_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("posts")
      .onDelete("CASCADE"); // If the post is deleted, delete its comments

    // Foreign Key to users table (author of the comment)
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); // If the user is deleted, delete their comments

    // Comment Content
    table.text("content").notNullable();

    // Timestamps
    table.timestamps(true, true); // Adds created_at and updated_at

    // --- Indexes ---
    // Index for efficiently fetching all comments for a specific post
    table.index("post_id");
    // Optional: Index for fetching all comments by a specific user
    // table.index('user_id');

    // --- For Nested Replies (Future Enhancement) ---
    // table.integer('parent_comment_id').unsigned().references('id').inTable(TABLE_NAME).onDelete('CASCADE');
    // table.index('parent_comment_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
