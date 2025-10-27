import React, { useEffect, useMemo } from "react";
import { useStrategyLabStore } from "../../stores/useStrategyLabStore";

function extractParams(code: string): Record<string, number> | null {
  if (!code) return null;
  const m = code.match(/\/\/\@params\s*(\{[\s\S]*?\})/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    const out: Record<string, number> = {};
    for (const [k,v] of Object.entries(obj)) out[k] = Number(v as any);
    return out;
  } catch { return null; }
}

export default function ParameterPanel() {
  const { code, params, setParam, setCode } = useStrategyLabStore();

  useEffect(() => {
    const p = extractParams(code);
    if (p && JSON.stringify(p) !== JSON.stringify(params)) {
      for (const [k,v] of Object.entries(p)) setParam(k, Number(v));
    }
  }, [code, params, setParam]);

  const keys = useMemo(() => Object.keys(params || {}), [params]);

  function onChange(k: string, v: string) {
    const num = Number(v);
    if (!Number.isFinite(num)) return;
    setParam(k, num);
    const next = { ...params, [k]: num } as Record<string, number>;
    const header = `//@params ${JSON.stringify(next)}`;
    const has = code.includes('//@params');
    const newCode = has ? code.replace(/\/\/\@params[\s\S]*?\n/, header + '\n') : (header + '\n' + code);
    setCode(newCode);
  }

  return (
    <div className="panel" style={{ padding:12, display:'grid', gap:8 }}>
      <div style={{ fontWeight:600 }}>Parametreler</div>
      {keys.length === 0 ? <div style={{ opacity:.6 }}>Parametre bulunamadı. Koda //@params JSON başlığı ekleyin. Örn: //@params &#123;&quot;fast&quot;:50&#125;</div> : (
        <div style={{ display:'grid', gap:6, gridTemplateColumns:'repeat(2, minmax(140px, 1fr))' }}>
          {keys.map(k => (
            <label key={k}> {k}
              <input className="input" type="number" value={params[k] as any} onChange={e=>onChange(k, e.target.value)} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
} 
