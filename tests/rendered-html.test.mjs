import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the maem UI routes in the Vite SPA", async () => {
  const [entry, ui, router] = await Promise.all([
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/recipe-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/router.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(entry, /LandingPage/);
  assert.match(entry, /AuthPage/);
  assert.match(entry, /RecipeLibrary/);
  assert.match(entry, /RecipeForm/);
  assert.match(entry, /RecipeDetail/);
  assert.match(ui, /TARGET_PHOTO_BYTES/);
  assert.match(router, /pushState/);
});

test("ships the PWA shell and Firebase/Cloudinary/Vercel paths", async () => {
  const [manifest, serviceWorker, firebase, firestoreRules, uploadApi, deleteApi, transform, vercel, cloudinaryScript] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/firebase.ts", import.meta.url), "utf8"),
    readFile(new URL("../firebase/firestore.rules", import.meta.url), "utf8"),
    readFile(new URL("../api/photos/upload.ts", import.meta.url), "utf8"),
    readFile(new URL("../api/photos/delete.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/server/photo-transform.ts", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
    readFile(new URL("../scripts/cloudinary-assets.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(manifest, /"display": "standalone"/);
  assert.match(manifest, /maem-icon-192\.png/);
  assert.match(serviceWorker, /maem-shell-v2/);
  assert.match(firebase, /initializeApp/);
  assert.match(firebase, /createUserWithEmailAndPassword/);
  assert.match(firebase, /collection\(.*recipes/);
  assert.match(firebase, /uploadRecipePhoto/);
  assert.match(firestoreRules, /request\.auth\.uid/);
  assert.match(uploadApi, /authenticated/);
  assert.match(uploadApi, /compressPhoto/);
  assert.doesNotMatch(uploadApi, /transformation/);
  assert.match(deleteApi, /destroy/);
  assert.match(transform, /MAX_STORED_PHOTO_BYTES/);
  assert.match(vercel, /"destination": "\/index\.html"/);
  assert.match(cloudinaryScript, /loadEnvFile/);
  assert.match(cloudinaryScript, /dry-run/);
});
