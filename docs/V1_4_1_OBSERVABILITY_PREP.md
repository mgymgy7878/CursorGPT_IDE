# v1.4.1 Observability Prep - Sprint Plan

**Sprint**: v1.4.1 (Backtest Observability)  
**Duration**: 1 hafta (5 SP)  
**Status**: 📋 PLANNED  
**Owner**: Spark Team  
**Created**: 2025-10-08

---

## 🎯 SPRINT HEDEF

v1.4 Backtest MVP'yi Prometheus metrics ve Executor entegrasyonu ile production-grade observability seviyesine çıkarmak.

### Başarı Kriterleri
- ✅ Executor `/api/backtest/status` endpoint fonksiyonel
- ✅ Prometheus metrics export ediliyor (3+ metrik)
- ✅ Grafana dashboard güncellendi (Backtest paneli)
- ✅ Alert rules tanımlandı (duration, failure rate)
- ✅ UI gerçek veri gösteriyor (mock değil)

---

## 📦 KAPSAM

### 1️⃣ EXECUTOR: Backtest Status API (2 SP)

**Dosyalar**:
- `services/executor/src/plugins/backtest.ts` (YENİ)
- `services/executor/src/index.ts` (GÜNCELLEME - router mount)
- `services/executor/src/types/backtest.ts` (YENİ - tip tanımları)

**Endpoint Spec**:
```typescript
GET /api/backtest/status
Response: {
  runs: BacktestRun[];
  stats: {
    total: number;
    running: number;
    queued: number;
    done: number;
    failed: number;
  };
}

GET /api/backtest/runs/:id
Response: BacktestRun

POST /api/backtest/start (v1.4.2'de - şimdilik sadece GET)
```

**Veri Kaynağı**:
- `evidence/backtest/*.json` dosyalarını okuma
- In-memory run state tracking
- Artifact path resolution

**Güvenlik**:
- Read-only endpoints (public)
- POST /start için ADMIN_TOKEN guard (v1.4.2)

---

### 2️⃣ PROMETHEUS: Backtest Metrics (1.5 SP)

**Metrikler**:
```typescript
// Counter
backtest_runs_total{status="done|failed|running"}
  → Total backtest runs by status

// Histogram
backtest_duration_seconds{quantile="0.5|0.9|0.95|0.99"}
  → Backtest execution duration

// Gauge
backtest_active_runs
  → Currently running backtests

// Counter
backtest_artifacts_generated_total{type="csv|pdf"}
  → Generated artifacts count
```

**Dosyalar**:
- `services/executor/src/metrics/backtest-metrics.ts` (YENİ)
- `prometheus.yml` (GÜNCELLEME - scrape config validation)

**Entegrasyon**:
- Metrics export on `/metrics` endpoint
- Label strategy: `{symbol, status, artifact_type}`

---

### 3️⃣ GRAFANA: Backtest Dashboard Panel (0.5 SP)

**Eklenecek Paneller** (`grafana-backtest-dashboard.json`):

1. **Backtest Run Rate** (Graph)
   - Query: `rate(backtest_runs_total[5m])`
   - Y-axis: runs/sec

2. **Duration Heatmap** (Heatmap)
   - Query: `backtest_duration_seconds_bucket`
   - X-axis: Time, Y-axis: Duration

3. **Active Runs** (Stat)
   - Query: `backtest_active_runs`
   - Thresholds: >3 warning, >5 critical

4. **Success Rate** (Gauge)
   - Query: `rate(backtest_runs_total{status="done"}[5m]) / rate(backtest_runs_total[5m])`
   - Thresholds: <90% warning, <80% critical

5. **Artifact Generation** (Bar Chart)
   - Query: `sum by(type) (backtest_artifacts_generated_total)`

---

### 4️⃣ ALERTING: Backtest Alert Rules (0.5 SP)

**Dosya**: `rules/backtest.yml`

```yaml
groups:
  - name: backtest
    interval: 30s
    rules:
      # Backtest duration anomaly
      - alert: BacktestDurationHigh
        expr: histogram_quantile(0.95, backtest_duration_seconds_bucket) > 3600
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Backtest P95 duration > 1 hour"
          
      # Failure rate spike
      - alert: BacktestFailureRateHigh
        expr: rate(backtest_runs_total{status="failed"}[5m]) / rate(backtest_runs_total[5m]) > 0.2
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Backtest failure rate > 20%"
          
      # Stalled backtests
      - alert: BacktestStalled
        expr: backtest_active_runs > 0 and rate(backtest_runs_total{status="done"}[10m]) == 0
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Active backtests but no completions in 10m"
```

---

### 5️⃣ DOCUMENTATION & TESTING (0.5 SP)

**Dosyalar**:
- `docs/BACKTEST_API_REFERENCE.md` (YENİ)
- `scripts/backtest-smoke-test.cjs` (YENİ)
- `CHANGELOG.md` (GÜNCELLEME)

**Test Senaryoları**:
```javascript
// scripts/backtest-smoke-test.cjs
async function smokeTest() {
  // 1. GET /api/backtest/status (listeyi al)
  // 2. Validate response schema
  // 3. GET /api/backtest/runs/:id (detay al)
  // 4. Validate artifact paths
  // 5. Check Prometheus metrics exported
}
```

**Doküman İçeriği**:
- API endpoint specifications
- Metric descriptions
- Alert rule explanations
- Integration guide (Executor → UI)

---

## 🛠️ IMPLEMENTATION PLAN

### Faz 1: Executor Backend (Gün 1-2)
```
□ services/executor/src/types/backtest.ts (tip tanımları)
□ services/executor/src/plugins/backtest.ts (API logic)
□ services/executor/src/index.ts (route mount)
□ Evidence dosyalarını okuma logic
□ In-memory state management
```

### Faz 2: Metrics Integration (Gün 3)
```
□ services/executor/src/metrics/backtest-metrics.ts
□ Counter/Histogram/Gauge tanımları
□ Metric increment logic (run lifecycle)
□ /metrics endpoint validation
```

### Faz 3: Observability Stack (Gün 4)
```
□ grafana-backtest-dashboard.json (5 panel)
□ rules/backtest.yml (3 alert rule)
□ prometheus.yml validation
□ Alertmanager entegrasyon testi
```

### Faz 4: Testing & Documentation (Gün 5)
```
□ scripts/backtest-smoke-test.cjs
□ docs/BACKTEST_API_REFERENCE.md
□ CHANGELOG.md update
□ UI'da gerçek veri testi
```

---

## 📊 TEKNIK DETAYLAR

### Evidence File Format
```json
{
  "runs": [
    {
      "id": "bt-20251008-001",
      "startedAt": "2025-10-08T10:00:00Z",
      "finishedAt": "2025-10-08T10:45:23Z",
      "status": "done",
      "metrics": {
        "auc": 0.65,
        "sharpe": 1.18,
        "maxDrawdown": -0.21,
        "winRate": 0.58,
        "pnl": 15340.50
      },
      "equity": [[1696761600, 100000], [1696761660, 100120], ...],
      "artifacts": {
        "equityCsv": "backtest/artifacts/bt-20251008-001_equity.csv",
        "tradesCsv": "backtest/artifacts/bt-20251008-001_trades.csv",
        "reportPdf": "backtest/artifacts/bt-20251008-001_report.pdf"
      },
      "notes": "BTC 30d backtest with strategy A"
    }
  ]
}
```

### Metric Label Strategy
```typescript
// Good labels (low cardinality)
backtest_runs_total{status="done", symbol_group="crypto"}
backtest_duration_seconds{strategy="mean_reversion", market="spot"}

// Bad labels (high cardinality - AVOID)
backtest_runs_total{run_id="bt-20251008-001"}  // ❌ Unique per run
backtest_runs_total{timestamp="1696761600"}    // ❌ Continuous value
```

### API Error Handling
```typescript
// 200 OK - Success
{ runs: [...], stats: {...} }

// 404 Not Found - Run ID not exists
{ error: "Run not found", runId: "bt-xyz" }

// 500 Internal Server Error - File read error
{ error: "Failed to read evidence", details: "..." }

// 503 Service Unavailable - Too many active runs
{ error: "Backtest queue full", queueSize: 10, limit: 10 }
```

---

## 🧪 VALIDATION CHECKLIST

### Functional Tests
```bash
□ Executor boot with backtest plugin → ✅
□ GET /api/backtest/status → 200 OK, valid JSON
□ GET /api/backtest/runs/:id → 200 OK, detail object
□ GET /api/backtest/runs/invalid → 404 Not Found
□ Metrics visible on /metrics → backtest_* present
□ UI dashboard shows real data (not mock) → ✅
```

### Observability Tests
```bash
□ Prometheus scraping executor:4001/metrics → UP
□ Grafana backtest dashboard renders → all panels green
□ Alert rules loaded → promtool check rules backtest.yml
□ Alert fires on test condition → Alertmanager notification
```

### Performance Tests
```bash
□ 1000 concurrent /status requests → P95 <50ms
□ Evidence file read (100 runs) → <100ms
□ Metrics export overhead → <5ms per request
□ Memory footprint (10k runs cached) → <100MB
```

---

## 🎯 ACCEPTANCE CRITERIA

### Must Have ✅
- [ ] `GET /api/backtest/status` returns real evidence data
- [ ] `GET /api/backtest/runs/:id` returns individual run
- [ ] 3+ Prometheus metrics exported
- [ ] 1 Grafana dashboard (5 panels)
- [ ] 3 alert rules defined
- [ ] UI shows non-mock data
- [ ] Smoke test passes

### Nice to Have 🎁
- [ ] POST `/api/backtest/start` endpoint (defer to v1.4.2)
- [ ] WebSocket live updates (defer to v1.5)
- [ ] Equity chart visualization (defer to v1.4.2)
- [ ] PSI drift metrics (defer to v1.5 ML sprint)

### Deferred to v1.4.2 ⏸️
- Write operations (POST /start, DELETE /runs/:id)
- ADMIN_TOKEN authentication
- Rate limiting
- Advanced filtering (date range, metric thresholds)

---

## 📋 RISK ASSESSMENT

### High Risk 🔴
- **None** (read-only operations, isolated plugin)

### Medium Risk 🟡
1. **Evidence file parsing errors** → Mitigation: JSON schema validation + try/catch
2. **Metric cardinality explosion** → Mitigation: Label whitelist, bounded labels
3. **Memory leak (large equity arrays)** → Mitigation: Streaming, pagination

### Low Risk 🟢
- Grafana panel queries (test in dev)
- Alert rule thresholds (tune in production)

---

## 🚀 DEPLOYMENT STRATEGY

### Phase 1: Dark Launch (Gün 1-3)
- Deploy Executor with `/api/backtest/status` (no UI wiring)
- Smoke test endpoints manually
- Validate metrics export

### Phase 2: Canary (Gün 4)
- Wire UI to real endpoint (feature flag)
- Monitor error rate, latency
- Rollback if issues

### Phase 3: Full Rollout (Gün 5)
- Remove feature flag
- Enable alerts
- Publish dashboard
- Documentation complete

---

## 📚 REFERENCES

### Project Documents
- `SPARK_ALL_IN_ONE.md` - v1.4 Backtest Engine sprint
- `API_REFERENCE.md` - API patterns
- `DEPLOYMENT_GUIDE.md` - Deployment best practices
- `apps/web-next/src/types/backtest.ts` - Frontend types (match backend)

### External Resources
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Grafana Dashboard Design](https://grafana.com/docs/grafana/latest/dashboards/)
- [Express.js Routing](https://expressjs.com/en/guide/routing.html)

---

## 📞 HANDOFF TO IMPLEMENTATION

### Ready to Start
1. ✅ Sprint plan complete
2. ✅ Technical spec defined
3. ✅ Acceptance criteria clear
4. ✅ Risk mitigation planned
5. ✅ Test strategy ready

### First Commands
```bash
cd c:\dev\CursorGPT_IDE

# Create backtest plugin
touch services/executor/src/plugins/backtest.ts
touch services/executor/src/types/backtest.ts
touch services/executor/src/metrics/backtest-metrics.ts

# Create test script
touch scripts/backtest-smoke-test.cjs

# Create dashboard
touch grafana-backtest-dashboard.json
touch rules/backtest.yml

# Create docs
touch docs/BACKTEST_API_REFERENCE.md
```

### Estimated Timeline
- **Faz 1 (Backend)**: 2 gün (2 SP)
- **Faz 2 (Metrics)**: 1 gün (1.5 SP)
- **Faz 3 (Observability)**: 1 gün (1 SP)
- **Faz 4 (Testing/Docs)**: 1 gün (0.5 SP)
- **Total**: 5 gün, 5 SP

**Hazırız!** 🚀 Implementasyona başlamak ister misiniz?

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-08 17:30 UTC  
**Status**: 📋 PLANNED → Ready for implementation
