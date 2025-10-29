/**
 * Enhanced i18n for v1.2.1-p1
 * Full package in Sprint 2
 */

export const tr = {
  common: {
    cmdk_mac: "⌘K Komutlar",
    cmdk_win: "Ctrl+K Komutlar",
    commands: "Komutlar",
  },
  settings: {
    theme: {
      light: "Aydınlık",
      dark: "Koyu",
      system: "Sistem",
    },
  },
  status: {
    env: "Ortam",
    feed: "Veri Akışı",
    broker: "Aracı",
    healthy: "Sağlıklı",
    degraded: "Bozulmuş",
    down: "Çalışmıyor",
    offline: "Çevrimdışı",
    online: "Çevrimiçi",
    mock: "Deneme",
    connected: "Bağlı",
    active: "Aktif",
    paused: "Duraklatıldı",
    error: "Hata",
  },
  dashboard: {
    p95: "P95 gecikme",
    staleness: "Güncellik gecikmesi",
    target: "Hedef",
    threshold: "Eşik",
    noData: "Henüz veri yok.",
    lastAlarm: "Son Alarm Durumu",
    lastCanary: "Son Canary Testi",
    demo: "DEMO",
    alarmDrafts: "Alarm Taslakları",
    canaryTests: "Canary Testleri",
  },
  portfolio: {
    totalBalance: "Toplam Bakiye",
    available: "Kullanılabilir",
    inOrders: "Emirde",
    pnl24h: "24s P&L",
    close: "Pozisyonu Kapat",
    reverse: "Ters Pozisyon Aç",
  },
  actions: {
    createStrategy: "Strateji Oluştur",
    createAlert: "Uyarı Oluştur",
    fromAlarmDraft: "Alarmdan Taslak Oluştur",
    autoMuteDraft: "Oto-sessize Alma Taslağı",
    escalateDraft: "Escalate Taslağı",
    openEvidence: "Kanıtı Aç",
  },
};

export const t = (path: string, vars?: Record<string, any>): string => {
  const keys = path.split(".");
  let value: any = tr;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return path;
  }

  if (typeof value !== "string") return path;

  // Template replacement
  if (vars) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
  }

  return value;
};
