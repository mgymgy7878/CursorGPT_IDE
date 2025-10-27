'use client';

import { useApi } from '@/lib/useApi';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ServiceHealth {
  ok: boolean;
  error?: string;
  latency?: number;
}

interface HealthData {
  executor: ServiceHealth;
  ml?: ServiceHealth;
  streams?: ServiceHealth;
  canary?: {
    lastTest: string;
    passed: boolean;
    message?: string;
  };
}

export function SystemHealthDot() {
  const { data, error } = useApi<HealthData>('/api/services/health', {
    refreshInterval: 10000 // 10s
  });

  const [showDetails, setShowDetails] = useState(false);

  if (error || !data) {
    return (
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-sm text-gray-500">Durum kontrol ediliyor...</span>
      </div>
    );
  }

  const allHealthy = data.executor?.ok && 
    (data.ml?.ok !== false) && 
    (data.streams?.ok !== false) &&
    (data.canary?.passed !== false);

  const someDown = !data.executor?.ok || 
    data.ml?.ok === false || 
    data.streams?.ok === false;

  const canaryFailed = data.canary && !data.canary.passed;

  const getStatusColor = () => {
    if (canaryFailed) return 'text-yellow-500';
    if (someDown) return 'text-red-500';
    if (allHealthy) return 'text-green-500';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (canaryFailed) return 'Canary Uyarısı';
    if (someDown) return 'Bazı Servisler Kapalı';
    if (allHealthy) return 'Tüm Sistemler Çalışıyor';
    return 'Durum Belirsiz';
  };

  const getStatusIcon = () => {
    if (canaryFailed) return <AlertCircle className="h-4 w-4" />;
    if (someDown) return <XCircle className="h-4 w-4" />;
    if (allHealthy) return <CheckCircle className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`w-3 h-3 rounded-full ${
          canaryFailed ? 'bg-yellow-500 animate-pulse' :
          someDown ? 'bg-red-500 animate-pulse' :
          allHealthy ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {getStatusIcon()}
      </div>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-800 p-4 z-50">
          <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Sistem Durumu Detayları
          </h4>

          <div className="space-y-2">
            <ServiceStatus name="Executor" service={data.executor} />
            {data.ml && <ServiceStatus name="ML Engine" service={data.ml} />}
            {data.streams && <ServiceStatus name="Streams" service={data.streams} />}
            
            {data.canary && (
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Canary Test
                  </span>
                  <div className="flex items-center gap-2">
                    {data.canary.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      data.canary.passed ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {data.canary.passed ? 'Geçti' : 'Uyarı'}
                    </span>
                  </div>
                </div>
                {data.canary.message && (
                  <p className="text-xs text-gray-500 mt-1">{data.canary.message}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Son test: {new Date(data.canary.lastTest).toLocaleString('tr-TR')}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowDetails(false)}
            className="w-full mt-3 px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}

function ServiceStatus({ name, service }: { name: string; service: ServiceHealth }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
      <div className="flex items-center gap-2">
        {service.ok ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${
          service.ok ? 'text-green-600' : 'text-red-600'
        }`}>
          {service.ok ? 'Çalışıyor' : 'Kapalı'}
        </span>
        {service.latency && (
          <span className="text-xs text-gray-500">
            ({service.latency}ms)
          </span>
        )}
      </div>
      {!service.ok && service.error && (
        <p className="text-xs text-red-500 mt-1">{service.error}</p>
      )}
    </div>
  );
}

