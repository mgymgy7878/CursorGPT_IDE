"use client";
import { useState, useTransition, useEffect } from "react";
import { fetchSafe } from "@/lib/net/fetchSafe";
import { toast } from "@/components/toast/Toaster";

type Props = { name: string; scope?: "paper"|"live"; onResult?: (msg:string)=>void };
type Op = "start"|"stop"|"pause"|"resume";

// SSR-safe, tip güvenli, timeout+retry ile korumalı
export default function StrategyControls({ name, scope="paper", onResult }: Props){
  const [isPending, startTransition] = useTransition();
  const [preview,setPreview]=useState<any|null>(null);
  const [show,setShow]=useState(false);
  const [err,setErr]=useState<string|undefined>();
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);

  // Countdown timer for retry-after
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function doPreview(op: Op){
    startTransition(async () => {
      setErr(undefined); setPreview(null); setShow(true);
      const payload = {
        action: "strategy.preview",
        params: { name, op, scope },
        dryRun: true, confirm_required: false,
        reason: "dashboard quick preview"
      };
      const res = await fetchSafe("/api/strategy/preview", { method: "POST", body: payload });
      if(!res.ok || res.data?._err) {
        const errorMsg = res.data?._err ?? `Preview hata: ${res.status}`;
        setErr(errorMsg);
        setPreview({ _err: errorMsg });
        
        // Handle 429 rate limit
        if (res.status === 429 && res.data?.retryAfter) {
          const retrySeconds = parseInt(res.data.retryAfter) || 30;
          setRetryAfter(retrySeconds);
          setCountdown(retrySeconds);
        }
        
        toast({
          type: "error",
          title: "Preview Hatası",
          description: errorMsg,
          retryAfter: res.data?.retryAfter
        });
        return;
      }
      setPreview(res.data);
      toast({
        type: "success",
        title: "Preview Hazır",
        description: "Dry-run sonucu modalda görüntüleniyor"
      });
      
      // Audit push
      await fetch("/api/audit/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "strategy.preview",
          result: "ok",
          strategyId: name,
          traceId: res.headers?.get?.("x-trace-id"),
          timestamp: Date.now(),
          details: `${name} (${scope}) preview ${op}`
        })
      }).catch(() => {}); // Silent fail for audit
    });
  }

  async function doControl(op: Op){
    // RBAC fail-safe: always require confirmation for destructive operations
    if (op === "start" || op === "stop" || op === "pause") {
      const confirmMsg = `${name} stratejisini ${op} etmek istediğinizden emin misiniz?`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }
    
    startTransition(async () => {
      setErr(undefined);
      const payload = {
        action: "strategy.control",
        params: { name, op, scope },
        dryRun: false, confirm_required: true,
        reason: "dashboard quick control"
      };
      const res = await fetchSafe("/api/strategy/control", { method: "POST", body: payload });
      if(!res.ok || res.data?._err) {
        const errorMsg = res.data?._err ?? `Control hata: ${res.status}`;
        setErr(errorMsg);
        
        // Handle 429 rate limit
        if (res.status === 429 && res.data?.retryAfter) {
          const retrySeconds = parseInt(res.data.retryAfter) || 30;
          setRetryAfter(retrySeconds);
          setCountdown(retrySeconds);
        }
        
        toast({
          type: "error",
          title: `${op} Hatası`,
          description: errorMsg,
          retryAfter: res.data?.retryAfter
        });
        
        // Audit push - error
        await fetch("/api/audit/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: `strategy.${op}`,
            result: "err",
            strategyId: name,
            traceId: res.headers?.get?.("x-trace-id"),
            timestamp: Date.now(),
            details: `${name} (${scope}) ${op} failed: ${errorMsg}`
          })
        }).catch(() => {});
        return;
      }
      const id = res.data?.auditId ?? res.data?.id ?? res.data?.jobId ?? res.data?.ticket ?? res.data?.requestId;
      const audit = id ? ` • auditId=${id}` : "";
      const msg = `Control: ${res.status} ${res.data?.status ?? "OK"}${audit}`;
      onResult?.(msg);
      setPreview({ ...(preview||{}), controlResponse: JSON.stringify(res.data).slice(0,300) });
      toast({
        type: "success",
        title: `Strateji ${op} Edildi`,
        description: msg
      });
      
      // Audit push - success
      await fetch("/api/audit/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: `strategy.${op}`,
          result: "ok",
          strategyId: name,
          traceId: res.headers?.get?.("x-trace-id"),
          timestamp: Date.now(),
          details: `${name} (${scope}) ${op} success`
        })
      }).catch(() => {});
    });
  }

  const isDisabled = isPending || countdown > 0;

  return (
    <div className="space-y-2">
      {countdown > 0 && (
        <div className="text-xs text-amber-400 px-2 py-1 rounded bg-amber-950/40 border border-amber-800/50">
          ⏳ Rate limit: {countdown}s kaldı
        </div>
      )}
      <div className="flex gap-2">
        <button className="btn" disabled={isDisabled} aria-busy={isPending} onClick={()=>doPreview("start")}>
          Start
        </button>
        <button className="btn-danger" disabled={isDisabled} aria-busy={isPending} onClick={()=>doPreview("stop")}>
          Stop
        </button>
        <button className="btn" disabled={isDisabled} aria-busy={isPending} onClick={()=>doPreview("pause")}>
          Pause
        </button>
        <button className="btn" disabled={isDisabled} aria-busy={isPending} onClick={()=>doPreview("resume")}>
          Resume
        </button>
      </div>

      {show && (
        <div className="modal-backdrop" onClick={()=>setShow(false)}>
          <div className="modal card p-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Önizleme • {name}</h3>
              <button className="btn" onClick={()=>setShow(false)}>Kapat</button>
            </div>
            {err && <div className="muted mt-2" aria-live="assertive">Hata: {err}</div>}
            <div className="muted text-sm mt-2">Dry-run sonucu aşağıdadır. Onaylarsanız işlem **confirm_required=true** ile gönderilir.</div>
            <pre className="pre mt-2" aria-live="polite">{JSON.stringify(preview ?? {}, null, 2)}</pre>
            <div className="flex gap-2 mt-3">
              <button className="btn" disabled={isPending} aria-busy={isPending} onClick={()=>doControl("start")}>Start (Onayla)</button>
              <button className="btn-danger" disabled={isPending} aria-busy={isPending} onClick={()=>doControl("stop")}>Stop (Onayla)</button>
              <button className="btn" disabled={isPending} aria-busy={isPending} onClick={()=>doControl("pause")}>Pause (Onayla)</button>
              <button className="btn" disabled={isPending} aria-busy={isPending} onClick={()=>doControl("resume")}>Resume (Onayla)</button>
            </div>
            <div className="muted text-xs mt-2">RBAC + Audit zorunlu • MODEL_RISK/GATE açık ise çağrı uygulanmaz (sadece öneri).</div>
          </div>
        </div>
      )}
    </div>
  );
}


