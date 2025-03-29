import type { Knex } from "knex";

const TABLE_NAME = "likes";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    // Foreign Key to the user who liked the post
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); // If the user is deleted, remove their like

    // Foreign Key to the post that was liked
    table
      .integer("post_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("posts")
      .onDelete("CASCADE"); // If the post is deleted, remove the like

    // Timestamp of when the like occurred
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Composite Primary Key: Ensures a user can only like a specific post once
    table.primary(["user_id", "post_id"]);

    // Index for efficiently querying likes per post (e.g., for like counts)
    table.index("post_id");
    // Optional: Index for efficiently querying posts liked by a user
    // table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
