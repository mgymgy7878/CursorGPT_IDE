import { Summary, Counter, Gauge } from "../lib/metrics.js";
import { register as registry } from "../metrics.js";

export const aiChatMsSummary = new Summary({
	name: 'ai_chat_ms_summary',
	help: 'AI chat end-to-end processing time (ms)',
	percentiles: [0.5, 0.9, 0.95, 0.99],
	registers: [registry]
});

export const aiToolCallsTotal = new Counter({
	name: 'ai_tool_calls_total',
	help: 'AI tool bridge calls',
	labelNames: ['tool'] as any,
	registers: [registry]
});

export const aiGuardedActionsTotal = new Counter({
	name: 'ai_guarded_actions_total',
	help: 'Guarded (preview/confirmed) actions',
	labelNames: ['action','allowWrite','confirmed'] as any,
	registers: [registry]
});

export const aiSseClients = new Gauge({
	name: 'ai_sse_clients',
	help: 'Current SSE client connections',
	registers: [registry]
});

export const aiConfirmErrorsTotal = new Counter({
	name: 'ai_confirm_errors_total',
	help: 'Confirm/apply failures',
	registers: [registry]
});

export const aiRouterChoiceTotal = new Counter({
	name: 'ai_router_choice_total',
	help: 'Router model selections',
	labelNames: ['provider','model'] as any,
	registers: [registry]
});

export const aiRouterFailoverTotal = new Counter({
	name: 'ai_router_failover_total',
	help: 'Router failovers',
	labelNames: ['from','to','reason'] as any,
	registers: [registry]
});

export const aiCharsOutTotal = new Counter({
	name: 'ai_chars_out_total',
	help: 'Approx streamed characters out',
	labelNames: ['provider','model'] as any,
	registers: [registry]
});

export const aiOverrideTotal = new Counter({
	name: 'ai_override_total',
	help: 'User-scoped model override operations',
	labelNames: ['op'] as any, // set|clear
	registers: [registry]
});

export const aiDriftExplainTotal = new Counter({
	name: 'ai_drift_explain_total',
	help: 'Drift explain istek sayısı',
	registers: [registry]
});

export const aiDriftCompareTotal = new Counter({
	name: 'ai_drift_compare_total',
	help: 'Drift compare istek sayısı',
	registers: [registry]
});

export const aiModelHintTotal = new Counter({
	name: 'ai_model_hint_total',
	help: 'Model hint istek sayısı',
	registers: [registry]
});

// Rate-limit trip counter (toplam)
export const aiRateLimitTripsTotal = new Counter({
	name: 'ai_rate_limit_trips_total',
	help: 'AI SSE rate-limit exceeded events',
	registers: [registry]
});

// NEW: Rate-limit trips by IP (Grafana panelleri için)
export const aiRateLimitTripsByIpTotal = new Counter({
	name: 'ai_rate_limit_trips_by_ip_total',
	help: 'AI SSE rate-limit exceeded events by IP',
	labelNames: ['ip'] as any,
	registers: [registry]
});

// NEW: JSON out counter (tool label)
export const aiJsonOutTotal = new Counter({
	name: 'ai_json_out_total',
	help: 'JSON event payloads streamed (by tool)',
	labelNames: ['tool'] as any,
	registers: [registry]
});

// NEW: SSE resume tokens / Last-Event-ID kullanımı
export const aiResumeTokensTotal = new Counter({
	name: 'ai_resume_tokens_total',
	help: 'SSE resume via Last-Event-ID occurrences',
	registers: [registry]
});

// NEW: Backtest runner metrics
export const aiBacktestRunsTotal = new Counter({
	name: 'ai_backtest_runs_total',
	help: 'Backtest runs',
	registers: [registry]
});
export const aiBacktestErrorsTotal = new Counter({
	name: 'ai_backtest_errors_total',
	help: 'Backtest errors',
	registers: [registry]
});
export const aiBacktestMsSummary = new Summary({
	name: 'ai_backtest_ms_summary',
	help: 'Backtest latency ms',
	percentiles: [0.5, 0.95],
	registers: [registry]
}); 