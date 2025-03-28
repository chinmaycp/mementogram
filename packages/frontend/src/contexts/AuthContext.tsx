import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  PropsWithChildren,
  useCallback,
} from "react";
// Import the AuthUser type from your service (or shared types later)
import { AuthUser } from "../services/authService";

// Define the shape of the authentication state
interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To handle initial check from localStorage
}

// Define the shape of the context value (state + actions)
interface AuthContextType extends AuthState {
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

// Create the Context
// Provide a default undefined value, check for it in useAuth hook
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define storage keys
const TOKEN_STORAGE_KEY = "mementogram_token";
const USER_STORAGE_KEY = "mementogram_user";

// Create the Provider Component
export const AuthProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start loading initially
  });

  // Effect to load state from localStorage on initial mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUserString = localStorage.getItem(USER_STORAGE_KEY);

      if (storedToken && storedUserString) {
        const storedUser = JSON.parse(storedUserString) as AuthUser;
        // TODO: Add basic token validation/expiration check here if needed
        setAuthState({
          token: storedToken,
          user: storedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // No stored session
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage:", error);
      // Ensure loading is false even if parsing fails
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      // Clear potentially corrupted storage
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Login function: Updates state and localStorage
  const login = useCallback((token: string, user: AuthUser) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setAuthState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false, // Ensure loading is false after login
      });
    } catch (error) {
      console.error("Failed to save auth state to localStorage:", error);
      // Proceed with setting state even if localStorage fails? Or show error?
      // Setting state allows app to function for the session.
      setAuthState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  // Logout function: Clears state and localStorage
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove auth state from localStorage:", error);
    }
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // TODO: Redirect to login page after logout? (use navigate hook in component calling logout)
  }, []);

  // Value provided by the context
  const value: AuthContextType = {
    ...authState,
    login,
    logout,
  };

  // Show loading indicator or null while checking localStorage initially
  if (authState.isLoading) {
    // TODO: Replace with a proper loading spinner/component later
    return <div>Loading authentication...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook to consume the context easily
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
