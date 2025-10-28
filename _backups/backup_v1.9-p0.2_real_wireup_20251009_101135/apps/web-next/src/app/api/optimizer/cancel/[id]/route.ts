import { NextResponse } from "next/server";

function checkAdmin(req: Request) {
  const required = process.env.ADMIN_TOKEN;
  if (!required) return true;
  const got = req.headers.get("x-admin-token");
  return got === required;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ ok:false, error:"unauthorized" }, { status: 401 });
  }
  const id = params.id;

  try {
    const r = await fetch(`http://127.0.0.1:4001/optimizer/cancel/${encodeURIComponent(id)}`, { method:"POST" });
    if (!r.ok) throw new Error("backend not ok");
    return NextResponse.json({ ok:true, forwarded:true, id });
  } catch {
    // mock
    return NextResponse.json({ ok:true, forwarded:false, id, note:"mock-canceled (dev)" });
  }
}

