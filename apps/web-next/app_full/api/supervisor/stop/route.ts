import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"

export async function POST(req: Request) {
  try { requireRole(new Headers(req.headers)) } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  const body = await req.json().catch(()=> ({}))
  return NextResponse.json({ ok: true, stopped: body })
} 
