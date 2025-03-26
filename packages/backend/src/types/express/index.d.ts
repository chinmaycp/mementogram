// Define the structure of the payload embedded within our JWT
export interface UserJwtPayload {
  userId: number;
  role: string;
}

// Use declaration merging to add the 'user' property to the Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserJwtPayload; // Optionalfor unauthenticated routes
    }
  }
}

export {}; // The empty export statement is required to treat this file as a module
