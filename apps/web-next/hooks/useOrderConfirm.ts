"use client";

import { useCallback, useState } from "react";

export interface OrderRequestBody {
  symbol: string;
  side: "BUY" | "SELL";
  type: string;
  quantity?: number | string;
  price?: number | string;
  [key: string]: unknown;
}

export interface ConfirmState {
  open: boolean;
  reason?: string;
  computedNotional?: number;
  leverage?: number;
  whitelistHit?: boolean;
  request?: OrderRequestBody;
}

/**
 * Sarıcı: /api/futures/order çağrısında 403 + { confirm_required: true } geldiğinde confirm modal tetikler
 */
export function useOrderConfirm() {
  const [state, setState] = useState<ConfirmState>({ open: false });

  const submit = useCallback(async (body: OrderRequestBody) => {
    const r = await fetch("/api/futures/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.status === 403) {
      let j: any = {};
      try { j = await r.json(); } catch { /* ignore */ }
      if (j && (j.confirm_required || j.confirmRequired)) {
        setState({
          open: true,
          reason: j.reason || j.message,
          computedNotional: j.computedNotional,
          leverage: j.leverage,
          whitelistHit: j.whitelistHit,
          request: body,
        });
        return { redirectedToConfirm: true, response: j } as const;
      }
    }
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data: j } as const;
  }, []);

  const close = useCallback(() => setState({ open: false }), []);

  const dryRun = useCallback(async () => {
    if (!state.request) return;
    try {
      const r = await fetch("/api/futures/order", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dry-run": "true" },
        body: JSON.stringify({ ...state.request, dryRun: true }),
      });
      await r.json().catch(() => ({}));
    } finally {
      close();
    }
  }, [state.request, close]);

  const sendIntent = useCallback(async () => {
    if (!state.request) return;
    try {
      const r = await fetch("/api/private/executions/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ executionId: `intent_${Date.now()}`, approve: true, request: state.request }),
      });
      await r.json().catch(() => ({}));
    } finally {
      close();
    }
  }, [state.request, close]);

  return { state, submit, close, dryRun, sendIntent };
}


