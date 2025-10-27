export const isProd = process.env.NODE_ENV === "production";
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
export const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? "dev-token-123";
