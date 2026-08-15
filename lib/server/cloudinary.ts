import { v2 as cloudinary } from "cloudinary";

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary credentials are not configured.");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

export function isOwnedPhotoId(publicId: string, uid: string) {
  const prefix = `users/${uid}/recipes/`;
  return publicId.startsWith(prefix) && /^[A-Za-z0-9_-]+$/.test(publicId.slice(prefix.length));
}

export function photoPublicId(uid: string) {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `users/${uid}/recipes/${randomId}`;
}
