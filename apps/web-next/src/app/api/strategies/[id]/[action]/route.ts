import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string; action: string } }
) {
  const { id, action } = params;
  const body = await req.json().catch(() => ({}));

  if (!["start", "pause", "stop"].includes(action)) {
    return NextResponse.json(
      { ok: false, error: "Invalid action. Must be start, pause, or stop" },
      { status: 400 }
    );
  }

  try {
    const executorUrl = `${EXECUTOR_BASE}/v1/strategies/${id}/${action}`;
    const response = await fetch(executorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { ok: false, error: data.error || "Unknown error" },
      { status: response.status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Executor unavailable: ${e?.message ?? "connection-failed"}` },
      { status: 500 }
    );
  }
}

