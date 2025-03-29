import React from "react";
import { CreatePostForm } from "../features/posts/components/CreatePostForm"; // Adjust path if needed

const CreatePostPage: React.FC = () => {
  return (
    // Add some padding/container if desired, or let the form handle its own max-width
    <div className="container mx-auto py-4 px-2">
      {/* You could add a page title here if needed */}
      {/* <h1 className="text-2xl font-bold mb-4 text-center">Create New Post</h1> */}
      <CreatePostForm />
    </div>
  );
};

export default CreatePostPage;
