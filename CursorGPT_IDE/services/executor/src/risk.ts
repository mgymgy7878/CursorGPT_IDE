type DeployReq = { symbol?: string; side?: "BUY"|"SELL"; qty?: number; type?: string; price?: number };

function parseWindow(w: string) {
  // "HH:mm-HH:mm" → {startMin,endMin}
  const m = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(w.trim());
  if (!m) return null;
  const toMin = (h: string, mm: string) => Number(h)*60 + Number(mm);
  return { 
    startMin: toMin(m[1] || '0', m[2] || '0'), 
    endMin: toMin(m[3] || '0', m[4] || '0') 
  };
}
function nowMinutesTR() {
  const now = new Date();
  // Europe/Istanbul'a sabitlemek yerine lokal makine zamanı kabul ediliyor.
  return now.getHours()*60 + now.getMinutes();
}
export function inTradeWindow(): boolean {
  const w = process.env.TRADE_WINDOW || "";
  const parsed = parseWindow(w);
  if (!parsed) return true; // pencere tanımsızsa serbest
  const n = nowMinutesTR();
  return parsed.startMin <= parsed.endMin ? (n>=parsed.startMin && n<=parsed.endMin) : (n>=parsed.startMin || n<=parsed.endMin);
}

export function inWhitelist(sym?: string): boolean {
  const wl = (process.env.TRADE_WHITELIST || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  if (!wl.length) return true;
  return wl.includes((sym || "").toUpperCase());
}

export function notionalOk(qty: number|undefined, price: number|undefined): boolean {
  const max = Number(process.env.LIVE_MAX_NOTIONAL || "0");
  if (!max) return true;
  const notion = (qty || 0) * (price || 0);
  return notion <= max && notion > 0;
}

export function killSwitch(): boolean {
  return Number(process.env.TRADING_KILL_SWITCH || "0") === 1;
}

export function validateDeploy(req: DeployReq, lastPrice: number|undefined) {
  if (killSwitch()) return { ok: false, code: "kill_switch" as const };
  if (!inWhitelist(req.symbol)) return { ok: false, code: "whitelist_violation" as const };
  if (!inTradeWindow()) return { ok: false, code: "outside_window" as const };
  const price = req.price || lastPrice || 0;
  if (!notionalOk(req.qty, price)) return { ok: false, code: "notional_limit" as const };
  return { ok: true as const };
} 