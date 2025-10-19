"use client";
import { useEffect, useState } from "react";
import { TARGETS, BANDS } from "@/lib/config";
import { fetchOptional } from "@/lib/net/fetchOptional";
import { isExecutorOnline } from "@/lib/runtime/executor";

export default function AlarmCard(){
  const [data,setData] = useState<any>(null);
  
  useEffect(()=>{
    let alive = true; 
    let interval: any;
    
    const load = async()=>{
      try {
        const { fetchLatestAlert } = await import("@/lib/api-client");
        const result = await fetchLatestAlert();
        
        if (alive) {
          if (result.ok && result.data) {
            setData({ ...result.data, _mock: result.isMock });
          } else {
            setData({ status: 'DEMO', _mock: true, _err: result.error });
          }
        }
      } catch (err) {
        if (alive) {
          setData({ status: 'ERROR', _mock: true, _err: String(err) });
        }
      }
    };
    
    load(); 
    interval = setInterval(load, 30000); // 30s poll
    
    return ()=>{ 
      alive = false; 
      if (interval) clearInterval(interval); 
    };
  },[]);
  const status = data?.status ?? 'N/A';
  const cls = status==='ALERT'? 'text-red-400' : status==='WARN'? 'text-amber-400' : (status==='MOCK' || status==='DEMO')? 'text-neutral-500' : 'text-green-400';
  const p95 = data?.metrics?.p95Ms; const st = data?.metrics?.stalenessS; const exit = data?.metrics?.exitCode;
  return (
    <div className="p-4 rounded-xl border border-neutral-800 bg-black/30">
      {data?.maintenance && (
        <div className="text-xs text-amber-400 mb-1">Maintenance aktif — {data.maintenance.remain ?? ''}</div>
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm opacity-70">Son Alarm Durumu</div>
        <div className={`font-semibold ${cls}`}>{status}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>P95 / Hedef</div><div className="font-mono">{p95 ?? '—'} ms / {TARGETS.P95_MS} ms</div>
        <div>Staleness / Eşik</div><div className="font-mono">{st ?? '—'} s / {TARGETS.STALENESS_S} s</div>
        <div>Exit Code</div><div className="font-mono">{exit ?? '—'}</div>
      </div>
      <div className="mt-2 text-sm">
        <button className="btn btn-xs" onClick={()=>createDraftFromAlarm(p95, st, exit)}>Alarmdan Taslak Oluştur</button>
        <button className="btn btn-xs ml-2" onClick={()=>downloadJson(makeSilenceDraft())}>Auto-mute Taslağı</button>
        <button className="btn btn-xs ml-2" onClick={()=>downloadJson(makeEscalateDraft())}>Escalate Taslağı</button>
      </div>
    </div>
  );
}

function createDraftFromAlarm(p95?:number, st?:number, exit?:number){
  const sev = (exit && exit!==0)? 'alert' : (p95!=null && p95 > TARGETS.P95_MS*BANDS.alert? 'alert' : (p95!=null && p95 > TARGETS.P95_MS*BANDS.warn? 'warn':'ok'));
  const draft = {
    action: "/alerts/create",
    params: { metric:'smoke', p95Ms:p95??null, stalenessS:st??null, exitCode:exit??null, target:{ p95Ms:TARGETS.P95_MS, stalenessS:TARGETS.STALENESS_S }, severity: sev },
    dryRun: true, confirm_required: false, reason: 'alarm-to-draft'
  };
  try{
    const blob = new Blob([JSON.stringify(draft,null,2)], { type:'application/json;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `alarm_draft_${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
  }catch{}
}

function downloadJson(obj:any){ try{ const blob = new Blob([JSON.stringify(obj,null,2)], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `draft_${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href); }catch{} }

function makeSilenceDraft(){
  return {
    action: '/alertmanager/silence.create',
    params: { matchers:[{name:'service',value:'executor'},{name:'env',value:'prod'}], durationMinutes:120, comment:'maintenance' },
    dryRun: true, confirm_required: false, reason: 'auto-mute draft'
  };
}

function makeEscalateDraft(){
  return {
    action: '/alertmanager/route.escalate',
    params: { matchers:[{name:'service',value:'executor'},{name:'env',value:'prod'}], severity:'critical', sustainMinutes:15, target:'email' },
    dryRun: true, confirm_required: false, reason: 'escalate draft'
  };
}


