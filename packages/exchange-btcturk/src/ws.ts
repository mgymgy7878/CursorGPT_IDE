import { WebSocket } from "ws";

export type WSReport = { connected: boolean; durationMs: number; messages: number; errors: number };

export async function wsProbe(opts?: { url?: string; durationSec?: number }): Promise<WSReport> {
  const url = opts?.url ?? process.env.BTCTURK_WS_URL ?? "";
  const durationSec = opts?.durationSec ?? Number(process.env.BTCTURK_WS_PROBE_SEC ?? 10);
  if (!url) return { connected: false, durationMs: 0, messages: 0, errors: 0 };

  let messages = 0, errors = 0;
  const t0 = Date.now();
  const ws = new WebSocket(url, { handshakeTimeout: 4000 });

  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, durationSec * 1000);
    ws.on("open", () => { /* optional: ws.send(JSON.stringify({ type:"ping" })) */ });
    ws.on("message", () => { messages++; });
    ws.on("error", () => { errors++; });
    ws.on("close", () => { /* noop */ });
    setTimeout(() => { try { ws.close(); } catch {} }, durationSec * 1000 - 50);
    ws.once("open", () => { /* stay until timer */ });
    timer.unref?.();
  });

  const durationMs = Date.now() - t0;
  return { connected: errors === 0, durationMs, messages, errors };
}
