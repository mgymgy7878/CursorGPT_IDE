# CHANGELOG

## [1.3.1] - 2025-10-24

### 🎯 P0 Standards Compliance
- ✅ **Prometheus 0.0.4 Text Format Endpoint** - `/api/public/metrics.prom` with official Content-Type
- ✅ **RFC 9512 YAML Media Type** - Standardized `application/yaml` configuration
- ✅ **NGINX Production Config** - Security headers, SSL/TLS, rate limiting ready
- ✅ **Automated Testing** - 11 tests (6 unit + 5 E2E) with CI/CD pipeline
- ✅ **Evidence Collection System** - Compliance proof automation

### 🧪 Testing & CI/CD
- ✅ Jest unit tests for Prometheus endpoint (6 tests)
- ✅ Playwright E2E tests for headers compliance (5 tests)
- ✅ GitHub Actions workflow: `headers-smoke.yml` (5 jobs)
- ✅ Validation scripts: Bash + PowerShell
- ✅ All CI jobs passing on main branch

### 📚 Documentation
- ✅ Comprehensive project analysis (1,360 lines)
- ✅ Action plan with code examples (779 lines)
- ✅ Executive summary report (216 lines)
- ✅ CI troubleshooting guide (237 lines)
- ✅ Evidence system documentation

### 🔧 Bug Fixes
- Fixed: BTCTurk ticker route missing `dynamic = 'force-dynamic'` export
- Fixed: NGINX config syntax for standalone testing
- Fixed: Playwright installation in CI pipeline
- Updated: NGINX validation script (permissive types check)

### 📦 Infrastructure
- New: `deploy/nginx/spark.conf` - Production NGINX configuration
- New: `.env.example` - Environment variables with deployment settings
- New: `tools/verify_nginx_headers.sh` - NGINX validation script
- New: `scripts/smoke_headers_prom.ps1` - Quick smoke test

---

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

