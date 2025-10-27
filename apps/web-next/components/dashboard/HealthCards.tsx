'use client';

type HealthMetric = {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  description: string;
  icon: string;
};

export default function HealthCards() {
  // Mock data - replace with real API call
  const metrics: HealthMetric[] = [
    {
      name: 'API Bağlantısı',
      status: 'healthy',
      value: 'Bağlı',
      description: 'Binance API aktif',
      icon: '🔗',
    },
    {
      name: 'WebSocket',
      status: 'healthy',
      value: 'Aktif',
      description: 'Gerçek zamanlı veri akışı',
      icon: '📡',
    },
    {
      name: 'Strateji Motoru',
      status: 'warning',
      value: 'Yavaş',
      description: 'Yüksek CPU kullanımı',
      icon: '⚙️',
    },
    {
      name: 'Veritabanı',
      status: 'healthy',
      value: 'Bağlı',
      description: 'PostgreSQL aktif',
      icon: '🗄️',
    },
    {
      name: 'Bellek Kullanımı',
      status: 'warning',
      value: '75%',
      description: 'Yüksek bellek kullanımı',
      icon: '💾',
    },
    {
      name: 'Disk Alanı',
      status: 'healthy',
      value: '45%',
      description: 'Yeterli alan mevcut',
      icon: '💿',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-500 bg-green-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      default: return 'border-zinc-500 bg-zinc-500/10';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.name}
          className={`p-3 rounded border-l-4 ${getStatusColor(metric.status)}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{metric.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{metric.name}</div>
              <div className={`text-xs font-medium ${getStatusTextColor(metric.status)}`}>
                {metric.value}
              </div>
            </div>
          </div>
          <div className="text-xs text-zinc-400">
            {metric.description}
          </div>
        </div>
      ))}
    </div>
  );
} 