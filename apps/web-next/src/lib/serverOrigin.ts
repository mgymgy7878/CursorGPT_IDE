import { headers } from "next/headers";

export function serverOrigin(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "127.0.0.1:3003";
  const protoHdr = h.get("x-forwarded-proto");
  const proto = process.env.VERCEL ? (protoHdr ?? "https") : "http";
  return `${proto}://${host}`;
}


