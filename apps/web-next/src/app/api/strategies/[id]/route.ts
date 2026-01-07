import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/strategies/:id
 * Get strategy details by ID
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const executorUrl = `${EXECUTOR_BASE}/v1/strategies/${id}`;

    const response = await fetch(executorUrl, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: `Strategy with id "${id}" not found` },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch strategy: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return strategy data
    if (data.ok && data.data) {
      return NextResponse.json(data.data, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid response format" },
      { status: 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: `Executor unavailable: ${e?.message ?? "connection-failed"}` },
      { status: 503 }
    );
  }
}

