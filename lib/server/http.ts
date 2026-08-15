import type { IncomingMessage, ServerResponse } from "node:http";

export function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export async function readJson<T>(request: IncomingMessage, maxBytes = 3 * 1024 * 1024): Promise<T> {
  const body = (request as IncomingMessage & { body?: unknown }).body;
  if (body && typeof body === "object") return body as T;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

export function requestUrl(request: IncomingMessage) {
  return new URL(request.url || "/", `https://${request.headers.host || "vercel.local"}`);
}

export function errorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (message.includes("body is too large") || message.includes("exceeds the upload limit")) return 413;
  if (message.includes("bearer token") || code.startsWith("auth/")) return 401;
  return 500;
}
