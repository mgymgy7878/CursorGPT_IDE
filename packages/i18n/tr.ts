export const tr = {
  common: { 
    search: "Ara...", 
    demo: "DEMO" 
  },
  status: { 
    env: "Ortam", 
    feed: "Veri Akışı", 
    broker: "Aracı", 
    healthy: "Sağlıklı",
    degraded: "Bozulmuş",
    down: "Çalışmıyor", 
    offline: "Çevrimdışı", 
    mock: "Deneme", 
    online: "Çevrimiçi" 
  },
  dashboard: { 
    title: "Spark Trading", 
    subtitle: "Dashboard",
    p95: "P95 gecikme", 
    staleness: "Güncellik gecikmesi", 
    target: "Hedef",
    threshold: "Eşik",
    lastAlarm: "Son Alarm Durumu", 
    lastCanary: "Son Canary Testi",
    alarmDrafts: "Alarm Taslakları",
    canaryTests: "Canary Testleri",
    noData: "Henüz veri yok." 
  },
  portfolio: { 
    title: "Portföy",
    subtitle: "Canlı pozisyonlar, PnL ve borsa durumu",
    total: "Toplam Bakiye", 
    avail: "Kullanılabilir", 
    inOrders: "Emirde",
    pnl24h: "24 saat P&L",
    close: "Pozisyonu Kapat", 
    reverse: "Ters Pozisyon Aç" 
  },
  strategyLab: {
    title: "Strategy Lab",
    subtitle: "AI → Backtest → Optimize → Best-of",
    aiStrategy: "AI Strategy",
    backtest: "Backtest",
    optimize: "Optimize",
    bestOf: "Best-of",
  },
  actions: { 
    createStrategy: "Strateji Oluştur",
    createAlert: "Uyarı Oluştur",
    fromAlarmDraft: "Alarmdan Taslak Oluştur", 
    autoMuteDraft: "Oto-sessize Alma Taslağı", 
    escalateDraft: "Escalate Taslağı", 
    openEvidence: "Kanıtı Aç",
    commandPalette: "⌘K Komutlar",
    opsHelp: "Ops Hızlı Yardım"
  }
} as const;

