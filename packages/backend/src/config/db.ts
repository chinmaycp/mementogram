import knex, { Knex } from "knex";
import knexConfig from "../../knexfile";

const environment = process.env.NODE_ENV || "development";
const config = knexConfig[environment];

if (!config) {
  throw new Error(
    `Knex configuration for environment '${environment}' not found.`,
  );
}

// Initialize Knex instance
const db: Knex = knex(config);

export const checkDbConnectionKnex = async (): Promise<void> => {
  console.log(`Attempting db connection in [${environment}] mode...`);
  try {
    // Perform a simple query to test connection
    const result = await db.raw("SELECT 1+1 as result");
    if (result?.rows?.[0]?.result === 2) {
      console.log("✅ Successfully connected to the database using Knex!");
    } else {
      throw new Error("Simple query did not return expected result.");
    }
  } catch (error) {
    console.error("❌ Failed to connect to the database using Knex:", error);
    process.exit(1);
  }
};

export default db;
