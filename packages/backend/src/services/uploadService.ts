import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto"; // For generating unique filenames

// Interface for the data returned by the service
export interface PresignedUrlResponse {
  presignedUrl: string;
  objectUrl: string;
  objectKey: string;
}

// Interface for input parameters
interface GenerateUrlParams {
  userId: number;
  filename: string;
  contentType: string;
}

/**
 * Generates a presigned URL for uploading a file directly to S3.
 * @param params - Object containing userId, filename, and contentType.
 * @returns An object containing the presigned URL and the final object URL/key.
 * @throws Error if required environment variables are missing or SDK fails.
 */
export const generateUploadUrl = async (
  params: GenerateUrlParams,
): Promise<PresignedUrlResponse> => {
  const { userId, filename, contentType } = params;

  // --- Configuration ---
  const region = process.env.AWS_REGION;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID; // Optional check, SDK usually handles
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY; // Optional check

  if (!region || !bucketName || !accessKeyId || !secretAccessKey) {
    console.error("AWS S3 configuration missing in environment variables.");
    throw new Error("Server configuration error for file uploads.");
  }

  // --- Initialize S3 Client ---
  // Credentials should be picked up automatically from environment variables
  const s3Client = new S3Client({ region });

  // --- Generate Unique Object Key ---
  const fileExtension = filename.split(".").pop() || "jpg"; // Get extension or default
  // Sanitize filename minimally (remove spaces, weird chars - more robust sanitization needed for production)
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .substring(0, 50);

  const uniqueKey = `posts/${userId}/${randomUUID()}-${sanitizedFilename}\.${fileExtension}`;
  const objectUrl = `https://${bucketName}\.s3\.${region}.amazonaws.com/${uniqueKey}`;

  // --- Create PutObjectCommand ---
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    ContentType: contentType, // Tell S3 the type of file being uploaded
    // ACL: 'public-read', // ONLY use if objects *must* be public - not recommended with presigned URLs typically
  });

  // --- Generate Presigned URL ---
  const expiresInSeconds = 60; // URL expiration time (e.g., 60 seconds)
  try {
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      presignedUrl,
      objectUrl,
      objectKey: uniqueKey,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Could not generate upload URL.");
  }
};
