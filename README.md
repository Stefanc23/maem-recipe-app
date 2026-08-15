# maem

maem is a mobile-first recipe repository PWA for saving the dishes worth
remembering. The React + Vite UI is deployed as a static site on Vercel, while
Firebase provides email/password authentication and Firestore recipe records.
Cloudinary stores authenticated recipe photos through Vercel server functions.
There is no ChatGPT account requirement.

## Run locally

The app requires Node.js `>=22.13.0`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Firebase values, the capture flow remains available in local demo mode.
For real accounts and synced recipes, add the web app values from Firebase
console → Project settings → Your apps → Web app to `.env.local`.

To exercise the authenticated Cloudinary functions locally, use `npx vercel
dev` after adding the server-only variables. Plain `npm run dev` serves the
Vite UI but does not emulate Vercel's `/api` functions.

## Firebase setup

1. Create a Firebase project and register a Web app.
2. In Authentication → Sign-in method, enable Email/Password.
3. Create a Firestore database in production mode.
4. Deploy the Firestore rules:

```bash
npx firebase-tools login
npx firebase-tools use YOUR_PROJECT_ID
npx firebase-tools deploy --only firestore:rules
```

The rules keep every recipe scoped to the signed-in Firebase `uid`.
The client never accepts an owner id from form input. Firestore creates the
`recipes` collection on the first successful save with these fields:
`ownerId`, `title`, `note`, `photoPublicId`, `createdAt`, and `updatedAt`.

## Cloudinary photos

Create a Cloudinary account and set `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Vercel. Also set the three
Firebase Admin variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
`FIREBASE_PRIVATE_KEY`) for the Vercel server functions.

Photos are checked for JPEG, PNG, or WebP input under 12 MB in the browser,
compressed locally, then sent to the app's `/api/photos/upload` function. The
server uses Sharp to rotate, resize, and recompress the payload to JPEG at or
below 1.5 MB before sending it to Cloudinary. Cloudinary receives no
transformation parameters; all stored assets use `authenticated` delivery and
are addressed with an opaque `users/{uid}/recipes/{id}` public ID.

The `/api/photos/url` and `/api/photos/delete` functions verify the Firebase ID
token and enforce that the requested Cloudinary public ID belongs to that user.

Export or delete assets intentionally with:

```bash
npm run cloudinary:export -- --out=cloudinary-assets.json
npm run cloudinary:delete -- --public-id=users/USER_ID/recipes/PHOTO_ID --dry-run
npm run cloudinary:delete -- --public-id=users/USER_ID/recipes/PHOTO_ID --confirm
```

The utility loads `.env.local` (then `.env`) automatically for local use. Hosting
environments can continue to provide the same variables through the shell.

The export file is ignored by Git. Keep it as an inventory before changing
providers or deleting a Firebase recipe collection.

## Deploy to Vercel

Connect the repository to Vercel or run the Vercel CLI. The checked-in
`vercel.json` builds `dist/` and rewrites client-side routes to `index.html`.
Add the five `VITE_FIREBASE_*` values, the three Firebase Admin values, and the
three Cloudinary server values as Vercel environment variables for Preview and
Production, then redeploy.

```bash
npm run build
npx vercel --prod
```

Use a custom domain in Vercel for a short public URL. The existing manifest,
icons, social preview, standalone display mode, and service worker remain in
`public/`; only the static shell is cached offline. Recipe data, photos, and
mutations intentionally require connectivity.
