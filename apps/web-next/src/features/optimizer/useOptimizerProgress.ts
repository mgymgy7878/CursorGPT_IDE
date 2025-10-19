"use client";
import { useEffect, useRef, useState } from "react";

type ProgressState = {
  pct: number;
  best?: any;
  status: "idle"|"running"|"done"|"error";
  etaSecs?: number; // done olduğunda 0; belirsiz/hesaplanamıyorsa undefined
  etaUncertain?: boolean; // hız oynaklığında belirsizlik işaretçisi
};

export function useOptimizerProgress(){
  const [state, setState] = useState<ProgressState>({ pct: 0, status: "idle" });
  const esRef = useRef<EventSource|null>(null);
  const ivRef = useRef<any>(null);
  const samplesRef = useRef<Array<{ t: number; p: number }>>([]);

  const MAX_SAMPLES = 8;

  function pushSample(pct: number){
    const t = Date.now();
    const p = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
    const arr = samplesRef.current;
    if(arr.length>0 && Math.abs(arr[arr.length-1].p - p) < 0.001){
      // pct değişmemişse numune eklemeyelim
      return;
    }
    arr.push({ t, p });
    if(arr.length > MAX_SAMPLES) arr.splice(0, arr.length - MAX_SAMPLES);
  }

  function computeEta(pct: number): { etaSecs?: number; uncertain?: boolean }{
    const arr = samplesRef.current;
    if(pct >= 100){ return { etaSecs: 0, uncertain: false }; }
    if(arr.length < 2) return { etaSecs: undefined, uncertain: false };
    // art arda örnekler üzerinden hız (dPct/dt) hesapla (pct/s)
    const slopes: number[] = [];
    for(let i=1;i<arr.length;i++){
      const dt = (arr[i].t - arr[i-1].t) / 1000; // saniye
      const dp = arr[i].p - arr[i-1].p;
      if(dt > 0 && Number.isFinite(dp)){
        const s = dp / dt;
        if(Number.isFinite(s) && s > 0) slopes.push(s);
      }
    }
    if(slopes.length === 0) return { etaSecs: undefined, uncertain: false };
    const mean = slopes.reduce((a,b)=>a+b,0) / slopes.length;
    const variance = slopes.reduce((a,b)=> a + Math.pow(b-mean,2), 0) / slopes.length;
    const std = Math.sqrt(variance);
    const cv = mean > 0 ? std / mean : Infinity; // göreli oynaklık
    if(!Number.isFinite(mean) || mean <= 0) return { etaSecs: undefined, uncertain: false };
    const remaining = Math.max(0, 100 - pct);
    const etaSecs = remaining / mean;
    if(!Number.isFinite(etaSecs) || etaSecs < 0) return { etaSecs: undefined, uncertain: false };
    const uncertain = cv > 0.6; // oynaklık eşiği
    return { etaSecs, uncertain };
  }

  function stop(){
    if(esRef.current){ try{ esRef.current.close(); }catch{} esRef.current = null; }
    if(ivRef.current){ try{ clearInterval(ivRef.current); }catch{} ivRef.current = null; }
    samplesRef.current = [];
    setState(s=>({ ...s, status: "idle", etaSecs: undefined, etaUncertain: false }));
  }

  function fallbackPoll(jobId: string){
    if(ivRef.current) clearInterval(ivRef.current);
    ivRef.current = setInterval(async ()=>{
      try{
        const r = await fetch(`/api/optimizer/progress?jobId=${encodeURIComponent(jobId)}`);
        const j = await r.json().catch(()=>({}));
        setState(s=>{
          const nextPct = typeof j?.pct === 'number' ? j.pct : s.pct;
          pushSample(nextPct);
          const { etaSecs, uncertain } = computeEta(nextPct);
          return { ...s, pct: nextPct, best: j?.best ?? s.best, etaSecs, etaUncertain: uncertain };
        });
        if(j?.status === 'done'){ setState(s=>({ ...s, status:'done', pct: 100, etaSecs: 0, etaUncertain: false })); stop(); }
      }catch{ setState(s=>({ ...s, status:'error' })); }
    }, 2000);
  }

  function start(jobId: string){
    stop(); setState({ pct:0, status:"running" });
    samplesRef.current = [];
    try{
      const es = new EventSource(`/api/optimizer/progress/stream?jobId=${encodeURIComponent(jobId)}`);
      es.onmessage = (e)=>{
        try{
          const msg = JSON.parse(e.data||"{}");
          if(msg?.type === 'progress') setState(s=>{
            const nextPct = typeof msg.pct==='number'? msg.pct : s.pct;
            pushSample(nextPct);
            const { etaSecs, uncertain } = computeEta(nextPct);
            return { ...s, pct: nextPct, etaSecs, etaUncertain: uncertain };
          });
          if(msg?.type === 'bestUpdate') setState(s=>({ ...s, best: msg.best ?? s.best }));
          if(msg?.type === 'completed'){ setState(s=>({ ...s, status:'done', pct: 100, etaSecs: 0, etaUncertain: false })); stop(); }
        }catch{}
      };
      es.onerror = ()=>{ try{ es.close(); }catch{} esRef.current=null; fallbackPoll(jobId); };
      esRef.current = es;
    }catch{ fallbackPoll(jobId); }
  }

  useEffect(()=>()=>{ stop(); },[]);
  return { state, start, stop };
}


