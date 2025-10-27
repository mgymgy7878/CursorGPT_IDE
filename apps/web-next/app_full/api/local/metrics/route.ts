import { NextResponse } from "next/server";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(metrics.renderProm(), {
    status: 200,
    headers: {
      "content-type": "text/plain; version=0.0.4"
    }
  });
} 