"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { z } from "zod";

const ConfirmGateModal = dynamic(() => import("../trade/ConfirmGateModal"), { ssr: false });

const FormSchema = z.object({
  symbol: z.enum(["BTCUSDT", "ETHUSDT"]),
  side: z.enum(["BUY", "SELL"]),
  qty: z.number().positive(),
  leverage: z.number().int().min(1).max(20),
  testnet: z.boolean().default(true),
  risk: z.enum(["low", "med", "high"]).default("low"),
  tf: z.enum(["1m","5m","15m","1h","4h","1d"]).default("1h"),
  style: z.enum(["breakout","mean-reversion","volatility"]).default("breakout"),
  provider: z.enum(["auto","mock","openai"]).default("auto")
});

type FormValues = z.infer<typeof FormSchema>;

interface SuggestResult {
  id: string;
  symbol: string;
  side: string;
  leverage: number;
  entry: string;
  stop: string;
  takeProfits: Array<{ tp: string }>;
  confidence: number;
  rationale: string;
  tokens: number;
  model: string;
}

interface PlanResult {
  ok: boolean;
  paths?: string[];
  evidence?: string;
}

export default function QuickFuturesCard() {
  const [form, setForm] = useState<FormValues>({
    symbol: "BTCUSDT",
    side: "BUY",
    qty: 0.001,
    leverage: 5,
    testnet: true,
    risk: "low",
    tf: "1h",
    style: "breakout",
    provider: "auto"
  });
  
  const [suggest, setSuggest] = useState<SuggestResult | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [confirmReq, setConfirmReq] = useState<any>(null);
  const [loading, setLoading] = useState<{ suggest: boolean; plan: boolean; order: boolean }>({
    suggest: false,
    plan: false,
    order: false
  });

  async function onSuggest() {
    setLoading(prev => ({ ...prev, suggest: true }));
    try {
      const body = FormSchema.parse(form);
      const payload: any = { pair: body.symbol, tf: body.tf, style: body.style };
      if (body.provider !== "auto") payload.provider = body.provider;
      const r = await fetch("/api/ai/strategies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await r.json();
      if (r.ok && result?.strategy) {
        const st = result.strategy as any;
        setSuggest({
          id: `${Date.now()}`,
          symbol: st.symbol || body.symbol,
          side: body.side,
          leverage: st.leverage ?? body.leverage,
          entry: st.entry ?? '-',
          stop: st.stop ?? '-',
          takeProfits: Array.isArray(st.takeProfits) ? st.takeProfits : [],
          confidence: 0.8,
          rationale: st.notes || (result.fallback ? 'OpenAI→mock fallback' : 'AI önerisi'),
          tokens: result.tokenUsage ?? 0,
          model: result.provider || 'mock'
        });
      } else {
        throw new Error(result?.error || r.statusText || 'AI öneri hatası');
      }
    } catch (error:any) {
      alert(`AI öneri hatası: ${error?.message || error}`);
    } finally {
      setLoading(prev => ({ ...prev, suggest: false }));
    }
  }

  async function onPlan() {
    setLoading(prev => ({ ...prev, plan: true }));
    try {
      const body = { 
        ...form, 
        suggestId: suggest?.id,
        dryRun: true 
      };
      const r = await fetch("/api/canary/live-trade.plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await r.json();
      if (r.ok) {
        setPlan(result);
      } else {
        alert(`Plan hatası: ${result.error || r.statusText}`);
      }
    } catch (error) {
      alert(`Plan hatası: ${error}`);
    } finally {
      setLoading(prev => ({ ...prev, plan: false }));
    }
  }

  async function onDryRunOrder() {
    setLoading(prev => ({ ...prev, order: true }));
    try {
      const r = await fetch("/api/futures/order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-dry-run": "1" 
        },
        body: JSON.stringify({
          symbol: form.symbol,
          side: form.side,
          type: "MARKET",
          quantity: form.qty
        })
      });
      const j = await r.json();
      if (r.status === 403 && j?.confirm_required) {
        setConfirmReq(j);
      } else if (r.ok) {
        alert("Kuru çalıştırma başarılı (dry-run)");
      } else {
        alert(`Emir hatası: ${j.error || r.statusText}`);
      }
    } catch (error) {
      alert(`Emir hatası: ${error}`);
    } finally {
      setLoading(prev => ({ ...prev, order: false }));
    }
  }

  const riskColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    med: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    high: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <div className="p-4 rounded-2xl border shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🚀 Hızlı Futures Başlat</h3>
        <span className={`px-2 py-1 rounded-full text-xs border ${riskColors[form.risk]}`}>
          {form.risk.toUpperCase()} Risk
        </span>
      </div>

      {/* Form Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sembol</label>
          <select 
            value={form.symbol} 
            onChange={e => setForm(prev => ({ ...prev, symbol: e.target.value as "BTCUSDT" | "ETHUSDT" }))}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
          >
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Zaman Dilimi</label>
          <select
            value={form.tf}
            onChange={e => setForm(prev => ({ ...prev, tf: e.target.value as FormValues["tf"] }))}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
          >
            {(["1m","5m","15m","1h","4h","1d"] as const).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stil</label>
          <select
            value={form.style}
            onChange={e => setForm(prev => ({ ...prev, style: e.target.value as FormValues["style"] }))}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
          >
            <option value="breakout">Breakout</option>
            <option value="mean-reversion">Mean-Reversion</option>
            <option value="volatility">Volatilite</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sağlayıcı</label>
          <select
            value={form.provider}
            onChange={e => setForm(prev => ({ ...prev, provider: e.target.value as FormValues["provider"] }))}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
          >
            <option value="auto">Otomatik</option>
            <option value="mock">Mock</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Yön</label>
          <select 
            value={form.side} 
            onChange={e => setForm(prev => ({ ...prev, side: e.target.value as "BUY" | "SELL" }))}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Miktar</label>
          <input 
            type="number" 
            step="0.001"
            value={form.qty} 
            onChange={e => setForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kaldıraç</label>
          <input 
            type="number" 
            min="1" 
            max="20"
            value={form.leverage} 
            onChange={e => setForm(prev => ({ ...prev, leverage: Number(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
          />
        </div>
      </div>

      {/* Risk Level */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Risk Seviyesi</label>
        <div className="flex gap-2">
          {(["low", "med", "high"] as const).map(level => (
            <button
              key={level}
              onClick={() => setForm(prev => ({ ...prev, risk: level }))}
              className={`px-3 py-1 rounded-md text-sm border ${
                form.risk === level 
                  ? riskColors[level] 
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {level === "low" ? "Düşük" : level === "med" ? "Orta" : "Yüksek"}
            </button>
          ))}
        </div>
      </div>

      {/* Testnet Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <input 
          type="checkbox" 
          id="testnet"
          checked={form.testnet} 
          onChange={e => setForm(prev => ({ ...prev, testnet: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="testnet" className="text-sm">Testnet (Güvenli)</label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={onSuggest} 
          disabled={loading.suggest}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
        >
          {loading.suggest ? "AI Düşünüyor..." : "AI Öner"}
        </button>
        
        <button 
          onClick={onPlan} 
          disabled={!suggest || loading.plan}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700"
        >
          {loading.plan ? "Planlanıyor..." : "Planla"}
        </button>
        
        <button 
          onClick={onDryRunOrder} 
          disabled={loading.order}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-700"
        >
          {loading.order ? "Test Ediliyor..." : "Kuru Çalıştır"}
        </button>
      </div>

      {/* AI Suggestion Result */}
      {suggest && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">🤖 AI Önerisi</h4>
          <div className="text-sm space-y-1">
            <div><strong>Güven:</strong> {(suggest.confidence * 100).toFixed(1)}%</div>
            <div><strong>Giriş:</strong> {suggest.entry}</div>
            <div><strong>Stop:</strong> {suggest.stop}</div>
            <div><strong>TP:</strong> {suggest.takeProfits.map(tp => tp.tp).join(", ")}</div>
            <div><strong>Model:</strong> {suggest.model}</div>
            <div className="mt-2 text-xs text-gray-600">{suggest.rationale}</div>
          </div>
        </div>
      )}

      {/* Plan Result */}
      {plan && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
          <h4 className="font-medium text-indigo-900 mb-2">📋 Canary Plan</h4>
          <div className="text-sm">
            <div><strong>Durum:</strong> {plan.ok ? "✅ Başarılı" : "❌ Hata"}</div>
            {plan.evidence && <div><strong>Kanıt:</strong> {plan.evidence}</div>}
            {plan.paths && plan.paths.length > 0 && (
              <div><strong>Dosyalar:</strong> {plan.paths.join(", ")}</div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmReq && (
        <ConfirmGateModal 
          request={confirmReq} 
          onClose={() => setConfirmReq(null)}
          onDryRun={() => {}}
          onSendIntent={() => {}}
        />
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
            {JSON.stringify({ form, suggest, plan }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
