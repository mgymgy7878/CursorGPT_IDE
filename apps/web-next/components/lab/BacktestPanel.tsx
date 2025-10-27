'use client';

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Play, Eye, Download, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { startBacktest, pollBacktest, BacktestJob } from "@/lib/api/lab";

interface BacktestPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
}

export default function BacktestPanel({ code, onCodeChange }: BacktestPanelProps) {
  const [activeJobs, setActiveJobs] = useState<BacktestJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<BacktestJob[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<BacktestJob | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  const pollingRefs = useRef<Map<string, AbortController>>(new Map());

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRefs.current.forEach(controller => controller.abort());
    };
  }, []);

  const startNewBacktest = useCallback(async () => {
    if (!code.trim()) {
      setError('Lütfen strateji kodunu girin');
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const result = await startBacktest({
        code: code.trim(),
      });

      const newJob: BacktestJob = {
        jobId: result.jobId,
        status: 'queued',
        progress: 0,
        createdAt: Date.now(),
      };

      setActiveJobs(prev => [newJob, ...prev]);

      // Start polling for this job
      startPolling(newJob.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest başlatılamadı');
      console.error('Backtest start error:', err);
    } finally {
      setStarting(false);
    }
  }, [code]);

  const startPolling = useCallback((jobId: string) => {
    const controller = new AbortController();
    pollingRefs.current.set(jobId, controller);

    const poll = async () => {
      try {
        const job = await pollBacktest(jobId, controller.signal);
        
        setActiveJobs(prev => {
          const updated = prev.map(j => j.jobId === jobId ? job : j);
          return updated.filter(j => j.status === 'queued' || j.status === 'running');
        });

        setCompletedJobs(prev => {
          const existing = prev.find(j => j.jobId === jobId);
          if (existing) {
            return prev.map(j => j.jobId === jobId ? job : j);
          } else if (job.status === 'done' || job.status === 'error') {
            return [job, ...prev].slice(0, 5); // Keep last 5
          }
          return prev;
        });

        // Continue polling if not done
        if (job.status === 'queued' || job.status === 'running') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          pollingRefs.current.delete(jobId);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Polling was cancelled
          return;
        }
        console.error('Polling error:', err);
        pollingRefs.current.delete(jobId);
      }
    };

    poll();
  }, []);

  const handleViewResult = useCallback((job: BacktestJob) => {
    setSelectedJob(job);
    setShowResultModal(true);
  }, []);

  const handleDownloadResult = useCallback((job: BacktestJob) => {
    if (!job.result) return;

    const blob = new Blob([JSON.stringify(job.result, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${job.jobId}_${new Date(job.createdAt).toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const getStatusIcon = (status: BacktestJob['status']) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'running': return <Play className="w-4 h-4 text-blue-400" />;
      case 'done': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: BacktestJob['status']) => {
    switch (status) {
      case 'queued': return 'Bekliyor';
      case 'running': return 'Çalışıyor';
      case 'done': return 'Tamamlandı';
      case 'error': return 'Hata';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="space-y-6">
      {/* New Backtest */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Yeni Backtest</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Strateji Kodu
            </label>
            <textarea
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="// Strateji kodunu buraya yapıştırın..."
              className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          <button
            onClick={startNewBacktest}
            disabled={starting || !code.trim()}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span>{starting ? 'Başlatılıyor...' : 'Backtest Başlat'}</span>
          </button>
        </div>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Aktif İşler</h2>
          
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <div key={job.jobId} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="text-white font-medium">Job {job.jobId}</div>
                      <div className="text-sm text-gray-400">
                        {getStatusText(job.status)} • {new Date(job.createdAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    {job.progress}%
                  </div>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Geçmiş</h2>
        
        {completedJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz tamamlanmış backtest bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {completedJobs.map((job) => (
              <div key={job.jobId} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="text-white font-medium">Job {job.jobId}</div>
                      <div className="text-sm text-gray-400">
                        {getStatusText(job.status)} • {new Date(job.createdAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {job.status === 'done' && (
                      <>
                        <button
                          onClick={() => handleViewResult(job)}
                          className="btn-secondary text-sm flex items-center space-x-1"
                          aria-label="Sonucu görüntüle"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Sonuç</span>
                        </button>
                        <button
                          onClick={() => handleDownloadResult(job)}
                          className="btn-secondary text-sm flex items-center space-x-1"
                          aria-label="Sonucu indir"
                        >
                          <Download className="w-3 h-3" />
                          <span>İndir</span>
                        </button>
                      </>
                    )}
                    {job.status === 'error' && job.error && (
                      <div className="text-sm text-red-400">
                        {job.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Modal */}
      {showResultModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Backtest Sonucu - {selectedJob.jobId}
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-gray-800 rounded border border-gray-700 p-4 overflow-auto max-h-[60vh]">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(selectedJob.result, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => handleDownloadResult(selectedJob)}
                className="btn-secondary"
              >
                İndir
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="btn-primary"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 