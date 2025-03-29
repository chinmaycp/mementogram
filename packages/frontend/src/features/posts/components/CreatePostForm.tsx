import React, {
  useState,
  FormEvent,
  ChangeEvent,
  useEffect,
  useRef,
} from "react";
import axios from "axios"; // For error checking
import { useNavigate } from "react-router-dom";
import * as uploadService from "../../../services/uploadService"; // Upload service
import * as postService from "../../../services/postService"; // Post service

export const CreatePostForm: React.FC = () => {
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Optional: Add upload progress state later
  // const [uploadProgress, setUploadProgress] = useState<number>(0);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for resetting file input

  // Clean up image preview URL when component unmounts or file changes
  useEffect(() => {
    // Create preview URL
    let objectUrl: string | null = null;
    if (selectedFile) {
      objectUrl = URL.createObjectURL(selectedFile);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(null); // Clear preview if no file
    }

    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl); // Free memory
      }
    };
  }, [selectedFile]); // Rerun when selectedFile changes

  // Handle file input changes
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic client-side validation (type/size) - enhance later
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file (JPEG, PNG, GIF).");
        setSelectedFile(null);
        return;
      }
      // Add size validation if needed
      // if (file.size > MAX_FILE_SIZE) { ... }

      setSelectedFile(file);
      setError(null); // Clear previous errors
    } else {
      setSelectedFile(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content && !selectedFile) {
      setError("Please add some content or select an image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    // setUploadProgress(0);

    let finalImageUrl: string | undefined = undefined;

    try {
      // --- Step 1: Handle Image Upload (if file selected) ---
      if (selectedFile) {
        // 1a: Get presigned URL from backend
        console.log(
          "Requesting presigned URL for:",
          selectedFile.name,
          selectedFile.type,
        );
        const presignResponse = await uploadService.getPresignedUrl({
          filename: selectedFile.name,
          contentType: selectedFile.type,
        });
        console.log("Received presigned URL data");

        // 1b: Upload file directly to S3 using the presigned URL
        console.log("Uploading file to S3...");
        await uploadService.uploadFileToS3(
          presignResponse.presignedUrl,
          selectedFile,
          selectedFile.type,
          // Pass a progress callback here later if needed
        );
        console.log("S3 Upload successful");
        finalImageUrl = presignResponse.objectUrl; // Get the final URL to save in DB
      }

      // --- Step 2: Create Post Record in DB ---
      console.log("Creating post record in DB...");
      const postData = {
        content: content,
        imageUrl: finalImageUrl, // Will be undefined if no file was uploaded
      };
      const newPost = await postService.createPost(postData);
      console.log("Post created successfully:", newPost);

      // --- Step 3: Handle Success ---
      // Clear form state
      setContent("");
      setSelectedFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        // Reset file input visually
        fileInputRef.current.value = "";
      }

      // Navigate to feed or the new post page? Let's go to feed.
      navigate("/feed");
    } catch (err: unknown) {
      console.error("Failed to create post:", err);
      let message = "Failed to create post. Please try again.";
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.message || // Backend error
          (err.message.includes("Network Error")
            ? "Network error. Please check connection."
            : message); // S3/Network error
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Create New Post
        </h2>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Content Textarea */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="content"
          >
            Content
          </label>
          <textarea
            id="content"
            rows={4}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* File Input */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="postImage"
          >
            Image (Optional)
          </label>
          <input
            ref={fileInputRef} // Assign ref
            id="postImage"
            type="file"
            accept="image/jpeg, image/png, image/gif" // Accept specific image types
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            disabled={isLoading}
          />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Image Preview:
            </p>
            <img
              src={imagePreview}
              alt="Selected preview"
              className="max-h-40 rounded border"
            />
          </div>
        )}

        {/* TODO: Add Upload Progress Bar here */}

        {/* Submit Button */}
        <div className="flex items-center justify-center mt-6">
          <button
            className={`bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Posting..." : "Create Post"}
          </button>
        </div>
      </form>
    </div>
  );
};
