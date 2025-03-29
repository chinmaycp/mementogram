// mementogram/packages/frontend/src/services/apiClient.ts
import axios from "axios";

// Retrieve the token storage key from where AuthContext saves it
const TOKEN_STORAGE_KEY = "mementogram_token"; // Ensure this matches AuthContext.tsx

// Create a base axios instance
const apiClient = axios.create({
  // No baseURL needed if using Vite proxy correctly for /api paths starting with /api
  headers: {
    "Content-Type": "application/json",
    // 'Accept': 'application/json',
  },
});

// --- Request Interceptor ---
// This function will run before each request is sent
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (or potentially AuthContext/state management later)
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    // If a token exists, add the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Continue with the modified config
  },
  (error) => {
    // Handle request errors (e.g., network issues before sending)
    return Promise.reject(error);
  },
);

// --- Response Interceptor (Optional but Recommended) ---
// Can be used for global error handling, refreshing tokens, etc.
apiClient.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    // Just return the response directly
    return response;
  },
  (error) => {
    // Any status codes outside the range of 2xx cause this function to trigger
    // Handle specific errors globally if needed (e.g., 401 Unauthorized might trigger logout)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.error(
        "Unauthorized request - potentially expired token:",
        error.response.data,
      );
      // TODO: Implement logout logic here? Or redirect to login?
      // Be careful not to cause infinite loops if the login page itself makes API calls.
      // Example: Call logout from AuthContext? (Requires careful context setup or event emitter)
      // authContextLogoutFunction(); // Placeholder
    }
    // Return the error promise so components can still catch it locally
    return Promise.reject(error);
  },
);

export default apiClient; // Export the configured instance
