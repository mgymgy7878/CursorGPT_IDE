import client from "prom-client";

export const guardrailsKillSwitchGauge = new client.Gauge({
  name: "guardrails_kill_switch_state",
  help: "1=blocked, 0=normal",
  registers: [],
});

export const backtestJobDurationSeconds = new client.Histogram({
  name: "backtest_job_duration_seconds",
  help: "Duration of backtest jobs in seconds",
  buckets: [1, 2, 5, 10, 30, 60, 120],
  registers: [],
});
