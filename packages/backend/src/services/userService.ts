import db from "../config/db";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  UnauthorizedError,
} from "../errors"; // Import all needed errors
import {
  UserRecord,
  UserProfile,
  UserProfileOutput,
  PublicUserProfile,
  PublicUserProfileOutput,
  UserUpdateInput,
  UserCreateInput as ServiceUserCreateInput,
} from "../types/users";

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
  userData: ServiceUserCreateInput,
): Promise<UserProfileOutput> => {
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
  const newUserOutput: UserProfileOutput = {
    id: newUserRecord.id,
    email: newUserRecord.email,
    username: newUserRecord.username,
    fullName: newUserRecord.full_name,
    bio: newUserRecord.bio,
    profilePicUrl: newUserRecord.profile_pic_url,
    roleName: roleName,
    createdAt: newUserRecord.created_at,
    updatedAt: newUserRecord.updated_at,
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
      "bio",
      "profile_pic_url",
      "email_verified_at",
    )
    .where("email", emailOrUsername)
    .orWhere("username", emailOrUsername)
    .first();

  return user;
};

/**
 * Finds a user by their ID and returns formatted profile data.
 * Excludes sensitive information like password hash.
 * @param userId - The ID of the user to find.
 * @returns The user profile object.
 * @throws NotFoundError if user not found.
 */
export const findUserById = async (
  userId: number,
): Promise<UserProfileOutput> => {
  const user = await db("users")
    .join("roles", "users.role_id", "=", "roles.id") // Join with roles table
    .select(
      // Select specific fields, excluding password_hash
      "users.id",
      "users.email",
      "users.username",
      "users.full_name", // Use snake_case from DB
      "users.bio",
      "users.profile_pic_url", // Use snake_case from DB
      "users.created_at",
      "users.updated_at",
      "roles.name as roleName", // Select role name, alias to camelCase
    )
    .where("users.id", userId)
    .first(); // Get the first match or undefined

  if (!user) {
    throw new NotFoundError(`User with ID ${userId} not found.`);
  }

  // Map snake_case fields from DB result to camelCase if needed for consistency,
  // though direct mapping is fine if frontend adapts or if names match.
  // Explicitly constructing the output object ensures correct shape.
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.full_name,
    bio: user.bio,
    profilePicUrl: user.profile_pic_url,
    roleName: user.roleName,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

/**
 * Updates a user's profile information.
 * Handles username uniqueness check if username is being updated.
 * @param userId - The ID of the user whose profile is to be updated.
 * @param updateData - An object containing the fields to update.
 * @returns The updated user profile object.
 * @throws NotFoundError if the user does not exist.
 * @throws ConflictError if the new username is already taken.
 */
export const updateUser = async (
  userId: number,
  updateData: UserUpdateInput,
): Promise<UserProfileOutput> => {
  // 1. Check if user exists (optional, update query handles it, but good practice)
  const currentUser = await db<UserRecord>("users")
    .where({ id: userId })
    .first();
  if (!currentUser) {
    throw new NotFoundError(`User with ID ${userId} not found.`);
  }

  // 2. Handle potential username update and uniqueness check
  if (updateData.username && updateData.username !== currentUser.username) {
    const existingUserWithUsername = await db<UserRecord>("users")
      .where("username", updateData.username)
      // .whereNot('id', userId) // Ensure it's not the current user (already checked above)
      .first();
    if (existingUserWithUsername) {
      throw new ConflictError(
        `Username '${updateData.username}' is already taken.`,
      );
    }
  }

  // 3. Prepare data for update (map camelCase input to snake_case DB columns if needed)
  // Knex can often handle undefined properties, but being explicit is clearer.
  const dbUpdateData: {
    full_name?: string | null;
    bio?: string | null;
    username?: string;
    profile_pic_url?: string | null;
  } = {};
  if (updateData.fullName !== undefined)
    dbUpdateData.full_name = updateData.fullName;
  if (updateData.bio !== undefined) dbUpdateData.bio = updateData.bio;
  if (updateData.username !== undefined)
    dbUpdateData.username = updateData.username;
  if (updateData.profilePicUrl !== undefined)
    dbUpdateData.profile_pic_url = updateData.profilePicUrl;

  // Only proceed if there's actually data to update
  if (Object.keys(dbUpdateData).length === 0) {
    // If nothing to update, just return the current profile
    return findUserById(userId);
  }

  // 4. Perform the update
  await db<UserRecord>("users").where({ id: userId }).update(dbUpdateData);

  // 5. Fetch and return the updated profile using findUserById
  // This ensures we return the full profile structure with role name and correct fields
  const updatedProfile = await findUserById(userId);
  return updatedProfile;
};

/**
 * Finds a user by username and returns public profile data.
 * Excludes sensitive information like email, password hash, roles.
 * @param username - The username to search for.
 * @returns The public user profile object.
 * @throws NotFoundError if user not found.
 */
export const findUserProfileByUsername = async (
  username: string,
): Promise<PublicUserProfileOutput> => {
  // Consider case-insensitivity if needed: .whereRaw('LOWER(username) = LOWER(?)', [username])
  const user = await db<UserRecord>("users")
    .select(
      // Select only public fields
      "id",
      "username",
      "full_name", // Use snake_case from DB
      "bio",
      "profile_pic_url", // Use snake_case from DB
      "created_at",
    )
    .where({ username: username }) // Case-sensitive search by default
    .first();

  if (!user) {
    throw new NotFoundError(`User with username '${username}' not found.`);
  }

  // Map to the output structure (handling potential snake_case to camelCase if desired)
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    bio: user.bio,
    profilePicUrl: user.profile_pic_url,
    createdAt: user.created_at,
  };
};
