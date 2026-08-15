import type { IncomingMessage, ServerResponse } from "node:http";
import { getCloudinary, isOwnedPhotoId } from "../../lib/server/cloudinary";
import { verifyFirebaseUser } from "../../lib/server/firebase-admin";
import { errorStatus, requestUrl, sendJson } from "../../lib/server/http";

export default async function photoUrl(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "GET") return sendJson(response, 405, { error: "Method not allowed" });
  try {
    const user = await verifyFirebaseUser(request);
    const publicId = requestUrl(request).searchParams.get("publicId") || "";
    if (!isOwnedPhotoId(publicId, user.uid)) return sendJson(response, 404, { error: "Photo not found." });
    const url = getCloudinary().url(publicId, {
      resource_type: "image",
      type: "authenticated",
      secure: true,
      sign_url: true,
    });
    return sendJson(response, 200, { url });
  } catch (error) {
    return sendJson(response, errorStatus(error), { error: error instanceof Error ? error.message : "Photo URL unavailable." });
  }
}
