import { NextResponse } from "next/server";
const B = process.env.EXECUTOR_BASE_URL;
export async function POST(req: Request) {
  const body = await req.json();
  if (!B) return NextResponse.json({ ok: true }, { status: 200 });
  const r = await fetch(`${B}/api/exec/pause`, {
    method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(body)
  });
  const data = await r.json().catch(()=>({}));
  return NextResponse.json(data, { status: r.status });
}
