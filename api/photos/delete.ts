import type { IncomingMessage, ServerResponse } from "node:http";
import { getCloudinary, isOwnedPhotoId } from "../../lib/server/cloudinary";
import { verifyFirebaseUser } from "../../lib/server/firebase-admin";
import { errorStatus, readJson, sendJson } from "../../lib/server/http";

type DeleteBody = { publicId?: string };

export default async function deletePhoto(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });
  try {
    const user = await verifyFirebaseUser(request);
    const { publicId } = await readJson<DeleteBody>(request);
    if (!publicId || !isOwnedPhotoId(publicId, user.uid)) return sendJson(response, 404, { error: "Photo not found." });
    const result = await getCloudinary().uploader.destroy(publicId, {
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") return sendJson(response, 502, { error: "Cloudinary could not delete the photo." });
    return sendJson(response, 200, { deleted: result.result !== "not found" });
  } catch (error) {
    return sendJson(response, errorStatus(error), { error: error instanceof Error ? error.message : "Photo deletion failed." });
  }
}
