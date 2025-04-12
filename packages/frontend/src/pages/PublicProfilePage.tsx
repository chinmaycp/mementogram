import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import * as userService from "../services/userService"; // Import user service
import { PublicUserProfile } from "../types/users"; // Import the type
import { UserPostList } from "../features/posts/components/UserPostList"; // Import post list component

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>(); // Get username from URL param
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setError("Username not found in URL."); // Should not happen with route setup
      setIsLoading(false);
      return;
    }

    const fetchPublicProfile = async () => {
      setIsLoading(true);
      setError(null);
      setProfile(null); // Reset profile on username change
      try {
        console.log(`Workspaceing profile for: ${username}`);
        const profileData = await userService.getPublicUserProfile(username);
        setProfile(profileData);
      } catch (err: unknown) {
        console.error(`Failed to fetch profile for ${username}:`, err);
        let message = "Failed to load user profile.";
        if (axios.isAxiosError(err) && err.response) {
          message =
            err.response.status === 404
              ? `User '${username}' not found.`
              : err.response.data?.message || message;
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicProfile();
  }, [username]); // Re-run effect if username changes

  // --- Render Logic ---
  if (isLoading) {
    return <div className="p-4 text-center">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  // This should ideally not happen if loading is false and no error, but good check
  if (!profile) {
    return <div className="p-4 text-center">User profile not available.</div>;
  }

  // --- Display Profile & Posts ---
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {/* Basic Profile Header */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-white rounded shadow-sm">
        {/* Profile Pic Placeholder */}
        <div className="w-20 h-20 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center text-3xl font-semibold">
          {profile.profilePicUrl ? (
            <img
              src={profile.profilePicUrl}
              alt={profile.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            profile.username?.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          {profile.fullName && (
            <p className="text-gray-700">{profile.fullName}</p>
          )}
          {profile.bio && <p className="text-gray-500 mt-1">{profile.bio}</p>}
          <p className="text-xs text-gray-400 mt-2">
            Joined: {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          {/* TODO: Add Follow/Unfollow Button here later */}
          {/* TODO: Add Follower/Following Counts here later */}
        </div>
      </div>

      {/* User's Posts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-t pt-4">Posts</h2>
        {/* Render UserPostList only AFTER profile (and thus profile.id) is loaded */}
        <UserPostList userId={profile.id} />
      </div>
    </div>
  );
};

export default PublicProfilePage;
