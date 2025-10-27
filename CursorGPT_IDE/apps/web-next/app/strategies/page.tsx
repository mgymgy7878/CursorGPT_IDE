"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Saved = { ts:number; prompt:string; result:any };
type JobStatus = 'idle' | 'running' | 'completed' | 'error';
type JobResult = {
  jobId?: string;
  runId?: string;
  status: JobStatus;
  logs: string[];
  results?: any;
  error?: string;
};

export default function Strategies() {
  const [list, setList] = useState<Saved[]>([]);
  const [activeJob, setActiveJob] = useState<JobResult>({ status: 'idle', logs: [] });
  const router = useRouter();

  const load = ()=> setList(JSON.parse(localStorage.getItem("lab.strats")||"[]"));
  useEffect(()=>{ load(); }, []);

  const del = (i:number)=>{ const n=[...list]; n.splice(i,1); localStorage.setItem("lab.strats", JSON.stringify(n)); setList(n); };
  const copy = (s:Saved)=> navigator.clipboard.writeText(JSON.stringify(s.result, null, 2));
  
  const runStrategy = async(s:Saved)=>{
    setActiveJob({ status: 'running', logs: ['Strategy başlatılıyor...'] });
    try {
      const r = await fetch("/advisor/run", {
        method:"POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: "ema50_200", params: {} })
      });
      const j = await r.json();
      setActiveJob(prev => ({ ...prev, jobId: j.jobId, logs: [...prev.logs, `Job ID: ${j.jobId}`] }));
      
      // Poll for logs
      const pollLogs = async () => {
        try {
          const logRes = await fetch(`/advisor/logs?jobId=${j.jobId}`);
          const logData = await logRes.json();
          setActiveJob(prev => ({ ...prev, logs: [...prev.logs, ...logData.logs.map((l:any) => l.message)] }));
        } catch (e) {
          setActiveJob(prev => ({ ...prev, logs: [...prev.logs, 'Log alınamadı'] }));
        }
      };
      
      setTimeout(pollLogs, 2000);
      setTimeout(() => setActiveJob(prev => ({ ...prev, status: 'completed' })), 5000);
    } catch (e) {
      setActiveJob({ status: 'error', logs: ['Hata: ' + (e as Error).message] });
    }
  };

  const runBacktest = async(s:Saved)=>{
    setActiveJob({ status: 'running', logs: ['Backtest başlatılıyor...'] });
    try {
      const r = await fetch("/backtest/run", {
        method:"POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: "ema50_200", params: {} })
      });
      const j = await r.json();
      setActiveJob(prev => ({ ...prev, runId: j.runId, logs: [...prev.logs, `Run ID: ${j.runId}`] }));
      
      // Poll for results
      setTimeout(async () => {
        try {
          const resRes = await fetch(`/backtest/status?runId=${j.runId}`);
          const resData = await resRes.json();
          setActiveJob(prev => ({ 
            ...prev, 
            status: 'completed', 
            results: resData.results,
            logs: [...prev.logs, 'Backtest tamamlandı']
          }));
        } catch (e) {
          setActiveJob(prev => ({ ...prev, status: 'error', logs: [...prev.logs, 'Sonuç alınamadı'] }));
        }
      }, 3000);
    } catch (e) {
      setActiveJob({ status: 'error', logs: ['Hata: ' + (e as Error).message] });
    }
  };

  const runOptimize = async(s:Saved)=>{
    setActiveJob({ status: 'running', logs: ['Optimizasyon başlatılıyor...'] });
    try {
      const r = await fetch("/optimize/run", {
        method:"POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: "ema50_200", params: {} })
      });
      const j = await r.json();
      setActiveJob(prev => ({ ...prev, runId: j.runId, logs: [...prev.logs, `Run ID: ${j.runId}`] }));
      
      // Poll for results
      setTimeout(async () => {
        try {
          const resRes = await fetch(`/optimize/status?runId=${j.runId}`);
          const resData = await resRes.json();
          setActiveJob(prev => ({ 
            ...prev, 
            status: 'completed', 
            results: resData.results,
            logs: [...prev.logs, 'Optimizasyon tamamlandı']
          }));
        } catch (e) {
          setActiveJob(prev => ({ ...prev, status: 'error', logs: [...prev.logs, 'Sonuç alınamadı'] }));
        }
      }, 4000);
    } catch (e) {
      setActiveJob({ status: 'error', logs: ['Hata: ' + (e as Error).message] });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Stratejilerim</h1>
<div className='mb-6'><a href='/lab' className='inline-flex items-center rounded-xl bg-emerald-600/90 px-3 py-2 text-white'>Yeni Strateji</a></div>
      <div className="card p-6">
        {list.length===0 && <div className="muted">Henüz kayıt yok.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((s, i)=>(
            <div key={i} className="card p-4">
              <div className="text-xs muted mb-2">{new Date(s.ts).toLocaleString()}</div>
              <div className="whitespace-pre-wrap mb-4 text-sm">{s.prompt}</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={()=>router.push('/lab')}>Düzenle</button>
                <button className="btn" onClick={()=>runOptimize(s)}>Optimize Et</button>
                <button className="btn" onClick={()=>runBacktest(s)}>Backtest</button>
                <button className="btn-primary" onClick={()=>runStrategy(s)}>Çalıştır</button>
                <button className="btn-danger" onClick={()=>del(i)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Job Status Panel */}
      {activeJob.status !== 'idle' && (
        <div className="mt-6 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">İşlem Durumu</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              activeJob.status === 'running' ? 'bg-yellow-500 text-white' :
              activeJob.status === 'completed' ? 'bg-green-500 text-white' :
              activeJob.status === 'error' ? 'bg-red-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {activeJob.status === 'running' ? '⏳ Çalışıyor' :
               activeJob.status === 'completed' ? '✅ Tamamlandı' :
               activeJob.status === 'error' ? '❌ Hata' : '⏸️ Bekliyor'}
            </span>
          </div>
          
          {/* Logs */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Loglar:</h4>
            <div className="bg-gray-900 p-3 rounded text-sm font-mono max-h-40 overflow-y-auto">
              {activeJob.logs.map((log, i) => (
                <div key={i} className="text-green-400">{log}</div>
              ))}
            </div>
          </div>
          
          {/* Results */}
          {activeJob.results && (
            <div>
              <h4 className="text-sm font-medium mb-2">Sonuçlar:</h4>
              <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(activeJob.results, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Job IDs */}
          {(activeJob.jobId || activeJob.runId) && (
            <div className="mt-4 text-xs text-gray-400">
              {activeJob.jobId && <div>Job ID: {activeJob.jobId}</div>}
              {activeJob.runId && <div>Run ID: {activeJob.runId}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}