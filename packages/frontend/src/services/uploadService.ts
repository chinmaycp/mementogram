import axios from "axios";
import apiClient from "./apiClient"; // Our configured axios instance for backend calls

// Expected response structure from our backend's presigned URL endpoint
interface PresignedUrlResponse {
  presignedUrl: string;
  objectUrl: string;
  objectKey: string;
}

interface GetPresignedUrlArgs {
  filename: string;
  contentType: string;
}

/**
 * Gets a presigned URL from the backend for uploading a file to S3.
 * Requires authentication (token handled by apiClient interceptor).
 * @param args - Object containing filename and contentType.
 * @returns Promise resolving with the presigned URL details.
 * @throws AxiosError on API failure.
 */
export const getPresignedUrl = async (
  args: GetPresignedUrlArgs,
): Promise<PresignedUrlResponse> => {
  const response = await apiClient.post<{
    status: string;
    data: PresignedUrlResponse;
  }>(
    "/api/v1/uploads/presigned-url",
    args, // Send filename and contentType in the body
  );
  return response.data.data;
};

/**
 * Uploads a file directly to S3 using a presigned URL.
 * Uses a plain axios request, NOT apiClient, to avoid sending auth headers to S3.
 * @param presignedUrl - The URL obtained from getPresignedUrl.
 * @param file - The File object to upload.
 * @param contentType - The content type of the file (MUST match the one used to get the URL).
 * @returns Promise resolving on successful upload.
 * @throws AxiosError on S3 upload failure.
 */
export const uploadFileToS3 = async (
  presignedUrl: string,
  file: File,
  contentType: string,
): Promise<void> => {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": contentType,
      // Do NOT add Authorization header here - S3 uses URL signature
    },
    // Optional: Add onUploadProgress handler for progress bars
    // onUploadProgress: (progressEvent) => {
    //     if (progressEvent.total) {
    //         const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    //         console.log(`Upload Progress: ${percentCompleted}%`);
    //         // Update progress state here
    //     }
    // },
  });
  // Axios throws error for non-2xx status, so no explicit success return needed
};
