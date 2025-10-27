import { NextResponse } from "next/server";

function checkAdmin(req: Request) {
  const required = process.env.ADMIN_TOKEN;
  if (!required) return true; // token tanımlı değilse dev modda serbest
  const got = req.headers.get("x-admin-token");
  return got === required;
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ ok:false, error:"unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(()=> ({}));
  const pause = !!body?.pause;

  try {
    const r = await fetch(`http://127.0.0.1:4001/optimizer/pause?state=${pause?"pause":"resume"}`, { method:"POST" });
    if (!r.ok) throw new Error("backend not ok");
    return NextResponse.json({ ok:true, forwarded:true, pause });
  } catch {
    // mock yanıt
    return NextResponse.json({ ok:true, forwarded:false, pause });
  }
}

