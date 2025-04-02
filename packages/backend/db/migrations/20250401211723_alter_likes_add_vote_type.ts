import type { Knex } from "knex";

const TABLE_NAME = "likes";
const COLUMN_NAME = "vote_type";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Add vote_type column. 1 for like, -1 for dislike.
    // Make it NOT NULL. Existing likes (if any) might need a default or update step,
    // but assuming table is new/empty or we handle transition is okay for now.
    table.specificType(COLUMN_NAME, "SMALLINT").notNullable().defaultTo(1); // Default to LIKE temporarily if needed
    // Or without default: table.specificType(COLUMN_NAME, 'SMALLINT').notNullable();
    console.log(`Added ${COLUMN_NAME} column to ${TABLE_NAME} table.`);
  });

  // If you have existing data in the 'likes' table from the previous heart-based system,
  // you might want to update them all to have vote_type = 1 here.
  // await knex(TABLE_NAME).update({ vote_type: 1 }).whereNull('vote_type'); // Example update
}

export async function down(knex: Knex): Promise<void> {
  // Check if column exists before trying to drop (safer rollback)
  const hasColumn = await knex.schema.hasColumn(TABLE_NAME, COLUMN_NAME);
  if (hasColumn) {
    await knex.schema.alterTable(TABLE_NAME, (table) => {
      table.dropColumn(COLUMN_NAME);
      console.log(`Dropped ${COLUMN_NAME} column from ${TABLE_NAME} table.`);
    });
  } else {
    console.log(
      `${COLUMN_NAME} column not found in ${TABLE_NAME} table, skipping drop.`,
    );
  }
}
