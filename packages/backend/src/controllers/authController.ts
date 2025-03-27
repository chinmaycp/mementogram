import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userService from "../services/userService";
import { UserRecord } from "../types/users";

// --- Simple Input Validation ---
// TODO: Replace with a more robust validation library like express-validator later
const validateRegisterInput = (data: any) => {
  const { email, username, password } = data;
  if (!email || !username || !password) {
    throw new Error("Email, username, and password are required.");
  }
  if (password.length < 6) {
    // Example: Minimum password length
    throw new Error("Password must be at least 6 characters long.");
  }
  if (username.length < 3 || username.length > 30) {
    // Example: Minimum password length
    throw new Error("Username must be between 3 and 30 characters long.");
  }
  // Basic email format check (can be improved)
  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Invalid email format.");
  }
};

// --- Temporary User Interface (Replace if you create shared types) ---

// Define a simple interface representing the user data we expect/return.
interface UserInput {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

interface UserOutput {
  id: number;
  email: string;
  username: string;
  roleName: string;
  createdAt: Date;
}

interface LoginInput {
  emailOrUsername: string;
  password: string;
}

// --- Controller Function for User Registration ---

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userData: UserInput = req.body;

    // 1. Validate Input
    validateRegisterInput(userData);
    const { email, username, password, fullName } = userData;

    // 2. Check for Existing User (using userService - to be created)
    const existingUser = await userService.findUserByEmailOrUsername(
      email,
      username,
    );
    if (existingUser) {
      // Use 409 Conflict status code for duplicates
      res.status(409).json({ message: "Email or username already exists." });
      return;
    }

    // 3. Hash Password
    const saltRounds = 10; // Recommended salt rounds for bcrypt
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create User in Database (using userService - to be created)
    // Prepare data, excluding the plain password
    const newUserInput = {
      email,
      username,
      passwordHash, // Use the hashed password
      fullName, // Include optional fields if provided
      // roleId will use default (1) defined in the migration/database
    };
    const newUser = await userService.createUser(newUserInput);

    // 5. Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET not found in environment variables.");
      throw new Error("Authentication configuration error."); // Don't expose details
    }

    const tokenPayload = {
      userId: newUser.id,
      role: newUser.roleName || "USER", // Use role name from returned user data
    };

    const token = jwt.sign(
      tokenPayload,
      jwtSecret,
      { expiresIn: "1d" }, // Token expires in 1 day (adjust as needed)
    );

    // 6. Send Response
    // Prepare user data to send back (exclude password hash)
    const userResponse: UserOutput = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      roleName: newUser.roleName || "USER",
      createdAt: newUser.createdAt,
    };

    res.status(201).json({
      // 201 Created status
      message: "User registered successfully!",
      user: userResponse,
      token: token,
    });
  } catch (error: any) {
    console.error("Registration Error:", error); // Log the actual error on the server

    // Send appropriate error response
    if (
      error.message.includes("required") ||
      error.message.includes("Invalid") ||
      error.message.includes("length")
    ) {
      res.status(400).json({ message: error.message }); // Bad Request for validation errors
    } else {
      res
        .status(500)
        .json({ message: "An error occurred during registration." }); // Generic server error
    }
  }
};

// --- Controller Function for User Login ---

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password }: LoginInput = req.body;

    // 1. Basic Validation
    if (!emailOrUsername || !password) {
      res
        .status(400)
        .json({ message: "Email/username and password are required." });
      return;
    }

    // 2. Find User by email or username (using userService)
    // This service function MUST retrieve the password hash
    const userRecord = await userService.findUserForLogin(emailOrUsername);

    if (!userRecord) {
      // User not found - Use 401 Unauthorized for security (avoid revealing if user exists)
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    // 3. Compare Provided Password with Stored Hash
    const isPasswordValid = await bcrypt.compare(
      password,
      userRecord.password_hash,
    );

    if (!isPasswordValid) {
      // Password doesn't match - Use 401 Unauthorized
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    // --- If password is valid ---

    // 4. Generate JWT (Similar to registration)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Log error server-side, don't expose details to client
      console.error("JWT_SECRET not found during login.");
      throw new Error("Authentication configuration error.");
    }

    // Fetch role name based on role_id (assuming 1=USER, 2=ADMIN as before)
    // TODO: Fetch role name properly if more roles exist or if not seeded reliably
    const roleName =
      userRecord.role_id === 1
        ? "USER"
        : userRecord.role_id === 2
          ? "ADMIN"
          : "UNKNOWN";

    const tokenPayload = {
      userId: userRecord.id,
      role: roleName,
    };

    const token = jwt.sign(
      tokenPayload,
      jwtSecret,
      { expiresIn: "1d" }, // Consider different expiration for login? Usually same/similar.
    );

    // 5. Send Response
    // Prepare user data to send back (exclude password hash)
    const userResponse: UserOutput = {
      // Using the same output interface as register
      id: userRecord.id,
      email: userRecord.email,
      username: userRecord.username,
      roleName: roleName,
      createdAt: userRecord.created_at, // Or maybe updated_at? Depending on needs.
    };

    res.status(200).json({
      // 200 OK status for successful login
      message: "Login successful!",
      user: userResponse,
      token: token,
    });
  } catch (error: any) {
    console.error("Login Error:", error); // Log the actual error on the server
    res.status(500).json({ message: "An error occurred during login." }); // Generic server error
  }
};
