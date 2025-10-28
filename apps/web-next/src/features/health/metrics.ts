export type WsHealth = { source: string; staleness: number };

export async function fetchWsHealth(): Promise<WsHealth[]> {
  try {
    // Fetch from marketdata service
    const res = await fetch("http://127.0.0.1:5001/metrics", {
      cache: "no-store",
    });
    const text = await res.text();

    // Parse Prom metrics: ws_staleness_seconds{source="BTCTURK"} 1.23
    const out: WsHealth[] = [];
    for (const line of text.split("\n")) {
      if (!line.startsWith("ws_staleness_seconds")) continue;
      const src = /source="([^"]+)"/.exec(line)?.[1];
      const val = Number(line.split(" ").pop());
      if (src && Number.isFinite(val)) {
        out.push({ source: src, staleness: val });
      }
    }
    return out;
  } catch (err) {
    console.error("Failed to fetch WS health:", err);
    return [];
  }
}
