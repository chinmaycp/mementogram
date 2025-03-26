import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { checkDbConnectionKnex } from "./config/db";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/userRoutes";

// --- Initialization ---

dotenv.config(); // Loading environment variables from .env file

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

// --- Middleware ---

app.use(cors());
app.use(helmet()); // basic security headers
app.use(morgan("dev")); // logger for HTTP requests
app.use(express.json()); // req/res body parser for JSON
app.use(express.urlencoded({ extended: true })); // req/res body parser for URL encoded data

// --- API Routes ---

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Mementogram backend is running!" });
});

// --- Start Server ---

const server = app.listen(PORT, async () => {
  console.log(`🚀 Backend Server is listening on port ${PORT}.`);
  await checkDbConnectionKnex();
});

// --- Graceful Shutdown ---
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} signal received. Shutting down gracefully...`);
  server.close(async () => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
