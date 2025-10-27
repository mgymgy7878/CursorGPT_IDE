# Changelog

## [2.0.0] — Online Predict GA & Risk-Aware Pipeline — 2025-08-26 (EN)

### Highlights
- Online Predict (GA): Production-grade LRU+TTL cache with snapshot/rehydrate, rate limiting (429 with retry-after + `retryAfterMs`), and latency metrics.
- Shadow A/B: Candidate model scores logged alongside production (decision unaffected); daily risk report compares prod vs candidate.
- Risk-Aware Pipeline: `/fusion/risk.report.daily` generates ZIP (CSV/PDF + manifest); Advisor merges outage + fusion suggestions.
- Retrain Automation: `/fusion/retrain.suggest` emits PSI/freshness reasons, artifacts, and drafts; optional AUTO cron.
- Proxy Hardening: POST-only policy maintained; new Fusion/Advisor POST endpoints allowlisted; SSE passthrough preserved.
- Observability: Cache hit/miss/items/snapshot_ts, online latency, freshness SLO, PSI gauges; Prometheus text served via proxy GET.
- Resilience: db-lite fallback for manifests/logs; PG migrations optional.

### New Endpoints (public proxy)
- `fusion/retrain.suggest`
- `fusion/risk.report.daily`
- `fusion/model.candidate.set`
- `canary/advise/suggest`

### Breaking Changes
- None expected. Metrics must be read via `GET /api/public/metrics` (`POST` returns 405 by design).

### Upgrade Notes
- Web env: `apps/web-next/.env.local` → `EXECUTOR_BASE=http://127.0.0.1:4001`
- Executor env:
  - `FUSION_ONLINE_CACHE_SNAPSHOT=./evidence/cache/fusion_online_cache.json`
  - `RISK_REPORT_DIR=./evidence/reports`
- Ensure `evidence/cache` and `evidence/reports` exist (created at runtime).
- (Optional) PG migrate to enable persistent tables.

### QA Summary
- Health: web `…/api/public/healthz` = 200; executor `/healthz` = 200
- Metrics: `GET …/api/public/metrics` contains `# HELP`
- Canary stats: `POST` returns JSON (decision + p95s)
- Risk report: `POST` returns `application/zip`, size > 0 B

## [2.0.0] — Online Predict GA & Risk-Aware Pipeline — 2025-08-26 (TR)

### Eklendi
- **Online Predict (GA)**: Kalıcı LRU+TTL cache (snapshot→rehydrate), token-bucket rate-limit (429 + `retryAfterMs`).
- **Shadow A/B**: Candidate model paralel skor; prod karara dokunmadan log/rapor (fusion_shadow_logged_total).
- **Risk Pipeline**:
  - **Drift→Auto-retrain**: PSI/freshness ihlallerinde guardlı retrain; artefaktlar ve draft model üretimi.
  - **Günlük Risk Raporu**: Prod vs candidate CSV/PDF + manifest; ZIP indirilebilir.
  - **Promote→Policy Köprüsü**: Promote/set-threshold sonrası guardrails diff/patch önerisi.
- **Fusion API**: `model.candidate.set`, `retrain.suggest`, `risk.report.daily`.
- **Proxy**: POST-only prensibi korundu; Fusion/Advisor POST allowlist güncellendi. 429’da `retry-after` başlığı ve gövdede `retryAfterMs`.
- **UI**:
  - /fusion: GA/Shadow/Cache/Rate göstergeleri, Drift’te auto-retrain durumu.
  - /dashboard: ModelABChip, Risk Pipeline kısayolu.
- **Observability**:
  - Cache hit/miss/items/snapshot_ts, online predict latency.
  - Freshness/PSI gauge’ları.
  - Risk report ve shadow log sayaçları.

### Değişti
- **Public proxy metrics**: GET ile scrape; POST `/metrics` bilinçli olarak 405.
- **Health rotaları**: Duplike kaldırıldı, tek plugin üzerinden `/healthz`.

### Düzeltildi
- Next App Router: `dynamic='force-dynamic'` + `revalidate=0` (invalid revalidate objesi sorunu giderildi).
- Executor boot: lab/guardrails opsiyonel register; ws env ile kapatılabilir.
- `canary-runner` import döngüsü → HTTP inject ile çözüldü.
- db-lite tsconfig/moduleResolution ve eksik metric export’ları tamamlandı.

### Güvenlik / Sertleştirme
- SSE passthrough (no-cache/keep-alive/abort zinciri) ve ZIP/HTML/TEXT streaming’de header passthrough.

### Migrasyon / Ortam
- **ENV (kalıcı)**  
  - `apps/web-next/.env.local`: `EXECUTOR_BASE=http://127.0.0.1:4001`  
  - `services/executor/.env`:  
    - `FUSION_ONLINE_CACHE_SNAPSHOT=./evidence/cache/fusion_online_cache.json`  
    - `RISK_REPORT_DIR=./evidence/reports`
- **(Opsiyonel PG)**: Prisma migrate ile FusionShadowLog + RiskReportManifest tabloları.

### Smoke / Kabul
- Health: `4001/healthz`, `3003/api/public/healthz` → 200  
- Metrics: `GET /api/public/metrics` → “# HELP”  
- Canary: `POST /api/public/canary/stats` → 200 JSON  
- Risk report: `POST /api/public/fusion/risk.report.daily` → `application/zip` ve >0 B

### Bilinenler
- `/metrics` POST 405 — tasarım gereği.
- Gate (FUSION_GATE_ENABLE=1) açıldığında yüksek riskte 403 `MODEL_RISK_HIGH` beklenir.

## v0.3.1 - 2025-08-16
- Matching engine: limit/stop matching çekirdeği
- Fee varyantları: maker/taker fee modeli ve slippage kontrolü
- Stop watcher: Otomatik stop order tetikleme sistemi
- Stop watcher metrikleri: spark_paper_stops_triggered_total
- Common package: @spark/common rate-limit, retry, idempotency utilities
- Config API: /api/paper/config/get ve /api/paper/config/set endpoint'leri
- Reset API: /api/paper/reset endpoint'i
- UI güncellemeleri: Control sayfasına Paper Reset ve Config Save butonları
- Metrikler: spark_paper_rejects_total, spark_paper_slippage_total, spark_paper_fee_total
- Environment: PAPER_MAX_SLIPPAGE_BPS, PAPER_TICK_SIZE, PAPER_LOT_SIZE, PAPER_STOP_WATCHER_MS

## v0.3.0 - 2025-08-16
- Order types LIMIT/STOP/IOC, fee modeli, backtest köprüsü, private API iskeleti
- Gelişmiş emir tipleri: MARKET, LIMIT, STOP_MARKET, STOP_LIMIT, IOC
- Time in Force: GTC (Good Till Cancelled), IOC (Immediate Or Cancel)
- Fee modeli: Maker 0.1% (10 BPS), Taker 0.15% (15 BPS)
- Risk guard'ları: Maksimum pozisyon, günlük kayıp, kaldıraç limitleri
- Backtest köprüsü: /api/backtest/run endpoint
- Private API iskeleti: @spark/exchange-private package
- Paper broker güncellemeleri: Fee entegrasyonu, PnL hesaplamaları

## v0.2.0 - 2025-08-15
- Paper Trading MVP (broker/routes/ui/metrics)
- Exchange toggle mock↔binance, real smoke scripts
- RSI strategy entegrasyonu
- Mock feed simülasyonu
- Prometheus metrikleri (spark_paper_*)
- UI: Control, Portföy, Gözlem sayfaları güncellendi

## v0.1.0 - 2025-08-08
- Initial release
- Basic trading platform structure
- Next.js 14 frontend
- Express.js backend
- Monorepo architecture 