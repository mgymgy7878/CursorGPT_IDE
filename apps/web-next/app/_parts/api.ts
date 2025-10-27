// Client-side API helpers

const UI_ORIGIN = process.env.NEXT_PUBLIC_UI_ORIGIN || "http://127.0.0.1:3003";
const EXECUTOR_ORIGIN = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";

// UI → Executor proxy'niz varsa /api/public/runtime kullanabilirsiniz.
// Aşağıdaki iki fonksiyon, mevcut sağlıklı uçları baz alıyor.

export async function getRuntime() {
  // UI public runtime özeti (zaten /ops'ta link var)
  const res = await fetch(`${UI_ORIGIN}/api/public/runtime`, { cache: "no-store" });
  if (!res.ok) throw new Error("runtime fetch failed");
  return res.json();
}

export async function getPositions() {
  // Executor'da positions uç noktası yoksa şimdilik boş liste dönelim.
  try {
    const res = await fetch(`${EXECUTOR_ORIGIN}/positions`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getPnL() {
  // Basit PnL özeti; yoksa runtime'dan türetilir.
  try {
    const res = await fetch(`${EXECUTOR_ORIGIN}/pnl/summary`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getRunningStrategies() {
  // UI'a basit bir geçici liste bağlayalım; gerçek uç gelince değiştiririz.
  try {
    const res = await fetch(`${UI_ORIGIN}/api/strategies/list`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ---- ACTION HELPERS (confirm-required JSON ile) ----
async function postJSON(url: string, body: any) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function strategyStartDry(s: { id: string; symbol: string; tf: string; params?: any }) {
  const payload = {
    action: "canary/run",
    params: { mode: "dry", ...s },
    dryRun: true,
    confirm_required: false,
    reason: "UI: strategy start dry"
  };
  return postJSON(`${EXECUTOR_ORIGIN}/canary/run`, payload);
}

export async function strategyStartLive(s: { id: string; symbol: string; tf: string; params?: any }) {
  const payload = {
    action: "canary/confirm",
    params: { mode: "live", ...s },
    dryRun: false,
    confirm_required: true,
    reason: "UI: strategy start LIVE (requires confirm)"
  };
  return postJSON(`${EXECUTOR_ORIGIN}/canary/confirm`, payload);
}

export async function strategyStop(s: { id: string }) {
  const payload = {
    action: "model/downgrade", // veya executor'daki stop endpoint'in
    params: { strategyId: s.id },
    dryRun: false,
    confirm_required: true,
    reason: "UI: strategy stop (requires confirm)"
  };
  return postJSON(`${EXECUTOR_ORIGIN}/model/downgrade`, payload);
}

export async function portfolioCloseAll() {
  const payload = {
    action: "risk.close_all",
    params: { scope: "ALL", reason: "ui_emergency" },
    dryRun: false,
    confirm_required: true,
    reason: "Portföy acil kapat (UI)"
  };
  return postJSON(`${EXECUTOR_ORIGIN}/risk/close_all`, payload);
}
