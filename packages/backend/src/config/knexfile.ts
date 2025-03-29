import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Define interface for environment-specific configs for type safety
interface KnexConfig {
  [key: string]: Knex.Config;
}

const config: KnexConfig = {
  development: {
    client: "pg", // Specify the database client
    connection: process.env.DATABASE_URL_DEV,
    migrations: {
      directory: "../../db/migrations", // Directory for migration files
      extension: "ts", // Use TypeScript for migrations
    },
    seeds: {
      directory: "../../db/seeds", // Directory for seed files
      extension: "ts",
    },
  },

  production: {
    client: "pg",
    connection: process.env.DATABASE_URL_PROD, // Production DB URL (AWS RDS) from .env
    pool: {
      // Connection pooling for production
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "../../db/migrations",
      extension: "ts", // Use 'js' if compiling migrations before deploy
    },
  },
  // Add staging environment if needed
};

export default config;
