'use client'
import { useEffect, useRef, useState } from "react";
import { bus } from "@/lib/event-bus";

export default function RunModal({payload, onClose}: {payload: any; onClose: () => void}) {
  const [params, setParams] = useState({capital: 1000, risk: 0.02});
  const [job, setJob] = useState<any>(null);
  const aborter = useRef<AbortController | null>(null);

  // ESC key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function start() {
    aborter.current?.abort();
    aborter.current = new AbortController();
    
    try {
      const r = await fetch('/api/public/lab/run/start', {
        method: 'POST', 
        body: JSON.stringify({code: payload?.strategy, ...params}),
        signal: aborter.current.signal, 
        headers: {'content-type': 'application/json'}
      });
      const {jobId} = await r.json(); 
      setJob({id: jobId, pct: 0, status: 'running'});
    } catch (error) {
      console.error('Run start error:', error);
      setJob({id: null, pct: 0, status: 'failed', error: 'Failed to start strategy'});
    }
  }

  useEffect(() => {
    if (!job?.id) return;
    
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/public/lab/run/poll?id=${job.id}`, {cache: 'no-store'});
        const j = await r.json(); 
        setJob(j);
        if (j.status === 'done' || j.status === 'failed') clearInterval(t);
      } catch (error) {
        console.error('Poll error:', error);
        clearInterval(t);
      }
    }, 1000);
    
    return () => clearInterval(t);
  }, [job?.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Run Strategy</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Initial Capital</label>
            <input 
              type="number" 
              value={params.capital}
              onChange={(e) => setParams(prev => ({...prev, capital: parseInt(e.target.value)}))}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Risk Per Trade (%)</label>
            <input 
              type="number" 
              step="0.01"
              value={params.risk}
              onChange={(e) => setParams(prev => ({...prev, risk: parseFloat(e.target.value)}))}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={start} disabled={job?.status === 'running'} className="btn btn-primary">
            {job?.status === 'running' ? 'Running...' : 'Start Strategy'}
          </button>
          <button onClick={onClose} className="btn">Close</button>
        </div>

        {job && (
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm">{job.pct}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                style={{width: `${job.pct}%`}}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-300">
              Status: {job.status}
              {job.error && <div className="text-red-400 mt-1">Error: {job.error}</div>}
            </div>
            
            {job.status === 'done' && job.result && (
              <div className="mt-4 p-4 bg-gray-700 rounded">
                <h3 className="font-semibold mb-2">Strategy Started</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Mode:</span>
                    <span className="ml-2">{job.result.mode}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Symbol:</span>
                    <span className="ml-2">{job.result.symbol}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 