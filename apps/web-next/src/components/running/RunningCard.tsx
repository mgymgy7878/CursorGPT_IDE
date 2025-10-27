"use client";
import { RunningStrategy } from "@/types/strategy";
import PLSparkline from "./PLSparkline";
import StatusBadge from "./StatusBadge";
import { confirm } from "@/lib/confirm";

export default function RunningCard({
  s, data, onChanged,
}: {
  s: RunningStrategy;
  data: { ts: number; pnl: number }[];
  onChanged: () => void;
}) {
  const pause = async () => {
    const ok = await confirm("Duraklatılsın mı?", s.name);
    if (!ok) return;
    const r = await fetch("/api/exec/pause", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id: s.id }) });
    if (r.ok) onChanged();
  };
  const resume = async () => {
    const ok = await confirm("Devam edilsin mi?", s.name);
    if (!ok) return;
    const r = await fetch("/api/exec/resume", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id: s.id }) });
    if (r.ok) onChanged();
  };
  const stop = async () => {
    const ok = await confirm("Durdurulsun mu?", s.name);
    if (!ok) return;
    const r = await fetch("/api/exec/stop", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id: s.id }) });
    if (r.ok) onChanged();
  };

  const pnlColor = s.pnl > 0 ? "text-emerald-600" : s.pnl < 0 ? "text-red-600" : "text-neutral-600";

  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{s.name}</div>
          <div className="text-xs opacity-70 font-mono">{s.symbol}</div>
        </div>
        <StatusBadge status={s.status as any} />
      </div>

      <PLSparkline points={data} />

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="opacity-60">P/L</div>
          <div className={`text-lg font-semibold ${pnlColor}`}>{s.pnl.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="opacity-60">İşlem</div>
          <div className="text-lg font-semibold">{s.trades}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="opacity-60">P95</div>
          <div className="text-lg font-semibold">{(s.latencyMs ?? 0).toFixed(1)} ms</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="rounded-lg bg-red-600 text-white px-3 py-2" onClick={stop}>Durdur</button>
        <button className="rounded-lg bg-neutral-200 px-3 py-2" onClick={pause}>Duraklat</button>
        <button className="rounded-lg bg-emerald-600 text-white px-3 py-2" onClick={resume}>Devam</button>
        <button className="ml-auto rounded-lg border px-3 py-2" onClick={()=>location.assign(`/strategy-lab?id=${s.id}`)}>Detay</button>
      </div>
    </div>
  );
}
