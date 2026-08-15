import type { IncomingMessage, ServerResponse } from "node:http";
import { getCloudinary, photoPublicId } from "../../lib/server/cloudinary";
import { verifyFirebaseUser } from "../../lib/server/firebase-admin";
import { errorStatus, readJson, sendJson } from "../../lib/server/http";
import { compressPhoto, MAX_STORED_PHOTO_BYTES } from "../../lib/server/photo-transform";

type UploadBody = { dataUrl?: string };

export default async function uploadPhoto(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });
  try {
    const user = await verifyFirebaseUser(request);
    const { dataUrl } = await readJson<UploadBody>(request);
    if (!dataUrl?.startsWith("data:image/")) return sendJson(response, 400, { error: "Expected an image data URL." });
    const match = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
    if (!match) return sendJson(response, 400, { error: "Only JPEG, PNG, and WebP images are supported." });
    const source = Buffer.from(match[2], "base64");
    if (!source.length || source.length > 2 * 1024 * 1024) return sendJson(response, 413, { error: "Photo exceeds the upload limit." });
    const compressed = await compressPhoto(source);
    if (compressed.length > MAX_STORED_PHOTO_BYTES) return sendJson(response, 413, { error: "Photo could not be compressed under the storage limit." });
    const publicId = photoPublicId(user.uid);
    const cloud = getCloudinary();
    const result = await new Promise<{ public_id: string }>((resolve, reject) => {
      const stream = cloud.uploader.upload_stream({
        resource_type: "image",
        type: "authenticated",
        public_id: publicId,
        overwrite: false,
        invalidate: true,
      }, (error, uploaded) => {
        if (error || !uploaded) reject(error || new Error("Cloudinary upload failed."));
        else resolve({ public_id: uploaded.public_id });
      });
      stream.end(compressed);
    });
    const url = cloud.url(result.public_id, { resource_type: "image", type: "authenticated", secure: true, sign_url: true });
    return sendJson(response, 200, { publicId: result.public_id, url });
  } catch (error) {
    return sendJson(response, errorStatus(error), { error: error instanceof Error ? error.message : "Photo upload failed." });
  }
}
