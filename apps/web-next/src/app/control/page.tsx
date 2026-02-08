'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { isMockMode } from '@/lib/marketClient';
import { useExecutorHealth } from '@/hooks/useExecutorHealth';

export default function ControlPage() {
  // System mode kontrolü (P0: disabled + tooltip için)
  const isMock = isMockMode();
  const { ok: executorOk } = useExecutorHealth();
  const isDegraded = !executorOk;
  const systemMode = isMock ? 'MOCK MODE' : isDegraded ? 'Degraded' : 'live';
  const isSystemLive = systemMode === 'live';
  const disabledTooltip = systemMode === 'MOCK MODE' 
    ? 'Mock mod: Gerçek işlemler devre dışı' 
    : systemMode === 'Degraded' 
    ? 'Degraded mod: Sistem sınırlı kapasitede çalışıyor' 
    : undefined;

  return (
    <div className="px-6 py-4 min-h-screen bg-neutral-950">
      <PageHeader
        title="Operasyon Merkezi"
        desc="Sistem kontrolü ve operasyonel yönetim"
      />

      <div className="mt-6 space-y-6">
        {/* Kill Switch Section */}
        <div className="rounded-2xl bg-card/60 p-6 border border-orange-500/20">
          <h2 className="text-lg font-semibold mb-4 text-orange-400">Kill Switch</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Tüm aktif işlemleri durdurur ve sistem güvenli moda geçer.
          </p>
          <Button
            onClick={() => console.log('Kill switch')}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!isSystemLive}
            title={disabledTooltip}
          >
            Kill Switch Aktif Et
          </Button>
        </div>

        {/* Risk Limits Section */}
        <div className="rounded-2xl bg-card/60 p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Limitleri</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Portföy risk limitlerini görüntüle ve yönet.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-900 rounded-lg">
              <div className="text-xs text-neutral-500 mb-1">Günlük Kayıp Limiti</div>
              <div className="text-lg font-semibold">$10,000</div>
            </div>
            <div className="p-4 bg-neutral-900 rounded-lg">
              <div className="text-xs text-neutral-500 mb-1">Maksimum Pozisyon</div>
              <div className="text-lg font-semibold">$50,000</div>
            </div>
            <div className="p-4 bg-neutral-900 rounded-lg">
              <div className="text-xs text-neutral-500 mb-1">Maksimum Kaldıraç</div>
              <div className="text-lg font-semibold">5x</div>
            </div>
          </div>
        </div>

        {/* System Status Section */}
        <div className="rounded-2xl bg-card/60 p-6">
          <h2 className="text-lg font-semibold mb-4">Sistem Durumu</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
              <span className="text-sm text-neutral-400">API Bağlantısı</span>
              <span className="text-sm text-red-400">Offline</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
              <span className="text-sm text-neutral-400">WebSocket</span>
              <span className="text-sm text-neutral-400">Bağlı</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
              <span className="text-sm text-neutral-400">Executor</span>
              <span className="text-sm text-red-400">Offline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
