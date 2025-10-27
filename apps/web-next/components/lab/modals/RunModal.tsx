'use client';

import { useState, useEffect } from "react";
import { Play, Download, Copy, Zap } from "lucide-react";
import { postPublic } from "@/lib/api/client";
import { bus } from "@/lib/event-bus";
import Modal from "@/components/modal/Modal";

interface RunModalProps {
  code: string;
}

export default function RunModal({ code }: RunModalProps) {
  const [job, setJob] = useState<{ id?: string; progress?: number; result?: any; error?: string }>({});
  const [params, setParams] = useState({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    riskPercent: '1',
    maxPositions: '3'
  });
  const [busy, setBusy] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const start = async () => {
    setBusy(true);
    setJob({});
    setShowResult(false);
    
    try {
      const response = await postPublic('/api/public/lab/run', { code, params });
      const data = await response.json();
      
      setJob({ id: data?.jobId || data?.id });
      bus.emit('lab:job:start' as any, { type: 'run', id: data?.jobId });
    } catch (error) {
      console.error('Run start error:', error);
      setJob({ error: 'Strateji çalıştırılamadı' });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const poll = async () => {
      if (!job.id) return;
      
      try {
        const response = await postPublic(`/api/public/lab/run/status?jobId=${job.id}`, {});
        const data = await response.json();
        
        setJob(prev => ({
          ...prev,
          progress: data?.progress,
          result: data?.result,
          error: data?.error
        }));
        
        bus.emit('lab:job:progress' as any, { id: job.id, progress: data?.progress });
        
        if (data?.status === 'done' || data?.status === 'error') {
          bus.emit('lab:job:done' as any, { id: job.id });
          clearInterval(interval);
          setBusy(false);
          if (data?.result) {
            setShowResult(true);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(interval);
        setBusy(false);
      }
    };

    if (job.id) {
      interval = setInterval(poll, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [job.id]);

  const handleDownload = () => {
    if (!job.result) return;

    const blob = new Blob([JSON.stringify(job.result, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run_${job.id}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!job.result) return;
    navigator.clipboard.writeText(JSON.stringify(job.result, null, 2));
  };

  return (
    <Modal title="Strateji Çalıştır" size="lg">
      <div className="space-y-6">
        {/* Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sembol
            </label>
            <input
              type="text"
              value={params.symbol}
              onChange={(e) => setParams(prev => ({ ...prev, symbol: e.target.value }))}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Zaman Dilimi
            </label>
            <select
              value={params.timeframe}
              onChange={(e) => setParams(prev => ({ ...prev, timeframe: e.target.value }))}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Risk (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={params.riskPercent}
              onChange={(e) => setParams(prev => ({ ...prev, riskPercent: e.target.value }))}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Max Pozisyon
            </label>
            <input
              type="number"
              value={params.maxPositions}
              onChange={(e) => setParams(prev => ({ ...prev, maxPositions: e.target.value }))}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Code Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Strateji Kodu
          </label>
          <div className="bg-gray-800 border border-gray-700 rounded-md p-3 max-h-32 overflow-auto">
            <pre className="text-sm text-gray-300 font-mono">{code}</pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={start}
            disabled={busy || !code.trim()}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            <span>{busy ? 'Başlatılıyor...' : 'Stratejiyi Çalıştır'}</span>
          </button>
        </div>

        {/* Progress */}
        {job.id && job.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">İlerleme</span>
              <span className="text-gray-300">{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {job.error && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
            <div className="text-red-400 text-sm">{job.error}</div>
          </div>
        )}

        {/* Results */}
        {showResult && job.result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Sonuçlar</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Kopyala</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>İndir</span>
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-md p-4 max-h-64 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
} 