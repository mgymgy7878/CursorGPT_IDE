# Spark Trading Platform — Roadmap (Kuşbakışı)

> Referans: Detaylı proje yol haritası ve UI gereksinimleri için bkz. `docs/roadmap/PROJE_YOL_HARITASI_2025-09-09.md`

> Not (2025-09-14): UI v2.2 confirm gate & UDS kabul/rollout tamamlandı (flag: `NEXT_PUBLIC_UI_FUTURES_V22`). Kanıtlar: `docs/evidence/dev/v2.2-ui/`.

## Sonraki 2 Hafta — Mini Plan (v2.1 hazırlık)

- Shadow A/B istatistikleri: ROC/PR Δ, KS, lift (Kabul: KSΔ ≥ 0.05, PR‑AUCΔ ≥ 0.02)
- Guarded auto‑retrain→promote (onay kapısı + audit) (Kabul: promote öncesi 2‑adımlı onay ve audit entry’leri)
- Online cache rehydrate (Redis/PG persist) (Kabul: restart sonrası cache miss oranı < %5 ilk 5 dk)
- Risk report nightly delta ve alarm (Kabul: ZIP artefact + delta diff Slack/Webhook)

## Şematik Akış (Mevcut Mimari)

```
Streams (WS/REST) ──► Stream-Bus ──► Anomaly/Outage + Archive
                                │
                                ├─► Replay ─► CandleCache ─► Backtest Engine
                                │                              │
                                │                              ├─► Experiments + ReportManifest
                                │                              └─► Optimizer / Walk-Forward
                                │
                                └─► Feature Store (Fusion) ─► Train (ModelRegistry)
                                                          └─► Online Predict (cache+rate)
                                                                     │
                                                                     ├─► Shadow A/B (candidate logs)
                                                                     ├─► Guardrails Gate (MODEL_RISK_HIGH)
                                                                     └─► Risk Reports / Advisor
```

## Tamamlanan Aşamalar

- v1.3 — Backtest & Guardrails Gate: server-run/sweep, PG kalıcılık (fallback db-lite), zorunlu gate + audit
- v1.4 — Backtest Engine & Historical: çoklu kaynak historical, inv‑vol/max‑Sharpe/ERC/min‑var optimizasyon, rapor (HTML/CSV/PDF+manifest), reproduce
- v1.5 — Streams & Observability: WS ingest, SSE, outage/anomaly, replay→candle cache, walk‑forward, KPI↔autothrottle
- v2.0 — ML Signal Fusion (GA): feature store + offline/online, ModelRegistry (promote/threshold), online cache+rate‑limit, shadow A/B, drift/freshness + retrain.suggest (AUTO ops), risk raporları; proxy/allowlist & env bootstrap; HEALTH=GREEN

## Mevcut Durum (GA v2.0 Canlı)

- Web (3003) / Executor (4001) health 200; proxy→metrics (GET) çalışıyor
- Fusion uçları: retrain.suggest, risk.report.daily ZIP; 429 retry‑after + retryAfterMs body
- Health route tek yerde; App Router revalidate doğru (dynamic='force-dynamic' + revalidate=0)
- WS/Lab/Guardrails opsiyonel kayıt (dev’de crash yok); ENV bootstrap ve evidence dizinleri otomatik

## Milestone Tracker

| Version | Scope (highlights)                             | Owner  | Status  |      Start |     Target | Success metric(s)                 | Gate flags       | Risks               |
| ------: | ---------------------------------------------- | ------ | ------- | ---------: | ---------: | --------------------------------- | ---------------- | ------------------- |
|    v2.1 | Shadow A/B analytics, guarded auto‑retrain     | A. Dev | Planned | 2025‑09‑02 | 2025‑09‑16 | KSΔ≥0.05, PR‑AUCΔ≥0.02            | Gate pilot (10%) | PSI false positives |
|    v2.2 | Risk‑aware portfolio & execution               | B. Dev | Backlog |          – |          – | Live PnL sim gap < 5% vs baseline | –                | Cost model drift    |
|    v2.3 | Online drift detectors, HA/DR, security harden | C. Dev | Backlog |          – |          – | 99.9% uptime, RTO<5m, RPO<1m      | –                | Ops complexity      |

## Yol Haritası (Önerilen)

### v2.1 — Shadow & Risk Otomasyon

- Shadow A/B istatistikleri: ROC/PR Δ, KS, lift; dashboard “ModelABChip” ayrıntıları
- Guarded auto‑retrain→promote (onay kapısı + audit)
- Redis/PG persist ile online cache rehydrate (multi‑instance)
- Per‑symbol risk yönetişimi; canary‑aware rate control
- Nightly risk.report delta karşılaştırma + uyarı webhook’ları
- Promote→guardrails policy patch onayı (UI akışı)

### v2.2 — Portföy & Gerçekçi Yürütme

- Çoklu strateji/çoklu sembol risk‑aware portföy yürütme
- Borsa‑spesifik cost/tick/lot ve latency‑aware sim iyileştirmeleri
- Feature freshness SLO’ları ve Advisor önerileriyle sıkı entegrasyon

### v2.3 — ML Fusion İleri Seviye

- Ensemble/stacking, kalibrasyon izleme; çevrimiçi drift dedektörleri
- Ölçeklenebilirlik (autoscaling), DR/HA, güvenlik sertleşmesi, kapsamlı audit

## Release Checklist (Prod)

- [ ] PG migrate: `pnpm --filter @spark/db-pg build && pnpm --filter @spark/db-pg migrate`
- [ ] ENV kalıcı: `EXECUTOR_BASE`, `FUSION_ONLINE_CACHE_SNAPSHOT`, `RISK_REPORT_DIR`
- [ ] Build: `pnpm -w install && pnpm -w build`
- [ ] Executor start (prod): `node services/executor/dist/index.js`
- [ ] Web start (prod): `pnpm --filter apps/web-next start -- --port 3003`
- [ ] Smoke:
  - [ ] GET /healthz (web & executor)
  - [ ] GET /api/public/metrics (# HELP)
  - [ ] POST /api/public/canary/stats {}
  - [ ] POST /api/public/fusion/risk.report.daily {} → ZIP > 0B
- [ ] Artefact: risk report ZIP + manifest upload
- [ ] (Ops) Gate pilot: `FUSION_GATE_ENABLE=1` (kademeli yüzde)
- [ ] Rollback plan not edildi (tag + env geri al)

## SLO & Eşikler

| Alan                       | Değer       | Not                       |
| -------------------------- | ----------- | ------------------------- |
| OUTAGE_SLO_P95_LAG_MS      | 2500 ms     | SLO uyarı eşiği           |
| OUTAGE_SLO_RED_GAP_PCT     | 1 %         | Kırmızı gap yüzdesi       |
| FUSION_FRESHNESS_SLO_SEC   | 900 s       | Özellik tazelik SLO       |
| FUSION_DRIFT_PSI_WARN/CRIT | 0.20 / 0.35 | Popülasyon değişimi eşiği |
| FUSION_ONLINE_PREDICT_RPS  | 10          | Token‑bucket oranı        |
| FUSION_ONLINE_CACHE_TTL_MS | 60000 ms    | Online cache TTL          |

## Hızlı Smoke (Windows PowerShell)

```powershell
# Web & Executor health
iwr -UseBasicParsing http://127.0.0.1:3003/api/public/healthz
iwr -UseBasicParsing http://127.0.0.1:4001/healthz

# Metrics (GET)
(iwr -UseBasicParsing http://127.0.0.1:3003/api/public/metrics).Content | Select-String "# HELP"

# Canary stats
(iwr -UseBasicParsing -Method Post http://127.0.0.1:3003/api/public/canary/stats -ContentType 'application/json' -Body '{}').Content

# Retrain suggest
(iwr -UseBasicParsing -Method Post http://127.0.0.1:3003/api/public/fusion/retrain.suggest -ContentType 'application/json' -Body '{}').Content

# Risk report ZIP
iwr -UseBasicParsing -Method Post http://127.0.0.1:3003/api/public/fusion/risk.report.daily -ContentType 'application/json' -Body '{}' -OutFile .\report.zip
```

> Not: POST /metrics 405 beklenen; GET kullanın. ZIP/JSON POST uçlarında `-ContentType 'application/json' -Body '{}'` güvenli pratik olarak tercih edilmelidir.

## Hemen Yapılabilir TODO (Kısa Liste)

- PG migrate (prod): FusionShadowLog & RiskReportManifest tablolarını uygula ve doğrula
- ENV kalıcı: EXECUTOR_BASE, FUSION_ONLINE_CACHE_SNAPSHOT, RISK_REPORT_DIR prod ortamlarında sabitle
- CI job’ları: nightly risk.report.daily artefact yükleme + delta alarmı; stream‑smoke
- Dashboard cilası: Risk Pipeline kısayolu; ModelRisk/ModelAB tooltip; featuresHash mismatch etiketi
- Gate pilotu (opsiyonel): FUSION_GATE_ENABLE=1 → audit & Advisor geri besleme ile sınırlı rollout
