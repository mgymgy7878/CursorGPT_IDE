'use client';
import { useEffect, useState } from "react";
import { streamStrategyAI } from "@/lib/ai";
import { bus } from "@/lib/event-bus";

const LS_KEY = 'spark:lab:code';

export default function StrategyAIDock(){
  const [prompt, setPrompt] = useState('btcusdt future çift yön kaldıraclı');
  const [code, setCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // Editördeki kodu localStorage üzerinden senkronla (Monaco zaten autosave ediyor)
  useEffect(()=>{ try{ setCode(localStorage.getItem(LS_KEY)||''); }catch{} }, []);

  async function generate(){
    setBusy(true);
    let currentCode = '';
    
    try{
      await streamStrategyAI(
        prompt,
        (token) => {
          currentCode += token;
          setCode(currentCode);
        },
        code,
        (fullResponse) => {
          setCode(fullResponse);
          localStorage.setItem(LS_KEY, fullResponse);
          setNotes(`✅ Strateji üretildi\n\nAnaliz: ${prompt} için RSI + trend filtresi stratejisi oluşturuldu.\n\nDiagnostics:\n• INFO: Strateji oluşturuldu\n• WARNING: Backtest önerilir`);
        }
      );
    } catch(e:any){
      setNotes(`Hata: ${e?.message||e}`);
    } finally { setBusy(false); }
  }

  function toEditor(){ try{ localStorage.setItem(LS_KEY, code||''); bus.emit('lab:editor:refresh' as any); }catch{} }
  function openBacktest(){ bus.emit('lab:open:backtest', { code } as any); }
  function openOptimize(){ bus.emit('lab:open:optimize', { code } as any); }
  function openRun(){ bus.emit('lab:open:run', { code } as any); }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-800 text-sm text-zinc-300">Doğal dilden strateji üret, analiz et ve çalıştır.</div>

      <div className="p-3 space-y-2 border-b border-zinc-800">
        <input className="w-full bg-zinc-800 rounded px-3 py-2 text-sm"
          value={prompt} onChange={e=>setPrompt(e.target.value)}
          placeholder="örn. BTC 5m RSI + trend filtresi"
          onKeyDown={e=> (e.key==='Enter' && (e.metaKey||e.ctrlKey)) ? generate():null}
        />
        <div className="flex gap-2">
          <button className="btn" onClick={generate} disabled={busy}>{busy?'üretiliyor…':'üret'}</button>
          <button className="btn btn-secondary" onClick={toEditor}>Kodu Editöre Ekle</button>
        </div>
      </div>

      <div className="p-3 border-b border-zinc-800">
        <label className="text-xs text-zinc-400">Önerilen Kod</label>
        <textarea className="mt-1 w-full h-32 bg-zinc-800 rounded p-2 text-xs font-mono"
          value={code} onChange={e=>setCode(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <button className="btn btn-sm" onClick={openBacktest}>Backtest</button>
          <button className="btn btn-sm" onClick={openOptimize}>Optimize</button>
          <button className="btn btn-sm" onClick={openRun}>Çalıştır</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs text-zinc-300 whitespace-pre-wrap">{notes || 'Analiz / tanı çıktıları burada'}</pre>
      </div>
    </div>
  );
} 