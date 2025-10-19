export const en = {
  common: { 
    search: "Search...", 
    demo: "DEMO" 
  },
  status: { 
    env: "Environment", 
    feed: "Data Feed", 
    broker: "Broker", 
    healthy: "Healthy", 
    degraded: "Degraded",
    down: "Down",
    offline: "Offline", 
    mock: "Mock", 
    online: "Online" 
  },
  dashboard: { 
    title: "Spark Trading", 
    subtitle: "Dashboard",
    p95: "P95 latency", 
    staleness: "Data staleness", 
    target: "Target",
    threshold: "Threshold",
    lastAlarm: "Last Alarm Status", 
    lastCanary: "Last Canary Test",
    alarmDrafts: "Alarm Drafts",
    canaryTests: "Canary Tests",
    noData: "No data yet." 
  },
  portfolio: { 
    title: "Portfolio",
    subtitle: "Live positions, PnL and exchange status",
    total: "Total Balance", 
    avail: "Available", 
    inOrders: "In Orders",
    pnl24h: "24h P&L",
    close: "Close Position", 
    reverse: "Open Reverse Position" 
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
    createStrategy: "Create Strategy",
    createAlert: "Create Alert",
    fromAlarmDraft: "Create Draft from Alarm", 
    autoMuteDraft: "Auto-mute Draft", 
    escalateDraft: "Escalate Draft", 
    openEvidence: "Open Evidence" 
  }
} as const;

