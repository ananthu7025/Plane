import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a PDF to Cloudinary
 * Returns the URL to the original PDF file for iframe display
 */
export async function uploadPDFToCloudinary(file: Express.Multer.File, folder: string) {
  let tempFileDeleted = false;

  try {
    // Validate file exists
    try {
      await fs.access(file.path);
    } catch {
      throw new Error(`File not found at: ${file.path}`);
    }

    // Upload the PDF file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `planeandprop/newsletters/${folder}`,
      resource_type: "raw", // PDF is raw file type
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    // Clean up the temporary file
    try {
      await fs.unlink(file.path);
      tempFileDeleted = true;
    } catch (unlinkError) {
      console.warn("Failed to delete temp file:", file.path, unlinkError);
    }

    return {
      publicId: result.public_id,
      url: result.secure_url, // Direct Cloudinary URL - served through /api/newsletters/:id/pdf proxy
      fileSize: result.bytes,
    };
  } catch (error) {
    // Try to clean up temp file if not already deleted
    if (!tempFileDeleted) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.warn("Failed to delete temp file after error:", file.path, unlinkError);
      }
    }

    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload PDF to Cloudinary");
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}
