import { NextResponse } from "next/server";
import { score } from "@/lib/ml/fusion";
import { MODEL_VERSION, FEATURE_VERSION } from "@/lib/ml/featureVersion";
import type { ScoreRequest } from "@/lib/ml/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Partial<ScoreRequest>;
  
  if (!body.feature) {
    return NextResponse.json(
      { _err: "feature required" },
      { status: 400 }
    );
  }
  
  try {
    // Check for test guardrails override
    const testGuardrails = req.headers.get('x-test-guardrails');
    let ctx = body.ctx;
    
    if (testGuardrails) {
      // Parse test override: "p95=1600,err=0.03"
      const overrides: any = {};
      testGuardrails.split(',').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key === 'p95') overrides.p95_ms = parseInt(value);
        if (key === 'err') overrides.error_rate = parseFloat(value);
      });
      ctx = { ...ctx, ...overrides };
    }
    
    const resp = score({
      modelId: body.modelId ?? MODEL_VERSION,
      feature: body.feature as any,
      ctx
    });
    
    // Add advisory flag (guardrails disabled → advisory only)
    const responseWithAdvisory = {
      ...resp,
      advisory: !resp.guardrails.pass
    };
    
    // v2.1 prep: calibration binning
    const bucket = Math.floor(resp.confid * 10) / 10;
    
    // Get signal parts for weight optimization
    const { parts } = require('@/lib/ml/fusion').fuseSignals(body.feature);
    
    // Audit push (non-blocking) with v2.1 metadata
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ml.score",
        result: resp.guardrails.pass ? "ok" : "err",
        strategyId: `ml-${resp.symbol}-${resp.modelId}`,
        traceId: resp.traceId,
        timestamp: Date.now(),
        details: JSON.stringify({
          symbol: resp.symbol,
          decision: resp.decision,
          confid: resp.confid.toFixed(3),
          guardrails: resp.guardrails.pass,
          score: resp.score.toFixed(3),
          // v2.1 metadata (calibration + weight optimization)
          ml_bucket: bucket,
          ml_signal_parts: {
            rsi: parts.rsi?.toFixed(3),
            macd: parts.macd?.toFixed(3),
            trend: parts.trend?.toFixed(3)
          }
        })
      })
    }).catch(() => {});
    
    return NextResponse.json(responseWithAdvisory, { 
      status: 200,
      headers: {
        "X-Trace-ID": resp.traceId,
        "X-Model-ID": resp.modelId || MODEL_VERSION,
        "X-Feature-Version": FEATURE_VERSION,
        "X-Build-SHA": process.env.BUILD_SHA || "dev"
      }
    });
  } catch (e: any) {
    // Audit error
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ml.score",
        result: "err",
        strategyId: "ml-error",
        timestamp: Date.now(),
        details: `Score failed: ${e?.message || "unknown"}`
      })
    }).catch(() => {});
    
    return NextResponse.json(
      { _err: e?.message ?? "score-failed" },
      { status: 200 }
    );
  }
}

