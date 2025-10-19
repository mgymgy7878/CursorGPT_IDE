"use client";
import { useState } from "react";
import { toast } from "@/components/toast/Toaster";

type Props = {
  runId?: string;
  jobId?: string;
  type?: "canary" | "backtest" | "control";
  label?: string;
};

export default function EvidenceButton({ runId, jobId, type = "canary", label = "📦 Evidence ZIP" }: Props) {
  const [loading, setLoading] = useState(false);

  async function downloadEvidence() {
    if (!runId && !jobId) {
      toast({
        type: "error",
        title: "Evidence Hatası",
        description: "Run ID veya Job ID bulunamadı"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/evidence/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: runId || jobId, type })
      });

      const data = await res.json();
      
      if (data._err) {
        toast({
          type: "error",
          title: "Evidence Üretim Hatası",
          description: data._err
        });
        return;
      }

      // If executor returns download URL or base64
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else if (data.zipBase64) {
        // Create blob and download
        const blob = await fetch(`data:application/zip;base64,${data.zipBase64}`).then(r => r.blob());
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence-${runId || jobId}-${Date.now()}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast({
          type: "success",
          title: "Evidence Hazır",
          description: `Manifest: ${JSON.stringify(data.manifest || {}).slice(0, 50)}...`
        });
      }
    } catch (e: any) {
      toast({
        type: "error",
        title: "Evidence İndirme Hatası",
        description: e?.message || "Bilinmeyen hata"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={downloadEvidence}
      disabled={loading || (!runId && !jobId)}
      className="btn btn-xs btn-secondary"
      title={runId || jobId || "ID yok"}
    >
      {loading ? "Hazırlanıyor..." : label}
    </button>
  );
}

