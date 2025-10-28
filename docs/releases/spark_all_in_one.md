# SPARK Trading Platform — Tek Dosya Konsolide Plan (ALL‑IN‑ONE)

> Bu belge, depodaki tüm plan/dokümanların **tekilleştirilmiş ve çakışmasız** birleştirilmiş sürümüdür. Önce **uçtan uca hedef** ve **mimari çatı**; ardından **UI/UX**, **Backend & Entegrasyon**, **AI Copilot**, **Gözlemlenebilirlik**, **Güvenlik & Uyumluluk**, **Yol Haritası (Sürüm & Sprint)**, **SLO’lar**, **Release Checklist**, **Operasyon Uçları** ve **Ekler** yer alır.
>
> Amaç: ChatGPT + Cursor ile birlikte iki ayrı AI modülünün (Stratejist/Optimizasyon ve Yürütme) piyasayı okuyup **hangi stratejilerin ne zaman çalışacağına** karar vermesi ve risk kontrollü uygulaması.

---

## 1) Yürütücü Özet

- **Hedef**: AI destekli, çoklu borsa entegrasyonlu, strateji üreten ve risk kontrollü çalıştıran trading platformu.
- **Kapsam**: Kripto (Binance, BTCTurk), BIST vadeli/hisse, FX/parite, emtia.
- **Çekirdek**: Monorepo (pnpm), TypeScript strict, Next.js 14 UI, Node.js executor, PM2 cluster.
- **Durum**: HEALTH=GREEN; temel rotalar ve metrik/health uçları çalışır; Strategy Lab → Backtest → Çalıştır akışı mevcut.
- **Öncelikler**: Real Canary Test, BTCTurk Spot, BIST feed, Backtest engine, Copilot guardrails, Portföy risk.

---

## 2) Mimari Şema (Kuşbakışı)

**Paketler**: `execution`, `copilot`, `marketdata`, `arbitrage`, `optimization`, `backtest`, `ml`  
**Uygulamalar**: `apps/web-next` (Next.js 14), `mobile` (gelecek)  
**Servisler**: `executor`, `analytics`, `ml-engine`  
**DB**: PostgreSQL + Prisma (zaman serisi index), exchange bazlı partitioning  
**Güvenlik**: RBAC, allowlist, TLS+Nginx, rate limit, audit log  
**Gözlem**: Prometheus + Grafana; health/metrics uçları  

Akış (özet):  
Streams (WS/REST) → Stream‑Bus → Archive/Anomaly  
↳ Replay → CandleCache → Backtest Engine (experiments, optimizer)  
↳ Feature Store (Fusion) → Train/Registry → Online Predict (cache+rate)  
↳ Shadow A/B, Guardrails Gate, Risk Reports/Advisor

---

## 3) Ana Özellikler

1. **Strateji Yönetimi**: Strateji oluşturma, kategori bazlı listeleme, başlat/durdur/duraklat, performans özetleri.  
2. **Gerçek Zamanlı Veri**: Çoklu borsadan canlı fiyat/derinlik; anlık P/L ve açık pozisyonlar.  
3. **Portföy & Performans**: Borsa hesabı özetleri, pozisyonlar, P/L; strateji bazlı metrikler.  
4. **Backtest & Optimizasyon**: Lab’dan geçmiş veride test; metrikler (CAGR, Sharpe, maxDD, win‑rate); param sweep.  
5. **AI Copilot**: Kod üret/iyileştir, hata analizi; “kodu editöre ekle” onay akışı; guardrails.  
6. **Otomasyon/Tetikleyiciler**: Koşula bağlı auto start/stop (aşama 2).  
7. **Observability**: Prometheus sayaçları, latency histogramları; Grafana panoları ve uygulama içi özet.  

---

## 4) UI/UX Gereksinimleri

**Global Shell**: Sol kalıcı sidebar, üst durum çubuğu, sağda **sabit AI Copilot** paneli (dar ekranda gizlenebilir). 1080p’de kritik paneller **kaydırmasız** görünür.

**Sayfalar**:
- **Ana Sayfa (Dashboard)**: Canlı Piyasa Verileri • Çalışan Stratejiler • Portföy Özeti.  
- **Strateji Lab**: Monaco Editor (dinamik import), toolbar (Kaydet/Backtest/Optimize), sonuç paneli (getiri eğrisi + metrikler), Copilot entegrasyonu ve “kodu ekle” butonu.  
- **Stratejilerim**: Kategori bazlı liste; eylemler (Çalıştır/Durdur/Duraklat/Backtest/Optimize/Düzenle/Sil).  
- **Çalışan Stratejiler**: Canlı durum, işlem sayısı, anlık P/L, mini sparkline; durdur/duraklat/continue butonları.  
- **Portföy**: Borsa sekmeleri, varlık tablosu (Miktar/Fiyat/Değer/%), strateji bazlı P&L; elle yenile + periyodik yenile; fiyat WS ile anlık değer güncelleme.  
- **Ayarlar**: Tema/dil; AI ve borsa API anahtarları; bağlantı testi; form doğrulamaları ve toast bildirimleri.

**Performans**: Dinamik import; minimal re-render; WS reconnect/backoff.  
**Erişilebilirlik**: Yüksek kontrast, ARIA, klavye navigasyonu; TR/EN altyapısı.  

---

## 5) Backend & Entegrasyon

- **Borsa API** (öncelik: Binance; hedef: BTCTurk, BIST): fiyat, bakiye/pozisyon, emir gönderimi; imzalama & timestamp.
- **Gerçek Zamanlı**: `executor` WS kanalları (`marketData`, `strategyUpdates`); frontend’de abone ol/yeniden bağlan.
- **Strateji Motoru**: `/api/exec/start`, `/api/exec/stop` (+pause/resume desteği mümkün); risk guardları (maxNotional/drawdown).  
- **Backtest/Optimize**: `/api/exec/backtest`, `/api/exec/optimize` (ilk aşamada senkron, gerekirse job‑queue).  
- **Depolama**: Kısa vadede localStorage; orta vadede Postgres (strateji tanımı, backtest sonuçları, işlem geçmişi).  
- **Metrikler**: placed_total, fills_total, error_total, latency P50/P95; exchange API latency; WS drop/reconnect sayaçları.  

---

## 6) AI Copilot & ML Katmanı

- **Roller**: Stratejist (LLM) • Analist (haber/sinyal) • Trader (RL) — uzun vadede füzyon.  
- **Kısa Vade**: LLM ile strateji şablonları, kod üretimi/iyileştirme; param önerisi; risk uyarıları.  
- **Guardrails**: Prompt politikaları, kod “önce göster‑sonra uygula”, oran/kota limitleri, maliyet görünürlüğü.  
- **Shadow A/B**: Aday model günlük; ROC/PR Δ, KS; gate öncesi pilot.  

---

## 7) Güvenlik, RBAC & Uyumluluk

- **RBAC**: İşlem yetkileri; kritik eylemlerde onay (confirm_required).  
- **Sır Yönetimi**: AI ve borsa anahtarları; kısa vadede client storage (uyarı), orta vadede server‑side şifreleme.  
- **Ağ & Uçlar**: TLS+Nginx, CORS, rate limit, allowlist, audit log; kill switch & circuit breaker.  
- **Uyumluluk**: KVKK/AML; SPK/BIST PTRM risk kontrolleri (max order size, rate limit); log arşivi ve denetim izi.  

---

## 8) Observability

- **Prometheus**: sayaçlar, histogramlar; **/api/public/metrics**.  
- **Grafana**: canlı panolar (aktif strateji sayısı, P&L, API latency).  
- **Uygulama İçi**: Gözlem sayfası; bağlantı durumu, WS lag, hata oranı, cache hit.  

---

## 9) Yol Haritası & Sprint Planı

### Sürüm Zaman Çizelgesi
- **v1.1 (24–48h)**: Real Canary Evidence  
- **v1.2 (2 hafta)**: BTCTurk Spot + BIST Reader  
- **v1.3 (2 hafta)**: Copilot Guardrails + Optimization Lab  
- **v1.4 (2 hafta)**: Historical & Backtest Engine  
- **v1.5 (1 hafta)**: Streams & Observability  
- **v2.0 (3 ay)**: ML Signal Fusion  
- **v2.1 (6 ay)**: Enterprise Features

### 10 Günlük Sprint (v1.x temel)
1) Layout & Ana sayfa iskelet; sabit Copilot; 3 panel (dummy).  
2) Ana sayfa veri bağlama; çalışan stratejiler store; portföy özeti.  
3) Strateji Lab UI; Monaco; toolbar; sonuç paneli placeholder.  
4) Copilot gerçek entegrasyon; “kodu editöre ekle”.  
5) Backtest entegrasyonu; grafik & metrikler; basit optimize formu.  
6) Stratejilerim: persist, kategorileme, eylem butonları; Lab’a yönlendirme.  
7) Çalışan Stratejiler: WS güncelleme, sparkline, durdur/duraklat.  
8) Portföy: bakiye/varlık tablosu; fiyat×miktar; periyodik/WS güncelleme.  
9) Ayarlar & UX cilası; anahtar testleri; toast; boş/yüklenme/hata.  
10) E2E test & stabilizasyon; performans gözden geçirme; dokümantasyon.

---

## 10) SLO’lar & Eşikler

- Place→ACK **P95 < 1000ms**; Event→DB **P95 < 300ms**.  
- OUTAGE_SLO_P95_LAG_MS: 2500  
- FUSION_FRESHNESS_SLO_SEC: 900  
- FUSION_DRIFT_PSI_WARN/CRIT: 0.20 / 0.35  
- FUSION_ONLINE_PREDICT_RPS: 10; CACHE_TTL_MS: 60.000

---

## 11) Release Checklist (Prod)

- **PG migrate**: `pnpm --filter @spark/db-pg build && pnpm --filter @spark/db-pg migrate`  
- **ENV**: `EXECUTOR_BASE`, `FUSION_ONLINE_CACHE_SNAPSHOT`, `RISK_REPORT_DIR`  
- **Build**: `pnpm -w install && pnpm -w build`  
- **Start**: executor (4001), web‑next (3003)  
- **Smoke**:
  - GET `/healthz` (web & executor)  
  - GET `/api/public/metrics` (# HELP)  
  - POST `/api/public/canary/stats {}`  
  - POST `/api/public/fusion/risk.report.daily {}` → ZIP > 0B  
- **Artefact**: risk report ZIP + manifest  
- **Gate Pilot**: `FUSION_GATE_ENABLE=1` (kademeli)  
- **Rollback**: tag + env geri al planı

---

## 12) Operasyon Uçları (Örnek)

- `/tools/get_status` — health, p95, drift, freshness, open orders  
- `/tools/get_metrics` — Prometheus proxy (GET)  
- `/tools/get_orders`, `/tools/get_positions` — açık emir/pozisyon  
- `/fusion/risk.report.daily` — ZIP rapor (CSV+PDF+manifest)  
- `/fusion/retrain.suggest` — öneriler + artefakt  
- `/advisor/suggest` — birleşik öneri (drift/outage/model)  
- `/canary/run` — **dry‑run**; `/canary/confirm` — **ONAY GEREKİR**  
- `/model/promote` — **ONAY GEREKİR**  
- `/risk/threshold.set` — **ONAY GEREKİR**  
- `/alerts/create` — fiyat/metric alert (auto OK)

---

## 13) Riskler & Önlemler

- **UI karmaşıklığı**: grid/flex guardrails; görsel tur; görsel regresyon.  
- **API limit/kalite**: net hata mesajları; mock/paper trading; retry/backoff.  
- **AI hataları/maliyet**: rate limit; içerik filtreleri; onay akışı; kota görünürlüğü.  
- **Güvenlik**: anahtar sızıntısı; sandbox/quotas; audit & kill switch.

---

## 14) Ekler

- **Terimler**: CAGR, Sharpe, maxDD, win‑rate, profit factor, Sortino.  
- **Not**: BTCTurk ve BIST için veri lisansı ve düzenleyici (SPK/BIST PTRM) gereksinimleri izlenmelidir.  

---

### Bu belgenin depo yolu (öneri)
`docs/SPARK_ALL_IN_ONE.md`

### Bu belgenin amacı
- Tüm dağınık plan/dokümanların tekilleştirilmiş **tek kaynak** referansı olmak.  
- README ve Roadmap’in üst seviye özetleri bu dosyaya referans verecek.

---

## 15) Operasyon Protokolü — **Verbose+Final** (Raporlama Standardı)

**Amaç:** Ara ilerleme loglarını görünür kılmak; iletinin sonunda tek ve düzenli **SUMMARY** blok zorunluluğunu korumak.

**Ara Log Formatı**  
`[LOG] <ISO8601> step=<adı> msg=<kısa>`  
`[WARN] <ISO8601> step=<adı> msg=<uyarı>`  
`[ERROR] <ISO8601> step=<adı> msg=<hata> hint=<çözüm>`  
`[CMD] <çalıştırılan komut>`  
`[OUT] <ilk 5–10 satır> …(truncated)`  
`[EVIDENCE] path=<dosya> note=<kısa not>`

**Redaksiyon:** API anahtarları/token’lar maskelenir; uzun çıktılar kısaltılır (max 200 satır).  
**Final SUMMARY (zorunlu tek blok):** Başlık • Durum • Komutlar • Dosyalar • Smoke • Hatalar/Uyarılar • Kanıt • Sonraki Adımlar.

---

## 16) D1/D2/D3 İterasyonları — Kabul Kriterleri ve Çıktılar

**D1 (v1.3-D1) — Live Market + Lab Backtest/Optimize + Observability**  
- **Dashboard:** 9 sembollü MarketGrid; staleness rozeti (≤3s yeşil, ≤10s sarı, >10s kırmızı; >120s → **SUSPENDED**); **wsReconnectTotal** artışı.  
- **Strategy Lab:** Backtest grafiği + metrik kartları (CAGR, Sharpe, maxDD, winRate, PF); Optimize + toast; **dry‑run** param desteği.  
- **Observability:** `/api/public/metrics`’ten **P95 latency**, **error_rate**, **ws_reconnect_total**, (varsa) **cache_hit_rate**; Skeleton + ErrorBoundary.  
- **Docs/ENV:** `docs/SPARK_ALL_IN_ONE.md` tek referans; `.env.example` ve README güncel.

**D2 (v1.3-D2) — BTCTurk WS (read‑only) + Strategy Pause/Resume + Param‑Diff/Guardrails**  
- **BTCTurk WS:** `NEXT_PUBLIC_WS_BTCTURK` varsa gerçek WS; yoksa mock. Backoff: min=1s, max=20s, ≤6/dk. Kaynak rozeti: **B|T|M**.  
- **Pause/Resume:** UI düğmeleri; executor API (yoksa dry‑run banner); durum rozetleri (paused: sarı, running).  
- **ResultPanel:** Alt sekmeler → **Metrics | Param‑Diff | Guardrails**; guardrail uyarıları (maxDD, minTrades, Sharpe).  
- **Observability:** `ws_reconnect_total` kaynak bazlı ayrıştırma.

**D3 (v1.3-D3) — Param Tuning (mock) + Mini Log‑Tail + Guardrail Telemetri**  
- **Tuning:** Bayes/GA mock; start/status/best params; “Apply to Editor” (dry‑run).  
- **Mini Log‑Tail:** Son 200 satır, regex filter, auto‑scroll/pause.  
- **Guardrail Telemetri:** Son 10 gate kararı (allow/deny/shadow) ve minichart.

---

## 17) D1 AUDIT — Hızlı Doğrulama (Read‑only)

**PASS eşiği:** `files=16/16 ok, missing=0` • `readme=1` • `env=1` • `last_commit` anlamlı (örn. *feat(ui)*…).  
**NO‑GO durumunda:** mini‑fix (staleness/reconnect/metrics NA/README‑ENV) → re‑AUDIT.

---

## 18) Evidence Adlandırma Standardı

- `evidence/ui/marketgrid_staleness_screenshot.png`  
- `evidence/ui/lab_backtest_equity_curve.png`  
- `evidence/ui/observability_p95_panel.png`  
- `evidence/logs/web-next-dev.log`  
- `evidence/metrics/snapshot.txt`

---

## 19) Operasyonel Güvenlik Kilitleri

- **Metrics fetch**: UI timeout=3s, 1 retry; NA fallback.  
- **WS fırtına koruması**: backoff min=1s, max=20s, ≤6/dk.  
- **Dry‑run şeridi**: Executor/WS yoksa görünür.  
- **Kritik eylemler**: confirm_required (trade, model promote, risk threshold, rebalance, vb.).
