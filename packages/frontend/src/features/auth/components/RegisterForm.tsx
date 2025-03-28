import React, { useState, FormEvent } from "react";
import axios from "axios";
import * as authService from "../../../services/authService";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const RegisterForm: React.FC = () => {
  // --- State for Form Inputs ---
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>(""); // Optional field

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

    // Basic Client-Side Validation (Example - enhance later)
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }
    if (!email.includes("@")) {
      // Very basic email check
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (!username.trim()) {
      setError("Username cannot be empty.");
      setIsLoading(false);
      return;
    }

    console.log("Attempting Registration with:", { email, username, fullName });

    try {
      const registrationData = {
        email,
        username,
        password,
        fullName: fullName || undefined,
      };

      const response = await authService.register(registrationData);

      console.log("Registration successful:", response);

      // --- Handle Success ---

      login(response.token, response.user);
      navigate("/");

      // Clear form on success
      setEmail("");
      setUsername("");
      setPassword("");
      setFullName("");
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      let errorMessage = "Registration failed. Please try again.";

      if (
        axios.isAxiosError(err) &&
        err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null
      ) {
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message; // Use generic error message
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
          Create Account
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

        {/* Full Name Input (Optional) */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="fullName"
          >
            Full Name <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
            id="fullName"
            type="text"
            placeholder="Your Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Username Input */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="username"
          >
            Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
            id="username"
            type="text"
            placeholder="Choose a Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required // Basic HTML validation
            disabled={isLoading}
          />
        </div>

        {/* Email Input */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
            id="email"
            type="email" // Use email type for basic browser validation
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={6} // Basic HTML validation
            disabled={isLoading}
          />
          {/* Optional: Add password strength indicator later */}
          <p className="text-xs text-gray-500">
            Must be at least 6 characters.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;{new Date().getFullYear()} Mementogram. All rights reserved.
      </p>
    </div>
  );
};
