import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Get PDF page count using a simple heuristic
 * Counts the number of PDF objects (streams) which typically correlates to pages
 */
function getPDFPageCount(filePath: string): number {
  try {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString("binary");

    // Count endstream markers (each page typically has one)
    const matches = content.match(/endstream/g);
    const pageCount = matches ? Math.max(1, Math.ceil(matches.length / 2)) : 1;

    return Math.max(1, pageCount);
  } catch (error) {
    console.error("Error reading PDF:", error);
    return 1; // Default to 1 page if error
  }
}

/**
 * Upload a PDF to Cloudinary and extract pages
 */
export async function uploadPDFToCloudinary(file: Express.Multer.File, folder: string) {
  try {
    // Validate file exists
    if (!fs.existsSync(file.path)) {
      throw new Error(`File not found at: ${file.path}`);
    }

    // Get page count before upload
    const pageCount = getPDFPageCount(file.path);

    // Upload the PDF file
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `planeandprop/newsletters/${folder}`,
      resource_type: "raw", // PDF is raw file type
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    // Extract pages as JPG images using Cloudinary fetch API
    const pages: { page: number; url: string; publicId: string }[] = [];

    // Use Cloudinary's fetch API to transform PDF pages to JPG images
    for (let i = 1; i <= pageCount; i++) {
      // Encode the PDF URL for use in fetch API
      const encodedPdfUrl = encodeURIComponent(result.secure_url);

      // Use fetch API to convert PDF page to JPG
      const pageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/f_jpg,pg_${i},q_auto/${encodedPdfUrl}`;

      pages.push({
        page: i,
        url: pageUrl,
        publicId: `${result.public_id}/page-${i}`,
      });
    }

    // Generate thumbnail from first page
    const thumbnail = cloudinary.url(result.public_id, {
      resource_type: "raw",
      format: "jpg",
      page: 1,
      quality: "auto",
      crop: "fill",
      height: 300,
      width: 400,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      thumbnail,
      pageCount,
      pages,
      fileSize: result.bytes,
    };
  } catch (error) {
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

/**
 * Get transformation URL for a page
 */
export function getPageImageUrl(publicId: string, pageNumber: number, width: number = 1200): string {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    format: "jpg",
    page: pageNumber,
    quality: "auto",
    crop: "scale",
    width,
  });
}

/**
 * Get thumbnail URL
 */
export function getThumbnailUrl(publicId: string, width: number = 400, height: number = 300): string {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    format: "jpg",
    page: 1,
    quality: "auto",
    crop: "fill",
    height,
    width,
  });
}
