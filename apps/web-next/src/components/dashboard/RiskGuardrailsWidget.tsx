"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast/Toaster";

type Guardrails = {
  thresholds: {
    maxDrawdown: number;
    minSharpe: number;
    maxLeverage: number;
    minWinRate: number;
  };
  weights: {
    sharpe: number;
    drawdown: number;
    winRate: number;
    profitFactor: number;
  };
  lastBreach?: {
    timestamp: number;
    metric: string;
    value: number;
    threshold: number;
  } | null;
  _mock?: boolean;
  _err?: string;
};

export default function RiskGuardrailsWidget() {
  const [data, setData] = useState<Guardrails | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastBreachId, setLastBreachId] = useState<number | null>(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [pausing, setPausing] = useState(false);

  useEffect(() => {
    loadGuardrails();
    const interval = setInterval(loadGuardrails, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);
  
  // Breach detection
  useEffect(() => {
    if (data?.lastBreach && data.lastBreach.timestamp !== lastBreachId) {
      setLastBreachId(data.lastBreach.timestamp);
      
      const severity = (data.lastBreach as any).severity || "warning";
      
      // Show toast notification
      toast({
        type: "error",
        title: severity === "critical" ? "🚨 KRİTİK İhlal" : "⚠️ Guardrail İhlali",
        description: `${data.lastBreach.metric}: ${data.lastBreach.value.toFixed(2)} (eşik: ${data.lastBreach.threshold.toFixed(2)})`
      });
      
      // Audit push
      fetch("/api/audit/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "guardrails.breach",
          result: "err",
          strategyId: "risk-guardrails",
          timestamp: Date.now(),
          details: `Breach [${severity}]: ${data.lastBreach.metric} = ${data.lastBreach.value} > ${data.lastBreach.threshold}`
        })
      }).catch(() => {});
      
      // Show auto-pause confirm for critical breaches
      if (severity === "critical") {
        setShowPauseConfirm(true);
      }
    }
  }, [data?.lastBreach, lastBreachId]);
  
  async function handleAutoPause() {
    setPausing(true);
    try {
      const res = await fetch("/api/strategy/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "strategy.control",
          params: { name: "all", op: "stop", scope: "live" },
          dryRun: false,
          confirm_required: true,
          reason: "guardrails auto-pause (critical breach)"
        })
      });
      
      const result = await res.json();
      
      if (result._err) {
        toast({
          type: "error",
          title: "Auto-Pause Hatası",
          description: result._err
        });
      } else {
        toast({
          type: "success",
          title: "Stratejiler Durduruldu",
          description: "Kritik ihlal nedeniyle tüm stratejiler durduruldu"
        });
        
        // Audit push
        fetch("/api/audit/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "guardrails.auto_pause",
            result: "ok",
            strategyId: "all",
            timestamp: Date.now(),
            details: `Auto-paused due to critical breach: ${data?.lastBreach?.metric}`
          })
        }).catch(() => {});
      }
    } catch (e: any) {
      toast({
        type: "error",
        title: "Auto-Pause Başarısız",
        description: e?.message || "Bilinmeyen hata"
      });
    } finally {
      setPausing(false);
      setShowPauseConfirm(false);
    }
  }

  async function loadGuardrails() {
    try {
      const res = await fetch("/api/guardrails/read", {
        cache: "no-store"
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      setData({
        thresholds: {
          maxDrawdown: 0.15,
          minSharpe: 1.0,
          maxLeverage: 3.0,
          minWinRate: 0.45
        },
        weights: {
          sharpe: 0.4,
          drawdown: 0.3,
          winRate: 0.2,
          profitFactor: 0.1
        },
        lastBreach: null,
        _mock: true,
        _err: "fetch_failed"
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/50">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-neutral-800 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-neutral-800 rounded w-full"></div>
            <div className="h-3 bg-neutral-800 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-800 p-4 bg-red-900/20">
        <div className="text-red-400 text-sm font-medium">Guardrails Hatası</div>
        <div className="text-xs text-red-300">Veri yok</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">🛡️ Risk Guardrails</h3>
        {data._mock && (
          <span className="text-xs text-amber-400 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/50">
            Demo
          </span>
        )}
      </div>

      {/* Thresholds */}
      <div className="mb-4">
        <div className="text-xs text-neutral-500 mb-2 font-medium">Eşikler (Read-Only)</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-400">Max Drawdown:</span>
            <span className="font-mono text-orange-400">{(data.thresholds.maxDrawdown * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Min Sharpe:</span>
            <span className="font-mono text-green-400">{data.thresholds.minSharpe.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Max Leverage:</span>
            <span className="font-mono text-yellow-400">{data.thresholds.maxLeverage.toFixed(1)}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Min Win Rate:</span>
            <span className="font-mono text-blue-400">{(data.thresholds.minWinRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Weights */}
      <div className="mb-4">
        <div className="text-xs text-neutral-500 mb-2 font-medium">Ağırlıklar</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${data.weights.sharpe * 100}%` }}
              />
            </div>
            <span className="text-neutral-400 font-mono w-12 text-right">{(data.weights.sharpe * 100).toFixed(0)}%</span>
            <span className="text-neutral-500 w-20">Sharpe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-orange-500 h-full" 
                style={{ width: `${data.weights.drawdown * 100}%` }}
              />
            </div>
            <span className="text-neutral-400 font-mono w-12 text-right">{(data.weights.drawdown * 100).toFixed(0)}%</span>
            <span className="text-neutral-500 w-20">Drawdown</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${data.weights.winRate * 100}%` }}
              />
            </div>
            <span className="text-neutral-400 font-mono w-12 text-right">{(data.weights.winRate * 100).toFixed(0)}%</span>
            <span className="text-neutral-500 w-20">Win Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-purple-500 h-full" 
                style={{ width: `${data.weights.profitFactor * 100}%` }}
              />
            </div>
            <span className="text-neutral-400 font-mono w-12 text-right">{(data.weights.profitFactor * 100).toFixed(0)}%</span>
            <span className="text-neutral-500 w-20">Profit</span>
          </div>
        </div>
      </div>

      {/* Last Breach */}
      {data.lastBreach ? (
        <div className={`pt-3 border-t ${
          (data.lastBreach as any).severity === "critical" 
            ? "border-red-800 bg-red-950/20" 
            : "border-neutral-800"
        } p-3 rounded-lg`}>
          <div className={`text-xs font-medium mb-1 ${
            (data.lastBreach as any).severity === "critical" ? "text-red-400" : "text-orange-400"
          }`}>
            {(data.lastBreach as any).severity === "critical" ? "🚨 CRITICAL İhlal" : "⚠️ Son İhlal"}
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-neutral-500">Metrik:</span>
              <span className="font-mono text-red-300">{data.lastBreach.metric}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Değer:</span>
              <span className="font-mono text-red-300">{data.lastBreach.value.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Eşik:</span>
              <span className="font-mono text-neutral-400">{data.lastBreach.threshold.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Zaman:</span>
              <span className="font-mono text-neutral-400">
                {new Date(data.lastBreach.timestamp).toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-neutral-800 text-center">
          <div className="text-xs text-green-400">✓ İhlal yok</div>
        </div>
      )}

      {/* Auto-Pause Confirm Modal */}
      {showPauseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPauseConfirm(false)}>
          <div className="bg-neutral-900 border border-red-800 rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-400 mb-3">🚨 Kritik İhlal - Auto-Pause</h3>
            <p className="text-sm text-neutral-300 mb-4">
              Guardrail kritik eşiği aştı. Tüm canlı stratejileri durdurmak istiyor musunuz?
            </p>
            <div className="text-xs text-neutral-500 mb-4">
              İhlal: {data.lastBreach?.metric} = {data.lastBreach?.value.toFixed(2)} &gt; {data.lastBreach?.threshold.toFixed(2)}
            </div>
            <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/50 rounded px-2 py-1.5 mb-4">
              ℹ️ Not: Yalnızca "live" scope'daki aktif stratejiler durdurulur. Paper trading etkilenmez.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutoPause}
                disabled={pausing}
                className="btn btn-danger flex-1"
              >
                {pausing ? "Durduruluyor..." : "⏹️ Stratejileri Durdur"}
              </button>
              <button
                onClick={() => setShowPauseConfirm(false)}
                disabled={pausing}
                className="btn btn-secondary"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {data._err && (
        <div className="mt-2 text-xs text-red-400 truncate" title={data._err}>
          {data._err}
        </div>
      )}
    </div>
  );
}
