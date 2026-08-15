import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey
    && firebaseConfig.authDomain
    && firebaseConfig.projectId
    && firebaseConfig.messagingSenderId
    && firebaseConfig.appId,
);

const app = firebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

export type FirebaseRecipe = {
  id: string;
  ownerId: string;
  title: string;
  note: string;
  photoPath: string | null;
  image?: string;
  createdAt: string;
  updatedAt: string;
};

function requireService<T>(service: T | null, name: string): T {
  if (!service) throw new Error(`Firebase ${name} is not configured.`);
  return service;
}

function timestampToIso(value: unknown): string {
  if (value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

async function withPhotoUrl(user: User, photoPath: string | null): Promise<string | undefined> {
  if (!photoPath || !auth) return undefined;
  try {
    const token = await user.getIdToken();
    const response = await fetch(`/api/photos/url?publicId=${encodeURIComponent(photoPath)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) return undefined;
    const payload = await response.json() as { url?: string };
    return payload.url;
  } catch {
    return undefined;
  }
}

async function mapRecipe(user: User, id: string, data: DocumentData): Promise<FirebaseRecipe> {
  const photoPath = typeof data.photoPublicId === "string"
    ? data.photoPublicId
    : typeof data.photoPath === "string" ? data.photoPath : null;
  return {
    id,
    ownerId: String(data.ownerId || ""),
    title: String(data.title || ""),
    note: String(data.note || ""),
    photoPath,
    image: await withPhotoUrl(user, photoPath),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function signUp(email: string, password: string): Promise<User> {
  const currentAuth = requireService(auth, "Auth");
  const result = await createUserWithEmailAndPassword(currentAuth, email, password);
  return result.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const currentAuth = requireService(auth, "Auth");
  const result = await signInWithEmailAndPassword(currentAuth, email, password);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  const currentAuth = requireService(auth, "Auth");
  await signOut(currentAuth);
}

function recipesCollection() {
  return collection(requireService(db, "Firestore"), "recipes");
}

async function getOwnedRecipe(user: User, recipeId: string) {
  const snapshot = await getDoc(doc(requireService(db, "Firestore"), "recipes", recipeId));
  if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) return null;
  return snapshot;
}

export async function listRecipes(user: User): Promise<FirebaseRecipe[]> {
  const recipesQuery = query(
    recipesCollection(),
    where("ownerId", "==", user.uid),
  );
  const snapshot = await getDocs(recipesQuery);
  const recipes = await Promise.all(snapshot.docs.map((item) => mapRecipe(user, item.id, item.data())));
  return recipes.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export async function getRecipe(user: User, recipeId: string): Promise<FirebaseRecipe | null> {
  const snapshot = await getOwnedRecipe(user, recipeId);
  return snapshot ? mapRecipe(user, snapshot.id, snapshot.data()) : null;
}

export async function createRecipe(
  user: User,
  input: { title: string; note: string; photoPath?: string | null },
): Promise<FirebaseRecipe> {
  const document = await addDoc(recipesCollection(), {
    ownerId: user.uid,
    title: input.title,
    note: input.note,
    photoPublicId: input.photoPath || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const created = await getOwnedRecipe(user, document.id);
  if (!created) throw new Error("Recipe could not be read after creation.");
  return mapRecipe(user, created.id, created.data());
}

export async function updateRecipe(
  user: User,
  recipeId: string,
  input: { title: string; note: string; photoPath?: string | null },
): Promise<FirebaseRecipe> {
  const existing = await getOwnedRecipe(user, recipeId);
  if (!existing) throw new Error("Recipe not found.");
  await updateDoc(doc(requireService(db, "Firestore"), "recipes", recipeId), {
    title: input.title,
    note: input.note,
    photoPublicId: input.photoPath || null,
    updatedAt: serverTimestamp(),
  });
  const updated = await getOwnedRecipe(user, recipeId);
  if (!updated) throw new Error("Recipe could not be read after update.");
  return mapRecipe(user, updated.id, updated.data());
}

export async function deleteRecipe(user: User, recipeId: string): Promise<void> {
  const existing = await getOwnedRecipe(user, recipeId);
  if (!existing) return;
  const photoPath = typeof existing.data().photoPublicId === "string"
    ? existing.data().photoPublicId
    : typeof existing.data().photoPath === "string" ? existing.data().photoPath : null;
  if (photoPath) await deleteRecipePhoto(user, photoPath);
  await deleteDoc(doc(requireService(db, "Firestore"), "recipes", recipeId));
}

export async function uploadRecipePhoto(user: User, file: File): Promise<{ path: string; url: string }> {
  const token = await user.getIdToken();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare photo upload"));
    reader.readAsDataURL(file);
  });
  const response = await fetch("/api/photos/upload", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ dataUrl }),
  });
  if (!response.ok) throw new Error("Photo upload failed");
  const payload = await response.json() as { publicId?: string; url?: string };
  if (!payload.publicId || !payload.url) throw new Error("Photo upload response was incomplete");
  return { path: payload.publicId, url: payload.url };
}

export async function deleteRecipePhoto(user: User, path: string): Promise<void> {
  const token = await user.getIdToken();
  const response = await fetch("/api/photos/delete", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ publicId: path }),
  });
  if (!response.ok && response.status !== 404) throw new Error("Photo deletion failed");
}
