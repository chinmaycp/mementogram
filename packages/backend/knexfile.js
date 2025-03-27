"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "./.env") });
const config = {
    development: {
        client: "pg", // Specify the database client
        connection: process.env.DATABASE_URL_DEV,
        migrations: {
            directory: "./db/migrations", // Directory for migration files
            extension: "ts", // Use TypeScript for migrations
        },
        seeds: {
            directory: "./db/seeds", // Directory for seed files
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
            directory: "./db/migrations",
            extension: "ts", // Use 'js' if compiling migrations before deploy
        },
    },
    // Add staging environment if needed
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map