'use client';
import { useState } from "react";
import { streamManagerAI } from "@/lib/ai";
import { bus } from "@/lib/event-bus";

type Action =
  | { type:'mode', value:'grid'|'trend'|'scalp' }
  | { type:'start' }
  | { type:'stop' }
  | { type:'risk', value:number };

export default function TraderAIDock(){
  const [input, setInput] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function run(){
    if(!input.trim()) return;
    setBusy(true);
    
    let currentResponse = '';
    let summary = '';
    
    try{
      await streamManagerAI(
        input,
        (token) => {
          currentResponse += token;
          // Real-time streaming gösterimi için
          setLog(l => {
            const newLog = [...l];
            if (newLog.length > 0 && newLog[0].startsWith('🔄 ')) {
              newLog[0] = `🔄 ${currentResponse}`;
            } else {
              newLog.unshift(`🔄 ${currentResponse}`);
            }
            return newLog;
          });
        },
        (fullResponse) => {
          summary = fullResponse;
          // Final response'u göster
          setLog(l => {
            const newLog = [...l];
            if (newLog.length > 0 && newLog[0].startsWith('🔄 ')) {
              newLog[0] = `${new Date().toLocaleTimeString()}  ${fullResponse}`;
            }
            return newLog;
          });
        }
      );
      
      // Mock actions - gerçek implementasyonda AI'dan gelen actions kullanılacak
      const actions: Action[] = [];
      if (input.includes('trend')) actions.push({ type: 'mode', value: 'trend' });
      if (input.includes('grid')) actions.push({ type: 'mode', value: 'grid' });
      if (input.includes('scalp')) actions.push({ type: 'mode', value: 'scalp' });
      if (input.includes('başlat')) actions.push({ type: 'start' });
      if (input.includes('durdur')) actions.push({ type: 'stop' });
      
      // Risk extraction
      const riskMatch = input.match(/risk\s*%?(\d+(?:\.\d+)?)/i);
      if (riskMatch) {
        actions.push({ type: 'risk', value: parseFloat(riskMatch[1]) });
      }

      for(const a of actions){
        if(a.type==='mode'){
          await fetch('/api/public/strategy/mode',{method:'POST', body:JSON.stringify({ mode:a.value }), headers:{'content-type':'application/json'}});
        } else if(a.type==='start'){
          await fetch('/api/public/manager/start',{method:'POST'});
        } else if(a.type==='stop'){
          await fetch('/api/public/manager/stop',{method:'POST'});
        } else if(a.type==='risk'){
          await fetch('/api/public/risk/set',{method:'POST', body:JSON.stringify({ percent:a.value }), headers:{'content-type':'application/json'}});
        }
      }
    }catch(e:any){
      setLog(l=>[`Hata: ${e?.message||e}`, ...l]);
    }finally{ setBusy(false); setInput(''); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-800 text-sm text-zinc-300">
        Piyasa özeti, rejim, risk ve komutlar için yazın. Örn: "rejim trend, risk %0.7, başlat".
      </div>
      <div className="p-3 space-y-2 border-b border-zinc-800">
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={()=>setInput('rejim grid, risk %0.5')} >grid</button>
          <button className="btn btn-sm" onClick={()=>setInput('rejim trend, başlat')} >trend</button>
          <button className="btn btn-sm" onClick={()=>setInput('rejim scalp, durdur')} >scalp</button>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-zinc-800 rounded px-3 py-2 text-sm"
            placeholder="piyasa özeti / komut…"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=> (e.key==='Enter' && (e.metaKey||e.ctrlKey)) ? run():null}
          />
          <button className="btn" disabled={busy} onClick={run}>{busy?'…':'sor'}</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 text-xs">
        {log.length===0 ? <div className="text-zinc-500">henüz kayıt yok</div> :
          <ul className="space-y-2">{log.map((ln,i)=>(<li key={i} className="text-zinc-300">{ln}</li>))}</ul>
        }
      </div>

      <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500">
        Kısayol: ⌘/Ctrl+Enter
      </div>
    </div>
  );
} 