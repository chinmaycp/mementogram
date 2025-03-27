import type { Knex } from "knex";

const TABLE_NAME = "follows";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    // Foreign Key to the user doing the following
    table
      .integer("follower_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); // If the follower user is deleted, remove this follow record

    // Foreign Key to the user being followed
    table
      .integer("following_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); // If the followed user is deleted, remove this follow record

    // Timestamp of when the follow action occurred
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Composite Primary Key: Ensures a user can only follow another user once
    table.primary(["follower_id", "following_id"]);

    // Optional: Add index for faster lookups of who a user is following
    table.index("follower_id");
    // Optional: Add index for faster lookups of a user's followers
    table.index("following_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
