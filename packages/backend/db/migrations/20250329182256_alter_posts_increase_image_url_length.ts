import type { Knex } from "knex";

const TABLE_NAME = "posts";
const COLUMN_NAME = "image_url";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Change the column type to TEXT to allow for long URLs
    table.text(COLUMN_NAME).alter();
    // If you preferred a longer VARCHAR instead:
    // table.string(COLUMN_NAME, 1024).alter(); // Example: VARCHAR(1024)
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert back to VARCHAR(255). NOTE: This could cause data loss
  // if you rollback after inserting URLs longer than 255 chars.
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string(COLUMN_NAME, 255).alter();
  });
}
