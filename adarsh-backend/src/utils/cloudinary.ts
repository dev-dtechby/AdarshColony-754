import fs from "fs";
import cloudinary from "../config/cloudinary";

export type CloudinaryUploadResult = {
  url: string;
  secure_url: string;
  public_id: string;
  original_filename?: string;
};

/**
 * ✅ Disk file upload (Branao style)
 */
export async function uploadToCloudinary(
  localFilePath: string,
  folder: string
): Promise<CloudinaryUploadResult> {
  if (!localFilePath) throw new Error("uploadToCloudinary: file path missing");

  const res = await cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: "auto",
  });

  return {
    url: res.url,
    secure_url: res.secure_url,
    public_id: res.public_id,
    original_filename: res.original_filename,
  };
}

/**
 * ✅ Buffer upload (Adarsh rental docs: multer memoryStorage)
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> {
  if (!buffer) throw new Error("uploadBufferToCloudinary: buffer missing");

  const res = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

  return {
    url: res.url,
    secure_url: res.secure_url,
    public_id: res.public_id,
    original_filename: res.original_filename,
  };
}

export async function deleteFromCloudinary(publicId: string) {
  if (!publicId) return;
  try {
    // ✅ auto so PDF/image both delete properly
    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
  } catch {
    // ignore
  }
}

export async function safeUnlink(path?: string | null) {
  if (!path) return;
  try {
    await fs.promises.unlink(path);
  } catch {
    // ignore
  }
}