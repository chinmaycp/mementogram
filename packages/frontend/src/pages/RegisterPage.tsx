import React from "react";
import { Link } from "react-router-dom";
import { RegisterForm } from "../features/auth/components/RegisterForm"; // Adjust path if needed

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 flex flex-col justify-center items-center">
      {/* Render the form component */}
      <RegisterForm />

      {/* Add link to login page */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Log in here
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
