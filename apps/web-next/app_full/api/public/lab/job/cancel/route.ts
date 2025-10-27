import { NextResponse } from "next/server";
import { cancelJob } from "../../_jobs";

export async function POST(req: Request) {
  const { id } = await req.json();
  cancelJob(id);
  return NextResponse.json({ ok:true }, { headers:{ 'cache-control':'no-store' }});
} 