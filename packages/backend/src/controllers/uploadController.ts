import { Request, Response, NextFunction } from "express";
import * as uploadService from "../services/uploadService";
import { UserJwtPayload } from "../types/express";

export const handleGetUploadPresignedUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    // Get filename and contentType from request body
    const { filename, contentType } = req.body;

    // Basic validation
    if (!filename || !contentType) {
      res
        .status(400)
        .json({
          message:
            "Both filename and contentType are required in the request body.",
        });
      return;
    }
    // TODO: Add more validation (e.g., allowed content types, filename format/length)

    const params = {
      userId: user.userId,
      filename: filename as string,
      contentType: contentType as string,
    };

    // Call the service to generate the URL
    const urlData = await uploadService.generateUploadUrl(params);

    // Send the URLs back to the client
    res.status(200).json({
      status: "success",
      data: urlData, // Contains presignedUrl, objectUrl, objectKey
    });
  } catch (error: any) {
    console.error("Get Presigned URL Error:", error);
    if (error.message === "Server configuration error for file uploads.") {
      res.status(500).json({ message: error.message });
    } else if (error.message === "Could not generate upload URL.") {
      res.status(500).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({
          message: "An error occurred while preparing the file upload.",
        });
    }
  }
};
