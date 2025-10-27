import crypto from "node:crypto";
import { BtcturkCreds, ServerTime } from "./types.js";

const now = () => (globalThis.performance ? performance.now() : Date.now());

export class BtcturkClient {
  constructor(
    private base = process.env.BTCTURK_REST_BASE ?? "https://api.btcturk.com/api/v2",
    private creds?: BtcturkCreds
  ) {}

  private async fetchJson(path: string, init?: RequestInit) {
    const url = `${this.base}${path}`;
    const res = await fetch(url, { cache: "no-store", ...init });
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
    catch { return { ok: res.ok, status: res.status, data: text }; }
  }

  async serverTime(): Promise<{ ok: boolean; status: number; ms: number; data: ServerTime | unknown }> {
    const t0 = now();
    const r = await this.fetchJson("/server/time");
    const ms = Number((now() - t0).toFixed(2));
    return { ok: !!r.ok, status: r.status, ms, data: r.data as ServerTime };
  }

  /** Signature stub (dry-run): returns headers, does not send private requests. */
  sign() {
    if (!this.creds) throw new Error("Missing creds");
    const ts = Date.now().toString();
    const msg = this.creds.apiKey + ts;
    const sig = crypto.createHmac("sha256", this.creds.apiSecret).update(msg).digest("base64");
    return { "X-PCK": this.creds.apiKey, "X-Stamp": ts, "X-Signature": sig, "Content-Type": "application/json" };
  }
}

export default BtcturkClient;
