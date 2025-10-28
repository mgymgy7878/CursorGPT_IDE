import client from "prom-client";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const wsStalenessSeconds = new client.Gauge({
  name: "ws_staleness_seconds",
  help: "Age of the last received tick in seconds (per source)",
  labelNames: ["source"],
  registers: [registry],
});

export const ticksTotal = new client.Counter({
  name: "ticks_total",
  help: "Total received ticks (per source)",
  labelNames: ["source"],
  registers: [registry],
});

export function observeTick(source: string, ts: number) {
  ticksTotal.labels(source).inc();
  const age = Math.max(0, (Date.now() - ts) / 1000);
  wsStalenessSeconds.labels(source).set(age);
}
