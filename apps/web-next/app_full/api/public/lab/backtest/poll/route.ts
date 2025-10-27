import { NextResponse } from "next/server";
import { getJob } from "../../_jobs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  const job = getJob(id);
  if (!job) return NextResponse.json({ error:'not_found' }, { status:404 });
  return NextResponse.json(job, { headers:{ 'cache-control':'no-store' }});
} 