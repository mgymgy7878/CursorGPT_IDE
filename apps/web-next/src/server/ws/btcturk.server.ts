import { onWsMessageServerSide } from "../metrics";

let started = false;

export async function ensureBtcturkServer(pairs: string[] = ["BTCTRY", "BTCUSDT"]) {
  if (started) return;
  started = true;

  const url = process.env.BTCTURK_WS_URL ?? "wss://ws-feed-pro.btcturk.com";
  const mode = process.env.WS_MODE ?? "mock";

  if (mode === "mock") {
    const t = setInterval(() => onWsMessageServerSide(), 1000);
    (t as any).unref?.();
    return;
  }

  // Node: use 'ws' package if global WebSocket not present
  const WS: any = (globalThis as any).WebSocket ?? (await import("ws")).WebSocket;
  (globalThis as any).WebSocket = WS;

  let ws: any = null;
  let backoff = 1000;

  const subscribe = () => {
    try { ws?.send(JSON.stringify({ type: "subscribe", channels: ["trades"], pairs })); } catch {}
  };

  const connect = () => {
    ws = new WS(url);
    ws.onopen = () => { backoff = 1000; subscribe(); };
    ws.onmessage = () => { onWsMessageServerSide(); };
    ws.onclose = () => { setTimeout(connect, Math.min(backoff, 10000)); backoff = Math.min(backoff * 2, 10000); };
    ws.onerror = () => { try { ws.close(); } catch {} };
  };

  connect();
}


