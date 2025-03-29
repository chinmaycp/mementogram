import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Adjust path if needed

interface ProtectedRouteProps {
  children: React.ReactNode; // The component to render if authenticated
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Get current location

  // Show loading indicator while auth state is being determined
  if (isLoading) {
    // TODO: Replace with a better loading component/spinner
    return <div>Checking authentication...</div>;
  }

  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to in the state property. This allows us to redirect them
    // back to that page after they successfully log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the child component
  return <>{children}</>;
};
