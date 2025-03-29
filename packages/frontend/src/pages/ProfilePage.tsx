// mementogram/packages/frontend/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import * as userService from "../services/userService"; // Import the frontend user service
import { UserProfile } from "../services/userService"; // Import the type
// Or import { UserProfile } from '../types/users'; // If defined centrally

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userProfileData = await userService.getMe(); // Call the service function
        setProfile(userProfileData);
      } catch (err: unknown) {
        console.error("Failed to fetch profile:", err);
        let message = "Failed to load profile.";

        // Use type guards to safely access properties
        if (axios.isAxiosError(err) && err.response) {
          // If it's an Axios error with a response from the backend
          message = err.response.data?.message || message;
        } else if (err instanceof Error) {
          // If it's a generic JavaScript Error
          message = err.message;
        }
        // If it's some other thrown value (e.g., a string), the default message is used

        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []); // Empty dependency array means run once on mount

  // --- Render Logic ---
  if (isLoading) {
    return <div className="p-4 text-center">Loading profile...</div>; // Basic loading state
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>; // Basic error display
  }

  if (!profile) {
    // Should technically not happen if loading is false and no error, but good practice
    return <div className="p-4 text-center">Profile data not available.</div>;
  }

  // --- Display Profile Data ---
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="bg-white p-6 rounded shadow-md">
        {/* Basic Profile Pic Placeholder */}
        <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-500">
          {/* Replace with img tag later */}
          <span>{profile.username?.charAt(0).toUpperCase()}</span>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold">
            {profile.fullName || profile.username}
          </h2>
          <p className="text-gray-600">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="text-gray-700 text-center mb-6">{profile.bio}</p>
        )}

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-1">
            <strong>Email:</strong> {profile.email}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Role:</strong> {profile.roleName}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Joined:</strong>{" "}
            {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          {/* TODO: Add Follower/Following counts */}
          {/* TODO: Add Edit Profile Button */}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
