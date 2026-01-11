# RightRail Telemetry Pipeline - Epic Result

**Durum:** ✅ DONE
**Tarih:** 2025-12-10
**Epic:** RightRail Telemetry Pipeline

---

## Özet

RightRail Telemetry Pipeline epik'i tamamlandı. UI'dan Copilot'a kadar tam bir telemetri hattı kuruldu. Mock data ile çalışıyor, gerçek veri entegrasyonu için hazır.

---

## Tamamlanan Katmanlar

### 1. UI & Data Pipeline ✅

**Bileşenler:**
- `PageShell` - Dashboard dışı sayfalar için tutarlı layout
- `RightRail` - Sağ panel bileşeni (3 panel + Copilot)
  - `RightRailTopRisks` - Top Riskler paneli
  - `RightRailSystemStatus` - Sistem Durumu paneli
  - `RightRailExchangeHealth` - Borsa Sağlığı paneli
- `useRightRailData` - Data provider hook

**Veri Akışı:**
```
UI (RightRail)
  ↓
useRightRailData Hook
  ↓
GET /api/right-rail (Aggregator)
  ↓
fan-out: Promise.all([
  GET /api/system/status,
  GET /api/portfolio/risk-summary,
  GET /api/exchanges/health
])
  ↓
RightRailSnapshotDto
  ↓
GET /api/right-rail/summary
  ↓
RightRailSummaryDto (riskScore, regime, summary, bullets)
  ↓
Copilot Risk Brain (hazır)
```

**Özellikler:**
- Theme/tokens uyumlu
- Loading/error state yönetimi
- Degrade mod: Başarısız endpoint'ler için mock fallback
- Timeout desteği (5 saniye)

---

### 2. Sözleşme & Tip Katmanı ✅

**DTO Tanımları:**
- `packages/@spark/types/src/right-rail.ts`
  - `TopRisksDto`
  - `SystemStatusDto`
  - `ExchangeHealthDto`
  - `RightRailSnapshotDto`
  - `RightRailSummaryDto`
  - `Regime` type

**UI Alias'ları:**
- `apps/web-next/src/components/right-rail/types.ts`
  - Geçici DTO tanımları (paket build edilene kadar)
  - Alias'lar: `TopRisksData`, `SystemStatusData`, `ExchangeHealthData`

**Geçiş Planı:**
- `@spark/types` paketi build edildikten sonra:
  1. Geçici DTO tanımlarını kaldır
  2. `import { TopRisksDto, ... } from '@spark/types/right-rail'` aktif et
  3. Sadece alias'ları bırak

**Avantajlar:**
- UI ve backend aynı tip kaynağını kullanıyor
- Executor/portföy servisindeki refactor'ları kolaylaştırıyor
- "UI başka tip, backend başka tip" problemi çözüldü

---

### 3. Endpoint Katmanı ✅

**5 Endpoint:**

1. **GET /api/system/status**
   - Response: `SystemStatusDto`
   - Şimdilik: Mock data
   - Gerçek: Executor health + Prometheus P95 latency + WS/API up/down

2. **GET /api/portfolio/risk-summary**
   - Response: `TopRisksDto`
   - Şimdilik: Mock data
   - Gerçek: Portföy servisinden en riskli strateji, max DD, konsantrasyon

3. **GET /api/exchanges/health**
   - Response: `ExchangeHealthDto`
   - Şimdilik: Mock data
   - Gerçek: Connector servislerinden Binance/BTCTurk/BIST latency + rate limit

4. **GET /api/right-rail** (Aggregator)
   - Response: `RightRailSnapshotDto`
   - `Promise.all` ile 3 endpoint'ten veri toplama
   - Timeout: 5 saniye
   - Degrade mod: Başarısız endpoint'ler için mock fallback

5. **GET /api/right-rail/summary**
   - Response: `RightRailSummaryDto`
   - Deterministik risk skoru hesaplama (0-100)
   - Regime belirleme (normal/caution/stress/panic)
   - Özet metin ve bullet'lar oluşturma
   - Copilot için tek giriş noktası

---

### 4. Doküman & Test ✅

**Dokümanlar:**
- `docs/RIGHT_RAIL_ENDPOINTS_SMOKE_TEST.md`
  - 5 endpoint için beklenen response formatları
  - Test komutları (curl)
  - DTO uyumluluk kontrolü

- `docs/RIGHT_RAIL_REAL_DATA_INTEGRATION_PLAN.md`
  - Her endpoint için gerçek kaynak planı
  - Implementation örnekleri
  - Degrade mod stratejisi
  - Copilot entegrasyonu planı

**Sertifikasyon:**
- TypeScript: 0 hata
- Linter: Yeni dosyalarda 0 hata
- Tüm endpoint'ler DTO kontratlarına uyumlu
- Mock data ile test edildi

---

## Mimari Özellikler

### Degrade Mod
- Timeout: 5 saniye
- Partial Failure: Bir endpoint başarısız olursa diğerleri döndürülür
- Mock Fallback: Tüm endpoint'ler başarısız olursa mock data döndürülür
- UI her zaman çalışır, sadece veri kalitesi düşer

### Risk Skoru Hesaplama
- Drawdown riski: 0-30 puan
- Sistem durumu: 0-25 puan
- Evidence Balance: 0-20 puan
- Borsa sağlığı: 0-15 puan
- Haber etkisi: 0-10 puan
- Toplam: 0-100 (düşük = iyi, yüksek = riskli)

### Regime Bantları
- 0-39: `normal`
- 40-59: `caution`
- 60-79: `stress`
- 80-100: `panic`

---

## Sonraki 2 Sprint

### Sprint 1 – Backend Telemetry (Real Data Wiring)
<!-- TODO: Task board / issue link ekle: [Sprint 1 - Backend Telemetry](#) -->

**Amaç:** Mock'ları kaldırıp gerçek Spark metriklerine bağlanmak

**Adımlar:**
1. `@spark/types` build → web-next'te geçici DTO'ları kaldır
2. 3 alt endpoint'i gerçek metrik kaynaklarına bağla:
   - `/api/system/status` → Executor + Prometheus
   - `/api/portfolio/risk-summary` → Portföy servisi
   - `/api/exchanges/health` → Connector servisleri
3. `/api/right-rail` aggregator'ı gerçek veri + degrade fallback ile smoke-test et

**Sonuç:** Sağ ray tamamen canlı Spark metrikleri ile beslenecek

---

### Sprint 2 – Copilot Risk Brain v1
<!-- TODO: Task board / issue link ekle: [Sprint 2 - Copilot Risk Brain v1](#) -->

**Amaç:** Copilot'u "telemetry'ye bakan risk şefi" yapmak

**Adımlar:**
1. Copilot'un tek veri sözleşmesi: `RightRailSnapshotDto` + `RightRailSummaryDto`
2. Deterministik policy tablosu:
   - `regime = normal + riskScore < 40` → "Serbest, yeni strateji açılabilir"
   - `regime = caution` → "Yeni kaldıraçlı strateji açma, mevcutları izlemeye al"
   - `regime = stress` → "Kaldıraçları 1 kademe indir, yeni pozisyon açma"
   - `regime = panic` → "Yeni strateji yok, yüksek riskli pozisyonlar için kapatma önerileri"
3. `POST /api/copilot/risk-advice` endpoint'i
4. RightRail altında mini "Copilot Risk Tavsiyesi" alanı

**Sonuç:** Copilot risk telemetrisine bakarak gerçekten risk-kontrollü strateji kararları üretecek

---

## Dosya Yapısı

```
apps/web-next/src/
├── components/
│   ├── layout/
│   │   ├── PageShell.tsx
│   │   └── RightRail.tsx
│   └── right-rail/
│       ├── types.ts (geçici DTO'lar + alias'lar)
│       ├── mock.ts
│       ├── RightRailTopRisks.tsx
│       ├── RightRailSystemStatus.tsx
│       └── RightRailExchangeHealth.tsx
├── hooks/
│   └── useRightRailData.ts
└── app/api/
    ├── system/status/route.ts
    ├── portfolio/risk-summary/route.ts
    ├── exchanges/health/route.ts
    ├── right-rail/
    │   ├── route.ts (aggregator)
    │   └── summary/route.ts

packages/@spark/types/src/
├── right-rail.ts (DTO tanımları)
└── index.ts (barrel export)

docs/
├── RIGHT_RAIL_ENDPOINTS_SMOKE_TEST.md
├── RIGHT_RAIL_REAL_DATA_INTEGRATION_PLAN.md
└── RIGHT_RAIL_TELEMETRY_PIPELINE_EPIC_RESULT.md (bu dosya)
```

---

## Stable Zone Notu ⚠️

**RightRail hattı artık "UI/contract stable zone" durumunda.**

Bu katmanda yapılacak değişiklikler **breaking change** kategorisine girer. Yeni epic açılmadan bu katmana dokunulmamalıdır.

**Stable Zone Kapsamı:**
- `RightRail` bileşen yapısı
- `RightRailSnapshotDto` ve `RightRailSummaryDto` kontratları
- `/api/right-rail` ve `/api/right-rail/summary` endpoint'leri
- `useRightRailData` hook API'si

**Değişiklik Süreci:**
1. Yeni epic açılmalı
2. Breaking change impact analizi yapılmalı
3. Migration planı hazırlanmalı
4. Tüm tüketiciler (Copilot, Guardrails, vb.) güncellenmeli

---

## Sonuç

RightRail Telemetry Pipeline epik'i tamamlandı. Bu katman "UI işi" olmaktan çıktı, altyapı katmanına geçti.

**Durum:** Mock'lu ama production-grade architecture seviyesinde

**Sonraki:** Gerçek metrikler + Copilot'un bu telemetriye bakıp gerçekten risk-kontrollü strateji kararları üretmesi

**Bu noktadan sonra:** RightRail "bitmiş altyapı modülü"; asıl eğlenceli kısım başlıyor: gerçek metrikler + Copilot'un bu telemetriye bakıp gerçekten risk-kontrollü strateji kararları üretmesi.

---

## İlgili Dokümanlar

- [UI/UX Talimatları ve Plan](./UI_UX_TALIMATLAR_VE_PLAN.md)
- [PageShell Scroll Patch](./FIGMA_PAGESHELL_SCROLL_PATCH.md)
- [Dev Seed Data Epic](./DEV_SEED_DATA_EPIC.md)
- [RightRail Endpoints Smoke Test](./RIGHT_RAIL_ENDPOINTS_SMOKE_TEST.md)
- [RightRail Real Data Integration Plan](./RIGHT_RAIL_REAL_DATA_INTEGRATION_PLAN.md)

