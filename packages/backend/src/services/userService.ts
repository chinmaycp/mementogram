import db from "../config/db";

// --- Interfaces (Temporary - move to shared-types later) ---

// Input for creating a user (matches controller, includes hash)
interface UserCreateInput {
  email: string;
  username: string;
  passwordHash: string;
  fullName?: string;
  // roleId is handled by default in DB schema for now
}

// Represents core user data returned from DB operations
// Adjust based on actual needs and what Knex returns
export interface UserRecord {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  role_id: number;
  created_at: Date;
  updated_at: Date;
  full_name?: string;
  email_verified_at?: Date;
}

// Output matching controller's expected structure (after creation)
interface UserOutput {
  id: number;
  email: string;
  username: string;
  roleName?: string; // Add role name here
  createdAt: Date;
}

// --- Service Functions ---

/**
 * Finds a user by their email OR username.
 * Used to check for duplicates during registration or for login.
 * @param email - The user's email
 * @param username - The user's username
 * @returns The user record if found, otherwise undefined.
 */
export const findUserByEmailOrUsername = async (
  email: string,
  username: string,
): Promise<Pick<UserRecord, "id" | "email" | "username"> | undefined> => {
  const user = await db<UserRecord>("users")
    .select("id", "email", "username")
    .where("email", email)
    .orWhere("username", username)
    .first(); // .first() returns the first match or undefined

  return user;
};

/**
 * Creates a new user in the database.
 * @param userData - Object containing user details including passwordHash.
 * @returns The newly created user's essential details (excluding password hash).
 */
export const createUser = async (
  userData: UserCreateInput,
): Promise<UserOutput> => {
  // Knex returns an array of inserted records. Use [0] to get the first one.
  // Use 'returning' to get back specific columns after insert.
  // Map database column names (snake_case) to input object (camelCase if different)
  const [newUserRecord]: UserRecord[] = await db<UserRecord>("users")
    .insert({
      email: userData.email,
      username: userData.username,
      password_hash: userData.passwordHash,
      full_name: userData.fullName,
      // role_id uses default value from DB schema
    })
    .returning(["id", "email", "username", "role_id", "created_at"]); // Get necessary fields back

  // We assume role_id 1 corresponds to 'USER' based on migration seeding.
  // In a more complex setup, you might query the 'roles' table here.
  const roleName =
    newUserRecord.role_id === 1
      ? "USER"
      : newUserRecord.role_id === 2
        ? "ADMIN"
        : "UNKNOWN";

  // Map the returned record to the desired UserOutput structure
  const newUserOutput: UserOutput = {
    id: newUserRecord.id,
    email: newUserRecord.email,
    username: newUserRecord.username,
    roleName: roleName,
    createdAt: newUserRecord.created_at,
  };

  return newUserOutput;
};

/**
 * Finds a user by email OR username for login purposes.
 * Importantly, selects the password hash for comparison.
 * @param emailOrUsername - The user's email or username
 * @returns The full user record including password hash if found, otherwise undefined.
 */
export const findUserForLogin = async (
  emailOrUsername: string,
): Promise<UserRecord | undefined> => {
  const user = await db<UserRecord>("users")
    .select(
      "id",
      "email",
      "username",
      "password_hash", // <-- Need this for comparison
      "role_id",
      "created_at",
      "updated_at",
      "full_name",
      "email_verified_at",
    )
    .where("email", emailOrUsername)
    .orWhere("username", emailOrUsername)
    .first();

  return user;
};
