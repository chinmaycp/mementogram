import axios from "axios";

// --- Interfaces (Define structure expected from backend) ---
// TODO: Move these to a shared types package later

interface RegisterData {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

interface LoginData {
  emailOrUsername: string;
  password: string;
}

// Matches the 'userResponse' structure from backend controllers
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  roleName: string;
  createdAt: Date;
}

// Matches the overall successful Auth response structure
interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

// --- Axios Instance (Optional but Recommended) ---
// Using a base instance can simplify setting base URLs or default headers
const apiClient = axios.create({
  // No baseURL needed here if using Vite proxy correctly for /api paths
  headers: {
    "Content-Type": "application/json",
    // 'Accept': 'application/json' // Often included
  },
});

// --- Service Functions ---

/**
 * Registers a new user by calling the backend API.
 * @param registerData - User details for registration.
 * @returns Promise resolving with the AuthResponse (user & token).
 * @throws AxiosError on API failure (to be caught by the component).
 */
export const register = async (
  registerData: RegisterData,
): Promise<AuthResponse> => {
  // Vite proxy handles forwarding '/api' to http://localhost:5001
  const response = await apiClient.post<AuthResponse>(
    "/api/v1/auth/register",
    registerData,
  );
  // Axios wraps the actual response data in a 'data' property
  return response.data;
};

/**
 * Logs in a user by calling the backend API.
 * @param loginData - User login credentials.
 * @returns Promise resolving with the AuthResponse (user & token).
 * @throws AxiosError on API failure.
 */
export const login = async (loginData: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    "/api/v1/auth/login",
    loginData,
  );
  return response.data;
};

// --- TODO: Add other auth functions like logout, forgot password etc. later ---
