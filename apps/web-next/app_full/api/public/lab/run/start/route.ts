import { NextResponse } from "next/server";
import { createJob } from "../../_jobs";

export async function POST(req: Request) {
  // İstersen burada body.code, params validate et
  const job = createJob('run', 3000);
  return NextResponse.json({ jobId: job.id }, { headers:{ 'cache-control':'no-store' }});
} 