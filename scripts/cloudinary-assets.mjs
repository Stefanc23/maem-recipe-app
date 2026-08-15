import { writeFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { v2 as cloudinary } from "cloudinary";

for (const file of [".env.local", ".env"]) {
  try {
    loadEnvFile(file);
  } catch {
    // Environment variables supplied by the shell or hosting provider are valid too.
  }
}

const [, , command, ...args] = process.argv;
const values = new Map(args.filter((value) => value.startsWith("--")).map((value) => {
  const [key, ...rest] = value.slice(2).split("=");
  return [key, rest.join("=") || true];
}));

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) throw new Error("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET first.");
cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

if (command === "export") {
  const resources = [];
  let nextCursor;
  do {
    const page = await cloudinary.api.resources({
      resource_type: "image",
      type: "authenticated",
      prefix: "users/",
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    resources.push(...page.resources.map((asset) => ({
      publicId: asset.public_id,
      format: asset.format,
      bytes: asset.bytes,
      width: asset.width,
      height: asset.height,
      createdAt: asset.created_at,
    })));
    nextCursor = page.next_cursor;
  } while (nextCursor);
  const output = String(values.get("out") || "cloudinary-assets.json");
  await writeFile(output, `${JSON.stringify({ exportedAt: new Date().toISOString(), resources }, null, 2)}\n`);
  console.log(`Exported ${resources.length} authenticated assets to ${output}`);
} else if (command === "delete") {
  const publicId = String(values.get("public-id") || "");
  if (!publicId || !publicId.startsWith("users/")) {
    throw new Error("Deletion requires --public-id=users/...");
  }
  if (values.get("dry-run") === true) {
    console.log(`Dry run: would delete authenticated image ${publicId}`);
    process.exit(0);
  }
  if (values.get("confirm") !== true) {
    throw new Error("Deletion requires --public-id=users/... --confirm (or use --dry-run)");
  }
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image", type: "authenticated", invalidate: true });
  console.log(`${publicId}: ${result.result}`);
} else {
  console.log("Usage:");
  console.log("  npm run cloudinary:export -- --out=cloudinary-assets.json");
  console.log("  npm run cloudinary:delete -- --public-id=users/UID/recipes/ID --dry-run");
  console.log("  npm run cloudinary:delete -- --public-id=users/UID/recipes/ID --confirm");
  process.exitCode = 1;
}
