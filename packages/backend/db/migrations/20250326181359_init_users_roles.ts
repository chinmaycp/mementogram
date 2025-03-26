import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create Roles Table
  await knex.schema.createTable("roles", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique(); // Role name ('USER', 'ADMIN')
    table.timestamps(true, true); // Adds created_at and updated_at timestamps
  });

  // Seed initial roles immediately after creating the table
  await knex("roles").insert([
    { id: 1, name: "USER" },
    { id: 2, name: "ADMIN" },
    // Add other roles if needed
  ]);

  // Create Users Table
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email").notNullable().unique();
    table.string("username").notNullable().unique();
    table.string("password_hash").notNullable();
    table.string("full_name"); // Optional
    table.text("bio"); // Optional, use text for longer content
    table.string("profile_pic_url"); // Optional

    table
      .integer("role_id")
      .unsigned() // Ensure it's positive
      .references("id") // Foreign key reference
      .inTable("roles") // Points to 'roles' table
      .onDelete("SET NULL") // Or 'RESTRICT'/'CASCADE' depending on requirements
      .defaultTo(1); // Default to USER role ID

    table.timestamp("email_verified_at");

    table.timestamps(true, true); // Adds created_at and updated_at
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of creation due to foreign key constraints
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("roles");
}
