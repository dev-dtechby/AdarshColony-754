// D:\Projects\branao.in\clone\branao-Full-Kit\branao-backend\src\utils\cloudinary.ts

import fs from "fs";
import cloudinary from "../config/cloudinary";

export type CloudinaryUploadResult = {
  url: string;
  secure_url: string;
  public_id: string;
  original_filename?: string;
};

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

export async function deleteFromCloudinary(publicId: string) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
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
