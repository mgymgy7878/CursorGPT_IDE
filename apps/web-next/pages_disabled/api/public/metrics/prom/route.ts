import { NextRequest, NextResponse } from "next/server"
import { clients, messages } from "../../../logs/sse/route"
import { spark_opt_iters_total, spark_walkforward_runs_total, spark_overfit_score, spark_opt_pf, spark_opt_score } from "../../../strategy/optimize/route"
import { envBool, envNum } from "../../../../lib/env"
import { spark_kills_total } from "../../../live/kill/route"
import { spark_news_events_total, spark_sentiment_events_total } from "../../../events/ingest/route"
import { spark_live_blocked_total } from "../../../broker/[exchange]/order/route"
import { spark_precision_registry_hits_total, spark_precision_registry_misses_total, spark_qty_rounding_corrections_total, spark_order_rejects_total } from "@spark/agents"

let fusionScore = 0
let strategySwitches = 0
export function setFusionScore(v:number){ fusionScore = v }
export function incSwitch(){ strategySwitches++ }

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
  const xr = req.headers.get('x-real-ip') || undefined
  const rti = (req as unknown as { ip?: string }).ip
  return xf || rti || xr || '127.0.0.1'
}

function isAllowedIp(ip: string): boolean {
  const raw = process.env.PROM_ALLOWLIST || '127.0.0.1,::1'
  const list = raw.split(',').map(s => s.trim()).filter(Boolean)
  return list.includes(ip)
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  if (!isAllowedIp(ip)) {
    return NextResponse.json({ ok: false, error: 'Forbidden (IP)' }, { status: 403 })
  }
  const base = '# HELP app_up 1 if up\n# TYPE app_up gauge\napp_up 1\n'
  const liveEnabled = envBool('LIVE_ENABLED', false) ? 1 : 0
  const liveCapPct = envNum('LIVE_NOTIONAL_CAP_PCT', 1)
  const extra = `# HELP spark_sse_clients SSE clients\n# TYPE spark_sse_clients gauge\nspark_sse_clients ${clients}\n# HELP spark_sse_messages_total SSE messages total\n# TYPE spark_sse_messages_total counter\nspark_sse_messages_total ${messages}\n# HELP spark_opt_iters_total Optimization iterations\n# TYPE spark_opt_iters_total counter\nspark_opt_iters_total ${spark_opt_iters_total}\n# HELP spark_walkforward_runs_total Walk-forward runs\n# TYPE spark_walkforward_runs_total counter\nspark_walkforward_runs_total ${spark_walkforward_runs_total}\n# HELP spark_overfit_score Overfit score\n# TYPE spark_overfit_score gauge\nspark_overfit_score ${spark_overfit_score}\n# HELP spark_opt_pf Profit factor\n# TYPE spark_opt_pf gauge\nspark_opt_pf ${spark_opt_pf}\n# HELP spark_opt_score Optimizer score\n# TYPE spark_opt_score gauge\nspark_opt_score ${spark_opt_score}\n# HELP spark_live_enabled Live enabled\n# TYPE spark_live_enabled gauge\nspark_live_enabled ${liveEnabled}\n# HELP spark_live_notional_cap_pct Live notional cap pct\n# TYPE spark_live_notional_cap_pct gauge\nspark_live_notional_cap_pct ${liveCapPct}\n# HELP spark_kills_total Kill-switch activations\n# TYPE spark_kills_total counter\nspark_kills_total ${spark_kills_total}\n# HELP spark_live_blocked_total Live blocked orders\n# TYPE spark_live_blocked_total counter\nspark_live_blocked_total ${spark_live_blocked_total}\n# HELP spark_news_events_total News events\n# TYPE spark_news_events_total counter\nspark_news_events_total ${spark_news_events_total}\n# HELP spark_sentiment_events_total Sentiment events\n# TYPE spark_sentiment_events_total counter\nspark_sentiment_events_total ${spark_sentiment_events_total}\n# HELP spark_precision_registry_hits_total Precision registry hits\n# TYPE spark_precision_registry_hits_total counter\nspark_precision_registry_hits_total ${spark_precision_registry_hits_total}\n# HELP spark_precision_registry_misses_total Precision registry misses\n# TYPE spark_precision_registry_misses_total counter\nspark_precision_registry_misses_total ${spark_precision_registry_misses_total}\n# HELP spark_qty_rounding_corrections_total Qty rounding corrections\n# TYPE spark_qty_rounding_corrections_total counter\nspark_qty_rounding_corrections_total ${spark_qty_rounding_corrections_total}\n# HELP spark_order_rejects_total Order rejects\n# TYPE spark_order_rejects_total counter\nspark_order_rejects_total ${spark_order_rejects_total}\n# HELP spark_signal_fusion_score Fusion score\n# TYPE spark_signal_fusion_score gauge\nspark_signal_fusion_score ${fusionScore}\n# HELP spark_strategy_switches_total Strategy switches\n# TYPE spark_strategy_switches_total counter\nspark_strategy_switches_total ${strategySwitches}\n`
  const body = base + extra
  return new NextResponse(body, { status: 200, headers: { 'content-type': 'text/plain; version=0.0.4' } })
} 
