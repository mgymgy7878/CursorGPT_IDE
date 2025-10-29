import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXECUTOR_BASE = process.env.EXECUTOR_BASE || "http://localhost:4001";

export async function GET() {
  try {
    const response = await fetch(`${EXECUTOR_BASE}/guardrails`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch guardrails:", error);
    return NextResponse.json(
      { error: "Failed to fetch guardrails" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetch(`${EXECUTOR_BASE}/guardrails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update guardrails:", error);
    return NextResponse.json(
      { error: "Failed to update guardrails" },
      { status: 500 }
    );
  }
}
