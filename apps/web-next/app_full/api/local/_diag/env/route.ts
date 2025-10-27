import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    executorOrigin: process.env.EXECUTOR_ORIGIN || null,
    hasExecutorToken: !!process.env.EXECUTOR_TOKEN,
    note: "Edit apps/web-next/.env.local then restart dev server."
  });
} 