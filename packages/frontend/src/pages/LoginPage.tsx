import React from "react";
import { Link } from "react-router-dom";
import { LoginForm } from "../features/auth/components/LoginForm"; // Adjust path if needed

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 flex flex-col justify-center items-center">
      {/* Render the login form component */}
      <LoginForm />

      {/* Add link to registration page */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
