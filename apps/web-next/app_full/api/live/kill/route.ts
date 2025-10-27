import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"

let kills = 0
export async function POST(req: Request) {
	try { requireRole(new Headers(req.headers)) } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
	kills++
	// TODO: supervisor.stopAll()
	return NextResponse.json({ ok: true, kills })
}

export { kills as spark_kills_total } 
