import sharp from "sharp";

export const MAX_STORED_PHOTO_BYTES = 1.5 * 1024 * 1024;

export async function compressPhoto(input: Buffer): Promise<Buffer> {
  let width = 1600;
  let quality = 82;
  let output = await transform(input, width, quality);
  for (let attempt = 0; attempt < 6 && output.length > MAX_STORED_PHOTO_BYTES; attempt += 1) {
    width = Math.max(900, Math.round(width * 0.86));
    quality = Math.max(48, quality - 8);
    output = await transform(input, width, quality);
  }
  if (output.length > MAX_STORED_PHOTO_BYTES) throw new Error("Photo is too detailed to compress.");
  return output;
}

function transform(input: Buffer, width: number, quality: number) {
  return sharp(input)
    .rotate()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}
