"use client";
import { useEffect, useState } from "react";
import AlertsPageContent, { AlertItem } from '@/components/alerts/AlertsPageContent';

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { cache: "no-store", ...init });
  const j = await r.json().catch(() => ({ items: [], _err: "parse" }));
  return j as { items?: any[]; events?: any[]; _err?: string };
}

export default function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/alerts/list");
      // Transform API data to AlertItem format
      const transformedItems: AlertItem[] = (data.items ?? []).map((item: any) => ({
        id: item.id,
        symbol: item.symbol,
        strategy: item.strategy || 'N/A',
        condition: item.condition || `${item.type} ${item.timeframe}`,
        type: item.type === 'price' ? 'price' : item.type === 'pnl' ? 'pnl' : item.type === 'risk' ? 'risk' : 'system',
        status: item.active ? 'active' : 'paused',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : '-',
        lastTriggered: item.lastTriggeredAt ? new Date(item.lastTriggeredAt).toLocaleString('tr-TR') : undefined,
        channels: item.channels || ['In-app'],
      }));
      setItems(transformedItems);
      if (data._err) console.warn("Alerts API error:", data._err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function enable(id: string, enabled: boolean) {
    const data = await api(`/api/alerts/${enabled ? "enable" : "disable"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (data._err) console.warn("Enable/disable error:", data._err);
    await load();
  }

  async function del(id: string) {
    if (!confirm("Bu alert'i silmek istediğinizden emin misiniz?")) return;
    const data = await api("/api/alerts/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (data._err) console.warn("Delete error:", data._err);
    await load();
  }

  function edit(id: string) {
    // TODO: Open edit modal
    console.log("Edit alert:", id);
  }

  return (
    <AlertsPageContent
      items={items}
      loading={loading}
      onRefresh={load}
      onEnable={enable}
      onDelete={del}
      onEdit={edit}
    />
  );
}

