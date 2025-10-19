# CHANGELOG

## [1.2.0] - 2025-01-17

### 🎨 UI Finalization
- ✅ PageHeader bileşeni genişletildi (chips, actions, rightSlot desteği)
- ✅ CanaryCard: Risk evidence kartı (p95 latency, staleness, exit code)
- ✅ MarketCard: BTCTurk/BIST market data kartları (ticker, orderbook, trades)
- ✅ CopilotPanel: AI asistan modal paneli
- ✅ Observability Page: Prometheus metrics görünümü

### 🔧 TypeScript Strict Mode
- ✅ Tüm TypeScript strict mode hataları çözüldü
- ✅ WebSocket Map iteration fix (ES2015 + downlevelIteration)
- ✅ AppShell/PageHeader props interface düzeltmeleri
- ✅ Shell component route types (as const)
- ✅ Default export'lar eklendi (MarketCard, CanaryCard)

### 📊 Metrics & Monitoring
- ✅ Dashboard: Real-time metrics fetching (executor + marketdata)
- ✅ Observability: Prometheus metrics parsing & display
- ✅ Auto-refresh logic (30s intervals)
- ✅ Loading states & fallback cards

### 🎯 Strategy Lab
- ✅ AI prompt state management
- ✅ Interactive form with mock API
- ✅ "use client" directive eklendi

### 🏗️ Build Pipeline
- ✅ TypeScript: 0 errors
- ✅ Build: SUCCESS
- ✅ All pages: 200 OK (dashboard, observability, strategy-lab)
- ✅ ESLint & TypeScript checks aktif (ignoreDuringBuilds: false)

### 📦 Evidence & Documentation
- ✅ canary_v1.2_final_locked.json
- ✅ metrics_snapshot.txt
- ✅ pm2_status.json
- ✅ spark_v1.2_ui_ready.ok
- ✅ ui_fix_5errors_done.ok

### 🐛 Bug Fixes
- Command palette type fix (ops → dev)
- Toast boolean comparison simplification
- Barrel exports normalization
- Import path consistency

---

## [1.1.0] - 2025-01-16

### Initial Release
- Monorepo structure with pnpm workspaces
- Executor & Marketdata services (minimal Fastify)
- Next.js 14 web frontend
- PM2 process management
- Dark mode support

---

## Next: v1.3.0

### Planned Features
- BTCTurk Spot WebSocket integration
- BIST feed polling & normalization
- Copilot Guardrails (param-diff approval, risk scoring)
- Grafana dashboards (P95, ErrorRate, Uptime)
- Strategy Lab: Generate → Backtest → Optimize flow

