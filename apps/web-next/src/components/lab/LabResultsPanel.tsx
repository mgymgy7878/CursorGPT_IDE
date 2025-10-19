'use client';
import { useState } from 'react';
import { useStrategyLabStore } from '@/stores/useStrategyLabStore';
import { pushAudit } from '@/lib/audit';

type StrategySpec = { name:string; code:string; params:Record<string,any> };

export default function LabResultsPanel({ spec }:{ spec: StrategySpec }){
  const [tab,setTab]=useState<'backtest'|'opt'|'logs'>('backtest');
  const [res,setRes]=useState<any>(null);
  const { publishDraft, publishing, draftId } = useStrategyLabStore();

  async function runBacktest(){
    try{
      const r = await fetch('/api/lab/backtest', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ strategy: spec, range:{ from:'2024-01-01', to:'2024-03-01' } }) });
      const j = await r.json().catch(()=>({})); setRes(j?.result||null); setTab('backtest');
    }catch{}
  }
  async function runOptimize(){
    try{
      const r = await fetch('/api/lab/optimize', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ strategy: spec, search:{ grid:{ emaFast:[5,10,20], emaSlow:[30,60,120] }, budget:100 } }) });
      const j = await r.json().catch(()=>({})); setRes(j?.result||null); setTab('opt');
    }catch{}
  }
  async function onPublish(){
    try{
      const id = await publishDraft({ code: spec.code, params: spec.params, metrics: res?.stats });
      try{ pushAudit({ ts: Date.now(), type:'publish-draft', id, meta:{ actor:'ui', source:'strategy-lab', status:'ok' } }); }catch{}
    }catch{}
  }

  return (
    <div className="border border-neutral-800 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <button className={`btn btn-xs ${tab==='backtest'?'btn-primary':''}`} onClick={()=>setTab('backtest')}>Backtest</button>
        <button className={`btn btn-xs ${tab==='opt'?'btn-primary':''}`} onClick={()=>setTab('opt')}>Optimization</button>
        <button className={`btn btn-xs ${tab==='logs'?'btn-primary':''}`} onClick={()=>setTab('logs')}>Logs</button>
        <div className="flex-1" />
        <button className="btn btn-xs" onClick={runBacktest}>Run Backtest</button>
        <button className="btn btn-xs" onClick={runOptimize}>Run Optimize</button>
        <button className="btn btn-xs" onClick={onPublish} disabled={publishing}>Publish Draft</button>
      </div>
      {draftId && <div className="text-xs text-green-400 mb-2">Published: {draftId}</div>}
      <div className="min-h-[160px]">
        {tab==='backtest' && (
          res? <pre className="pre">{JSON.stringify(res?.stats||res,null,2)}</pre> : <div className="muted text-sm">Henüz sonuç yok.</div>
        )}
        {tab==='opt' && (
          res? <pre className="pre">{JSON.stringify(res?.bestParams||res,null,2)}</pre> : <div className="muted text-sm">Henüz sonuç yok.</div>
        )}
        {tab==='logs' && (
          <div className="muted text-sm">Loglar burada görüntülenecek…</div>
        )}
      </div>
    </div>
  );
}


