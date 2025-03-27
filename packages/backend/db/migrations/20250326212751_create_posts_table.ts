import type { Knex } from "knex";

const TABLE_NAME = "posts";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable() // A post must belong to a user
      .references("id")
      .inTable("users") // References the 'id' column in the 'users' table
      .onDelete("CASCADE"); // If a user is deleted, delete their posts too
    // TODO: on user delete, keep user data for max 30 days, then delete
    table.text("content").notNullable(); // Main text content of the post
    table.string("image_url"); // optional image URL
    table.timestamps(true, true); // Adds 'created_at' and 'updated_at' columns with defaults
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
