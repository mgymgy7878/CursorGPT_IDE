"use client";
import { useState } from "react";
import { toast } from "@/components/toast/Toaster";
import EvidenceButton from "./EvidenceButton";

export default function CanaryWidget() {
  const [status, setStatus] = useState<"idle"|"running"|"done"|"error">("idle");
  const [msg, setMsg] = useState<string>("");
  const [lastJobId, setLastJobId] = useState<string | null>(null);

  async function run() {
    // Canary dry-run via executor proxy
    setStatus("running");
    setMsg("");
    try {
      const r = await fetch("/api/canary/run", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({}), cache:"no-store" as any });
      const j = await r.json().catch(()=>({}));
      setStatus(j.ok ? "done" : "error");
      setMsg(j.ok ? `PASS${j.jobId ? " (job "+j.jobId+")" : ""}` : `FAIL${j.retryAfter ? " - retryAfter: "+j.retryAfter : ""}${j.error ? " — "+j.error : ""}`);
      
      if (j.jobId) {
        setLastJobId(j.jobId);
      }
      
      if (j.ok) {
        toast({
          type: "success",
          title: "Canary Test Başarılı",
          description: `Job ID: ${j.jobId || 'N/A'}`
        });
      } else {
        toast({
          type: "error",
          title: "Canary Test Başarısız",
          description: j.error || "Bilinmeyen hata",
          retryAfter: j.retryAfter
        });
      }
      
      // Audit push
      await fetch("/api/audit/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "canary.test",
          result: j.ok ? "ok" : "err",
          strategyId: "canary-widget",
          traceId: j.jobId || "unknown",
          timestamp: Date.now(),
          details: j.ok ? `Canary test passed (job ${j.jobId})` : `Canary test failed: ${j.error || "unknown"}`
        })
      }).catch(() => {});
      
      // Cache last canary result for SLOChip
      if (typeof window !== "undefined") {
        localStorage.setItem("lastCanary", JSON.stringify({
          status: j.ok ? "ok" : "err",
          timestamp: Date.now(),
          jobId: j.jobId || "unknown"
        }));
      }
    } catch (e:any) {
      setStatus("error");
      setMsg(e?.message ?? "error");
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="mb-2 font-medium">Canary</div>
      <div className="flex gap-2">
        <button onClick={run} disabled={status==="running"} className="btn btn-xs">
          {status==="running" ? "Running…" : "Run Canary (dry)"}
        </button>
        {lastJobId && status === "done" && (
          <EvidenceButton jobId={lastJobId} type="canary" />
        )}
      </div>
      {msg && <div className="mt-2 text-xs text-neutral-400">{msg}</div>}
    </div>
  );
}

