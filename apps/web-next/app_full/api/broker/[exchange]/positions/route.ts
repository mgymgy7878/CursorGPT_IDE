import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"

export async function GET(req: Request, { params }: { params: { exchange: string } }) {
  try { requireRole(new Headers(req.headers)) } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return NextResponse.json({ exchange: params.exchange, positions: [] })
} 