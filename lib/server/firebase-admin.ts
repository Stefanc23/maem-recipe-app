import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { IncomingMessage } from "node:http";

function getAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured.");
  }
  const app = getApps()[0] || initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getAuth(app);
}

export async function verifyFirebaseUser(request: IncomingMessage): Promise<{ uid: string }> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new Error("Missing Firebase bearer token.");
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new Error("Missing Firebase bearer token.");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return { uid: decoded.uid };
}
