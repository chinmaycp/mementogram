import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserJwtPayload } from "../types/express";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;

  // 1. Check for Authorization header and Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1]; // Extract token after "Bearer "
  }

  // 2. If no token found, send Unauthorized
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token provided." });
    return;
  }

  // 3. Verify token
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Log critical error server-side
      console.error("JWT_SECRET is not defined in environment variables.");
      // Send generic error to client
      res.status(500).json({ message: "Server configuration error." });
      return;
    }

    // Verify token using the secret
    const decoded = jwt.verify(token, jwtSecret) as UserJwtPayload; // Type assertion

    // 4. Attach user payload to the request object
    // We need to ensure our JWT payload actually contains userId and role
    if (
      !decoded ||
      typeof decoded.userId !== "number" ||
      typeof decoded.role !== "string"
    ) {
      throw new Error("Invalid token payload structure");
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // 5. Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification failed:", error);

    // Handle different JWT errors specifically if needed (e.g., TokenExpiredError)
    if (error instanceof jwt.JsonWebTokenError) {
      res
        .status(401)
        .json({ message: "Not authorized, token failed verification." });
    } else {
      res.status(401).json({ message: "Not authorized." });
    }
  }
};

/**
 * Middleware to restrict access to specific roles.
 * @param roles - Array of role names allowed to access the route.
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if protect middleware ran and added user, and if user has a role
    if (!req.user?.role) {
      return res
        .status(500)
        .json({ message: "User role not found on request." });
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next(); // role allowed
  };
};
