import { NextRequest, NextResponse } from "next/server";
import { extractBearer, isDevAuth, verifyToken } from "@spark/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest){
  if (isDevAuth()){
    return NextResponse.json({ sub: req.headers.get("x-dev-sub") || "dev-user-1", role: req.headers.get("x-dev-role") || "admin", dev:true });
  }
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error:"Missing token" }, { status:401 });
  try { const claims = verifyToken(token); return NextResponse.json({ ...claims, dev:false }); }
  catch { return NextResponse.json({ error:"Invalid or expired token" }, { status:401 }); }
}
