'use client';

import { useRouter } from "next/navigation";

type Job = {
  id: string;
  name: string;
  type: 'backtest' | 'strategy' | 'data_sync' | 'analysis';
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  startTime: string;
  estimatedEnd?: string;
  description: string;
};

export default function ActiveJobs() {
  const router = useRouter();
  
  // Mock data - replace with real API call
  const jobs: Job[] = [
    {
      id: '1',
      name: 'RSI Strategy Backtest',
      type: 'backtest',
      status: 'running',
      progress: 65,
      startTime: '2024-01-15T09:00:00Z',
      estimatedEnd: '2024-01-15T11:00:00Z',
      description: 'Son 30 günlük veri üzerinde RSI stratejisi test ediliyor',
    },
    {
      id: '2',
      name: 'Market Data Sync',
      type: 'data_sync',
      status: 'running',
      progress: 90,
      startTime: '2024-01-15T08:30:00Z',
      estimatedEnd: '2024-01-15T09:30:00Z',
      description: 'Binance\'dan son fiyat verileri senkronize ediliyor',
    },
    {
      id: '3',
      name: 'AI Signal Analysis',
      type: 'analysis',
      status: 'queued',
      progress: 0,
      startTime: '2024-01-15T10:00:00Z',
      description: 'AI modeli ile sinyal analizi bekliyor',
    },
    {
      id: '4',
      name: 'Portfolio Rebalancing',
      type: 'strategy',
      status: 'completed',
      progress: 100,
      startTime: '2024-01-15T07:00:00Z',
      description: 'Portföy yeniden dengeleme tamamlandı',
    },
  ];

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'backtest': return '📊';
      case 'strategy': return '🤖';
      case 'data_sync': return '🔄';
      case 'analysis': return '🧠';
      default: return '⚙️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'queued': return 'text-yellow-400';
      default: return 'text-zinc-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Çalışıyor';
      case 'completed': return 'Tamamlandı';
      case 'failed': return 'Başarısız';
      case 'queued': return 'Bekliyor';
      default: return status;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'queued': return 'bg-yellow-500';
      default: return 'bg-zinc-500';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-sm">Aktif iş yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.slice(0, 5).map((job) => (
        <div
          key={job.id}
          className="p-3 bg-zinc-800/50 rounded border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => router.push('/jobs')}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="text-lg">{getJobIcon(job.type)}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">{job.name}</div>
              <div className={`text-xs ${getStatusColor(job.status)}`}>
                {getStatusText(job.status)}
              </div>
            </div>
            <div className="text-xs text-zinc-400">
              {formatTime(job.startTime)}
            </div>
          </div>
          
          <div className="text-xs text-zinc-300 mb-2">
            {job.description}
          </div>
          
          {job.status === 'running' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>İlerleme</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressColor(job.status)}`}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              {job.estimatedEnd && (
                <div className="text-xs text-zinc-400">
                  Tahmini bitiş: {formatTime(job.estimatedEnd)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {jobs.length > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/jobs')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            +{jobs.length - 5} iş daha görüntüle
          </button>
        </div>
      )}
    </div>
  );
} 