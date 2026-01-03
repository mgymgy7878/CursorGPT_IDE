import { NextResponse } from "next/server";
import { EXECUTOR_BASE, getBuildCommit, getSparkMode } from "@/lib/spark/config";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check endpoint (proxies to Executor /health)
 *
 * Cache paranoyasını bitirmek için her response'a requestId ve buildCommit ekler.
 * Dev/debug modunda requestId ile log yazar (troubleshooting için).
 */
export async function GET() {
  // Generate short requestId (kısa GUID - ilk 8 karakter)
  const requestId = randomUUID().split("-")[0];

  // Build commit (tek kaynak utility)
  const buildCommit = getBuildCommit();

  // Spark mode (tek kaynak utility)
  const sparkMode = getSparkMode();

  try {
    const executorUrl = `${EXECUTOR_BASE}/health`;
    const startTime = Date.now();
    const response = await fetch(executorUrl, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(1500), // 1.5s timeout (degraded detection için)
    });

    const latency = Date.now() - startTime;
    const isSlow = latency > 1000; // >1s is degraded

    // Log (dev/debug flag açıkken) - requestId ile troubleshooting
    const isDev = process.env.NODE_ENV === "development";
    const debugHealth = process.env.DEBUG_HEALTH === "1" || process.env.DEBUG_HEALTH === "true";
    if (isDev || debugHealth) {
      console.log(
        `[health] requestId=${requestId} buildCommit=${buildCommit} latencyMs=${latency} status=${response.ok ? (isSlow ? "degraded" : "healthy") : "down"}`
      );
    }

    if (response.ok) {
      const data = await response.json();
      // Mark as degraded if slow (>1s latency)
      if (isSlow) {
        return NextResponse.json(
          {
            ...data,
            status: data.status === "healthy" ? "degraded" : data.status,
            latency,
            requestId,
            buildCommit,
            sparkMode,
          },
          { status: 200 }
        );
      }
      return NextResponse.json({ ...data, latency, requestId, buildCommit, sparkMode }, { status: 200 });
    }

    return NextResponse.json(
      {
        status: "down",
        service: "executor",
        db: "unknown",
        error: `Executor returned ${response.status}`,
        requestId,
        buildCommit,
        sparkMode,
      },
      { status: 503 }
    );
  } catch (e: any) {
    // Timeout durumunda 'degraded', diğer hatalarda 'down'
    const isTimeout = e?.name === "AbortError" || e?.message?.includes("timeout");
    return NextResponse.json(
      {
        status: isTimeout ? "degraded" : "down",
        service: "executor",
        db: "unknown",
        error: e?.message ?? "Executor unavailable",
        requestId,
        buildCommit,
        sparkMode,
      },
      { status: 503 }
    );
  }
}
