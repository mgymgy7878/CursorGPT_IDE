'use client';

import { useRouter } from "next/navigation";

type Alert = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export default function MiniAlerts() {
  const router = useRouter();
  
  // Mock data - replace with real API call
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Düşük Bakiye',
      message: 'USDT bakiyeniz 100$ altına düştü',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Strateji Başarılı',
      message: 'RSI_Strategy pozisyonu kârla kapandı',
      timestamp: '2024-01-15T10:15:00Z',
      read: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'Sistem Güncellemesi',
      message: 'Yeni özellikler eklendi',
      timestamp: '2024-01-15T09:45:00Z',
      read: true,
    },
    {
      id: '4',
      type: 'error',
      title: 'Bağlantı Hatası',
      message: 'Binance API bağlantısında sorun',
      timestamp: '2024-01-15T09:30:00Z',
      read: false,
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-500 bg-blue-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'success': return 'border-green-500 bg-green-500/10';
      default: return 'border-zinc-500 bg-zinc-500/10';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-sm">Bildirim yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-3 rounded border-l-4 ${
            getAlertColor(alert.type)
          } hover:bg-zinc-800/50 transition-colors cursor-pointer ${
            !alert.read ? 'bg-zinc-800/30' : ''
          }`}
          onClick={() => router.push('/alerts')}
        >
          <div className="text-lg">{getAlertIcon(alert.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{alert.title}</div>
              <div className="text-xs text-zinc-400">{formatTime(alert.timestamp)}</div>
            </div>
            <div className="text-xs text-zinc-300 mt-1 line-clamp-2">
              {alert.message}
            </div>
            {!alert.read && (
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
            )}
          </div>
        </div>
      ))}
      
      {alerts.length > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/alerts')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            +{alerts.length - 5} bildirim daha görüntüle
          </button>
        </div>
      )}
      
      {unreadCount > 0 && (
        <div className="text-center pt-2">
          <div className="text-xs text-zinc-400">
            {unreadCount} okunmamış bildirim
          </div>
        </div>
      )}
    </div>
  );
} 