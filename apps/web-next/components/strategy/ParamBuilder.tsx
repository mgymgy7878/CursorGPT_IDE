"use client";
import { useEffect, useMemo, useState } from "react";

type Draft = {
  name: "EMA"|"RSI";
  symbol: string;
  params: Record<string, number>;
};

const PRESET_KEY = "spark.param.presets";

function loadPresets(): Record<string, Draft> {
  try { return JSON.parse(localStorage.getItem(PRESET_KEY) || "{}"); } catch { return {}; }
}
function savePresets(p: Record<string, Draft>) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(p));
}

export default function ParamBuilder() {
  const [name, setName] = useState<"EMA"|"RSI">("EMA");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [emaFast, setEmaFast] = useState(12);
  const [emaSlow, setEmaSlow] = useState(26);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiBuy, setRsiBuy] = useState(30);
  const [rsiSell, setRsiSell] = useState(70);

  const [currentJson, setCurrentJson] = useState<string>("");
  const [presets, setPresets] = useState<Record<string, Draft>>({});

  useEffect(()=>{ setPresets(loadPresets()); },[]);

  const draft: Draft = useMemo(()=>({
    name,
    symbol,
    params: name === "EMA"
      ? { fast: emaFast, slow: emaSlow } as any
      : { period: rsiPeriod, buy: rsiBuy, sell: rsiSell } as any
  }),[name, symbol, emaFast, emaSlow, rsiPeriod, rsiBuy, rsiSell]);

  function toSlash() {
    const p = Object.entries(draft.params).map(([k,v])=>`${k}=${v}`).join(" ");
    const cmd = `/strategy.update name=${draft.name} symbol=${draft.symbol} ${p} --json`;
    window.dispatchEvent(new CustomEvent("spark.prefill", { detail: { cmd } }));
  }

  function savePreset() {
    const key = `${draft.name}:${draft.symbol}:${Date.now()}`;
    const next = { ...presets, [key]: draft };
    setPresets(next); savePresets(next);
  }
  function loadPreset(k: string) {
    const d = presets[k]; if (!d) return;
    setName(d.name); setSymbol(d.symbol);
    if (d.name === "EMA") { setEmaFast(d.params.fast||12); setEmaSlow(d.params.slow||26); }
    else { setRsiPeriod(d.params.period||14); setRsiBuy(d.params.buy||30); setRsiSell(d.params.sell||70); }
  }
  function deletePreset(k: string) {
    const next = { ...presets }; delete next[k]; setPresets(next); savePresets(next);
  }

  function tryParse(json: string): any { try { return JSON.parse(json); } catch { return null; } }
  const currentObj = useMemo(()=>tryParse(currentJson), [currentJson]);
  const draftObj = useMemo(()=>({ name: draft.name, symbol: draft.symbol, ...draft.params }), [draft]);
  const diff = useMemo(()=>{
    const a:any = currentObj || {};
    const b:any = draftObj || {};
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    return keys.map(k=>{
      const va = a[k]; const vb = b[k];
      if (va === vb) return { k, type: "same", va, vb };
      if (va === undefined) return { k, type: "added", va, vb };
      if (vb === undefined) return { k, type: "removed", va, vb };
      return { k, type: "changed", va, vb };
    });
  }, [currentObj, draftObj]);

  function copyJson() { navigator.clipboard.writeText(JSON.stringify(draftObj, null, 2)); }
  function copyConfirm() { navigator.clipboard.writeText(`/confirm NONCE_FROM_PREVIEW`); }

  return (
    <div className="p-3 rounded-2xl border bg-white shadow-sm space-y-3">
      <div className="font-semibold">Strategy Param Builder</div>

      <div className="grid grid-cols-2 gap-2">
        <select className="border rounded px-2 py-1" value={name} onChange={e=>setName(e.target.value as any)}>
          <option value="EMA">EMA</option>
          <option value="RSI">RSI</option>
        </select>
        <input className="border rounded px-2 py-1" value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="Symbol (BTCUSDT)" />
        {name==="EMA" ? (
          <>
            <input type="number" className="border rounded px-2 py-1" value={emaFast} onChange={e=>setEmaFast(Number(e.target.value))} placeholder="fast" />
            <input type="number" className="border rounded px-2 py-1" value={emaSlow} onChange={e=>setEmaSlow(Number(e.target.value))} placeholder="slow" />
          </>
        ) : (
          <>
            <input type="number" className="border rounded px-2 py-1" value={rsiPeriod} onChange={e=>setRsiPeriod(Number(e.target.value))} placeholder="period" />
            <input type="number" className="border rounded px-2 py-1" value={rsiBuy} onChange={e=>setRsiBuy(Number(e.target.value))} placeholder="buy" />
            <input type="number" className="border rounded px-2 py-1" value={rsiSell} onChange={e=>setRsiSell(Number(e.target.value))} placeholder="sell" />
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={toSlash} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Slash’a çevir</button>
        <button onClick={copyJson} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Copy JSON</button>
        <button onClick={copyConfirm} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Copy /confirm</button>
        <button onClick={savePreset} className="ml-auto text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Preset Kaydet</button>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-neutral-600">Mevcut paramları JSON olarak yapıştır (opsiyonel):</div>
        <textarea className="border rounded p-2 w-full h-24 font-mono text-xs" value={currentJson} onChange={e=>setCurrentJson(e.target.value)} placeholder='{"name":"EMA","symbol":"BTCUSDT","fast":12,"slow":26}' />
      </div>

      <div className="border rounded">
        <div className="px-2 py-1 text-xs bg-neutral-50 font-semibold">Live Diff</div>
        <table className="w-full text-xs">
          <thead><tr><th className="text-left p-2">Key</th><th className="text-left p-2">Current</th><th className="text-left p-2">Draft</th><th className="text-left p-2">Δ</th></tr></thead>
          <tbody>
            {diff.map((d,i)=>(
              <tr key={i} className={d.type==="changed"?"bg-amber-50":d.type==="added"?"bg-emerald-50":d.type==="removed"?"bg-rose-50":"bg-white"}>
                <td className="p-2">{d.k}</td>
                <td className="p-2">{String(d.va ?? "-")}</td>
                <td className="p-2">{String(d.vb ?? "-")}</td>
                <td className="p-2">{d.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer">Presets</summary>
        <div className="mt-2 space-y-1">
          {Object.keys(presets).length===0 ? <div className="text-neutral-500">Henüz preset yok.</div> :
            Object.entries(presets).sort().map(([k,v])=>(
              <div key={k} className="flex items-center justify-between border rounded px-2 py-1">
                <span className="font-mono">{k}</span>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-0.5 border rounded" onClick={()=>loadPreset(k)}>Yükle</button>
                  <button className="text-xs px-2 py-0.5 border rounded" onClick={()=>deletePreset(k)}>Sil</button>
                </div>
              </div>
            ))
          }
        </div>
      </details>
    </div>
  );
} 