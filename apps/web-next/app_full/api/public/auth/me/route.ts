import { NextResponse } from "next/server";

export async function GET() {
  const raw = (globalThis as any).sparkSessionRaw || null;
  // middleware cookie'yi client okuyor; burada sadece header döndürelim
  return NextResponse.json({ 
    ok: true, 
    note: "client reads cookie", 
    ts: new Date().toISOString() 
  }, { status: 200 });
} 