'use client';

import { useRouter } from "next/navigation";

type LogEntry = {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  source: string;
  details?: string;
};

export default function RecentLogs() {
  const router = useRouter();
  
  // Mock data - replace with real API call
  const logs: LogEntry[] = [
    {
      id: '1',
      level: 'info',
      message: 'RSI Strategy başlatıldı',
      timestamp: '2024-01-15T10:45:00Z',
      source: 'strategy-engine',
      details: 'BTCUSDT için RSI stratejisi aktif edildi',
    },
    {
      id: '2',
      level: 'warning',
      message: 'Yüksek bellek kullanımı tespit edildi',
      timestamp: '2024-01-15T10:42:00Z',
      source: 'system-monitor',
      details: 'Bellek kullanımı %85\'e ulaştı',
    },
    {
      id: '3',
      level: 'error',
      message: 'Binance API bağlantı hatası',
      timestamp: '2024-01-15T10:40:00Z',
      source: 'api-connector',
      details: 'Rate limit aşıldı, 60 saniye beklenecek',
    },
    {
      id: '4',
      level: 'info',
      message: 'Portföy güncellendi',
      timestamp: '2024-01-15T10:38:00Z',
      source: 'portfolio-manager',
      details: 'Toplam değer: $12,450.75 (+2.3%)',
    },
    {
      id: '5',
      level: 'debug',
      message: 'WebSocket bağlantısı yenilendi',
      timestamp: '2024-01-15T10:35:00Z',
      source: 'websocket-client',
      details: 'Ping: 45ms, Pong: 47ms',
    },
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🔍';
      default: return '📝';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'debug': return 'text-zinc-400';
      default: return 'text-zinc-400';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'debug': return 'bg-zinc-500/10 border-zinc-500/20';
      default: return 'bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-sm">Log kaydı yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.slice(0, 8).map((log) => (
        <div
          key={log.id}
          className={`flex items-start gap-3 p-2 rounded border ${getLevelBgColor(log.level)} hover:bg-zinc-800/50 transition-colors cursor-pointer`}
          onClick={() => router.push('/logs')}
        >
          <div className="text-sm">{getLevelIcon(log.level)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className={`text-xs font-medium ${getLevelColor(log.level)}`}>
                {log.level.toUpperCase()}
              </div>
              <div className="text-xs text-zinc-400">
                {formatTime(log.timestamp)}
              </div>
            </div>
            
            <div className="text-xs text-zinc-200 mb-1">
              {log.message}
            </div>
            
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="bg-zinc-700 px-2 py-1 rounded">
                {log.source}
              </span>
              {log.details && (
                <span className="truncate max-w-32">
                  {log.details}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {logs.length > 8 && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/logs')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            +{logs.length - 8} log daha görüntüle
          </button>
        </div>
      )}
    </div>
  );
} 