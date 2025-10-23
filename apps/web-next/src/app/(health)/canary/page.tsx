"use client";
import { useState } from "react";

export default function CanaryPage() {
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/public/canary/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pairs: ["BTCTRY", "BTCUSDT"],
          wsMode: "mock",
          passThresholds: { staleness_sec_lt: 3, delta_msgs_gte: 1 },
        }),
      });
      setOut(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <button onClick={run} className="px-4 py-2 rounded-xl border" disabled={loading}>
        {loading ? "Çalışıyor…" : "Canary'yi Çalıştır"}
      </button>
      <pre className="text-sm bg-black/5 p-4 rounded-xl overflow-auto">
        {out ? JSON.stringify(out, null, 2) : "—"}
      </pre>
    </div>
  );
}


