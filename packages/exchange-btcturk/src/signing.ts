import crypto from "crypto";
import axios, { AxiosInstance } from "axios";

export function btcturkHeaders(apiKey: string, apiSecretB64: string, nowMs = Date.now()) {
  const msg = `${apiKey}${nowMs}`;
  const key = Buffer.from(apiSecretB64, "base64");           // secret BASE64 -> bytes
  const sig = crypto.createHmac("sha256", key).update(msg).digest("base64");
  return { "X-PCK": apiKey, "X-Stamp": String(nowMs), "X-Signature": sig };
}

export function makeBtcturkClient(apiKey: string, apiSecretB64: string): AxiosInstance {
  const client = axios.create({
    baseURL: "https://api.btcturk.com",
    timeout: 10_000,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    // Not: V1 özel uçlar /api/v1/* altında
  });

  // Basit rate-limit/nonce katmanı + Retry-After saygısı
  let inFlight = 0, queue: (() => void)[] = [];
  const maxConcurrency = 2;

  const acquire = () => new Promise<void>(r => {
    const tryGo = () => (inFlight < maxConcurrency ? (inFlight++, r()) : queue.push(tryGo));
    tryGo();
  });
  const release = () => { inFlight--; (queue.shift()?.()) };

  client.interceptors.request.use(async (cfg) => {
    await acquire();
    const nowMs = Date.now(); // (Opsiyonel) drift>2000ms ise server-time ile düzelt
    cfg.headers = { ...(cfg.headers ?? {}), ...btcturkHeaders(apiKey, apiSecretB64, nowMs) } as any;
    return cfg;
  });

  client.interceptors.response.use(
    (res) => { release(); return res; },
    async (err) => {
      release();
      const ra = Number(err?.response?.headers?.["retry-after"]);
      if (err?.response?.status === 429 && Number.isFinite(ra)) {
        await new Promise(r => setTimeout(r, ra * 1000));
        return client.request(err.config);
      }
      throw err;
    }
  );

  return client;
}

// Clock drift guard
export async function checkClockDrift(client: AxiosInstance): Promise<number> {
  try {
    // BTCTurk server time endpoint (public)
    const { data } = await client.get("/api/v2/server/time");
    const serverTime = data.serverTime;
    const localTime = Date.now();
    const drift = Math.abs(serverTime - localTime);
    
    if (drift > 2000) {
      console.warn(`Clock drift detected: ${drift}ms`);
    }
    
    return drift;
  } catch (error) {
    console.warn('Failed to check clock drift:', error);
    return 0;
  }
}

// Error classification for metrics
export function classifyError(error: any): string {
  if (error?.response?.status === 401) {
    return 'invalid_nonce';
  } else if (error?.response?.status === 429) {
    return 'rate_limit';
  } else if (error?.response?.status >= 500) {
    return 'server_error';
  } else if (error?.code === 'ECONNABORTED') {
    return 'timeout';
  } else {
    return 'unknown';
  }
}
