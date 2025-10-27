'use client';
import { useEffect, useState } from "react";
import HealthBadge from "@/components/HealthBadge";

export default function LabProgress({ jobId }: { jobId: string }) {
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [healthy, setHealthy] = useState(true);

  useEffect(() => {
    let t: any;
    const poll = async () => {
      try {
        const r = await fetch(`/api/public/lab/status?jobId=${encodeURIComponent(jobId)}`, { cache: 'no-store' as any });
        if (!r.ok) { setHealthy(false); t = setTimeout(poll, 600); return; }
        const js = await r.json();
        setHealthy(!js?.degraded && js?.ok !== false);
        setProgress(js.progress ?? 0);
        if (js.done) { setResult(js.result); return; }
        t = setTimeout(poll, 600);
      } catch {
        setHealthy(false);
        t = setTimeout(poll, 800);
      }
    };
    poll();
    return () => t && clearTimeout(t);
  }, [jobId]);

  return (
    <div className="rounded-2xl border p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Backtest İlerleme</h4>
        <HealthBadge healthy={healthy} />
      </div>
      <div className="w-full h-2 bg-zinc-200 rounded">
        <div className="h-2 bg-zinc-700 rounded" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-xs text-zinc-600">Progress: {progress}%</div>
      {result && (
        <pre className="text-xs bg-zinc-50 p-2 rounded border overflow-x-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
} 