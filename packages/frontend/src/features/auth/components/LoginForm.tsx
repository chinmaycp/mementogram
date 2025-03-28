import React, { useState, FormEvent } from "react";
import axios from "axios";
import * as authService from "../../../services/authService";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const LoginForm: React.FC = () => {
  // --- State for Form Inputs ---
  const [emailOrUsername, setEmailOrUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // --- State for UI Feedback ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- Handle Form Submission ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic Client-Side Validation
    if (!emailOrUsername || !password) {
      setError("Both email/username and password are required.");
      setIsLoading(false);
      return;
    }

    console.log("Attempting Login with:", { emailOrUsername, password });

    try {
      const loginData = { emailOrUsername, password };
      const response = await authService.login(loginData);

      console.log("Login successful:", response);

      // --- Handle Success ---

      login(response.token, response.user);
      navigate("/");
    } catch (err: unknown) {
      // Use unknown for better type safety
      console.error("Login failed:", err);

      // Extract error message
      let errorMessage =
        "Login failed. Please check credentials and try again.";
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Form ---
  return (
    <div className="max-w-md mx-auto mt-10">
      {" "}
      {/* Centering and margin */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Log In
        </h2>

        {/* Error Message Display */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Email or Username Input */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="emailOrUsername"
          >
            Email or Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
            id="emailOrUsername"
            type="text" // Use text to allow either email or username
            placeholder="Email or Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring focus:border-blue-300"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          {/* Optional: Add 'Forgot Password?' link later */}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            className={`w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging In..." : "Log In"}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;{new Date().getFullYear()} Mementogram. All rights reserved.
      </p>
    </div>
  );
};
