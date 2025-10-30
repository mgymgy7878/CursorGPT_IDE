"use client";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataModeBadge from "@/components/ui/DataModeBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { useStrategies } from "@/hooks/useStrategies";

export default function RunningPage() {
  const { strategies, setStatus, list, loading, error } = useStrategies();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    list();
  }, [list]);

  const running = useMemo(() => strategies.filter(s => s.status === "running" || s.status === "active"), [strategies]);

  async function doAction(id: string, action: 'start' | 'stop' | 'pause'){
    setBusy(id);
    try{
      await setStatus(id, action);
    }finally{
      setBusy(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Çalışan Stratejiler" desc="Aktif stratejileri görüntüle ve yönet" />
        <div className="flex items-center gap-2">
          <DataModeBadge />
        </div>
      </div>

      {error && (
        <div className="text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {running.map(s => (
          <div key={s.id} className="border border-neutral-800 rounded-xl p-4 bg-neutral-900">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white font-semibold">{s.name}</div>
              <StatusBadge status={s.status === 'active' || s.status === 'running' ? 'success' : 'neutral'} label={s.status} />
            </div>
            <div className="text-sm text-neutral-400 mb-3">{s.description || 'Strateji açıklaması yok'}</div>
            {/* Mini sparkline placeholder */}
            <div className="h-12 bg-neutral-800 rounded mb-4" />

            <div className="flex items-center gap-2">
              <Button disabled={busy===s.id || loading} onClick={()=>doAction(s.id, 'pause')}>Duraklat</Button>
              <Button disabled={busy===s.id || loading} onClick={()=>doAction(s.id, 'stop')}>Durdur</Button>
              <Button disabled={busy===s.id || loading} onClick={()=>doAction(s.id, 'start')}>Sürdür</Button>
            </div>
          </div>
        ))}
      </div>

      {running.length === 0 && (
        <EmptyState
          icon="Activity"
          title="Şu anda çalışan strateji yok"
          description="Stratejilerim sayfasından mevcut bir stratejiyi başlatabilir veya yeni strateji oluşturabilirsiniz"
          action={{
            label: "Stratejilere Git",
            onClick: () => window.location.href = "/strategies"
          }}
        />
      )}
    </div>
  );
}

