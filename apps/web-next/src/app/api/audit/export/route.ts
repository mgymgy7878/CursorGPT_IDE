import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "1000", 10);

  try {
    // Fetch all audit logs
    const executorUrl = new URL(`${EXECUTOR_BASE}/v1/audit`);
    executorUrl.searchParams.set("limit", limit.toString());

    const response = await fetch(executorUrl.toString(), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.data) {
        // Format as JSONL (one JSON object per line)
        const jsonl = data.data
          .map((log: any) => JSON.stringify(log))
          .join("\n");

        // Generate SHA256 checksum
        const crypto = await import("node:crypto");
        const hash = crypto.createHash("sha256").update(jsonl).digest("hex");

        return new NextResponse(jsonl, {
          status: 200,
          headers: {
            "Content-Type": "application/x-ndjson",
            "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.jsonl"`,
            "X-Content-SHA256": hash, // SHA256 checksum header
          },
        });
      }
    }

    return NextResponse.json(
      { ok: false, error: "Failed to export audit logs" },
      { status: 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Export failed: ${e?.message ?? "connection-failed"}` },
      { status: 500 }
    );
  }
}

