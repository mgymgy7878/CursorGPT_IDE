"use client";

import { useEffect, useState } from "react";
import { fetchGuardrails, updateGuardrails, Guardrails } from "./api";

export default function GuardrailsPanel() {
  const [data, setData] = useState<Guardrails | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchGuardrails().then(setData);
  }, []);

  if (!data) {
    return <div className="p-4 text-neutral-400">Loading guardrails...</div>;
  }

  return (
    <div className="space-y-4 p-4 border border-neutral-800 rounded-xl bg-black/30">
      <h2 className="text-xl mb-2">Risk Guardrails</h2>

      <div className="flex items-center gap-3 p-3 rounded bg-neutral-800/50 border border-neutral-700">
        <label className="font-medium flex-1">Kill Switch</label>
        <input
          aria-label="Kill Switch"
          type="checkbox"
          checked={data.killSwitch}
          onChange={async (e) => {
            setBusy(true);
            try {
              const next = await updateGuardrails({
                killSwitch: e.target.checked,
              });
              setData(next);
            } catch (err) {
              console.error("Failed to update kill switch:", err);
            }
            setBusy(false);
          }}
          disabled={busy}
          className="w-4 h-4 rounded border-neutral-600"
        />
        <span className="text-xs text-neutral-400">
          {data.killSwitch ? "BLOCKED" : "Normal"}
        </span>
      </div>

      <div>
        <label className="block mb-2 font-medium">Max Exposure (%)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={100}
            className="flex-1 px-3 py-2 rounded bg-neutral-800 border border-neutral-700 focus:ring-2 focus:ring-blue-500"
            value={data.maxExposurePct}
            onChange={(e) =>
              setData({ ...data, maxExposurePct: Number(e.target.value) })
            }
            aria-describedby="expHelp"
            disabled={busy}
          />
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-blue-500"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const next = await updateGuardrails({
                  maxExposurePct: data.maxExposurePct,
                });
                setData(next);
              } catch (err) {
                console.error("Failed to update max exposure:", err);
              }
              setBusy(false);
            }}
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
        <div id="expHelp" className="text-xs text-neutral-400 mt-1">
          Toplam portföyde aynı anda maruz kalınabilecek maksimum yüzde
        </div>
      </div>

      <div>
        <label className="block mb-2 font-medium">Whitelist (Optional)</label>
        <textarea
          className="w-full px-3 py-2 rounded bg-neutral-800 border border-neutral-700 focus:ring-2 focus:ring-blue-500"
          value={data.whitelist.join(", ")}
          onChange={(e) =>
            setData({
              ...data,
              whitelist: e.target.value.split(",").map((s) => s.trim()),
            })
          }
          placeholder="BINANCE:BTCUSDT, BTCTURK:BTCTRY"
          disabled={busy}
        />
        <button
          className="mt-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-blue-500"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const next = await updateGuardrails({
                whitelist: data.whitelist,
              });
              setData(next);
            } catch (err) {
              console.error("Failed to update whitelist:", err);
            }
            setBusy(false);
          }}
        >
          {busy ? "Saving..." : "Save Whitelist"}
        </button>
      </div>
    </div>
  );
}
