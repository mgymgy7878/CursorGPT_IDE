# PR-6: Matriks IQ P0 Özellikleri — Chart Trading + Session Widget + Alert Presets

**Tarih:** 29 Ekim 2025
**Kapsam:** P0 — Hemen değer üretenler (UI + akış)
**Kaynak:** [Matriks IQ Yardım — Versiyon 5.4.0](https://iqyardim.matriksdata.com/docs/non-knowledgebase/yenilikler/versiyon-5-4-0)

---

## 📋 Özet

Matriks IQ ekosisteminden ödünç alınan üç kritik özelliğin Spark Trading'e entegrasyonu:

1. **Chart Trading Panel** — Market sayfasına tek tık emir paneli
2. **Seans-içi Analiz Widget** — Dashboard mini modülü
3. **Alert → Emir Dönüştürme + Şablonlar** — Alerts sayfasına kaydet/yükle

---

## 🎯 Özellik Detayları

### 1. Chart Trading Panel

**Hedef:** Market sayfasında grafik üzerinden tek tıkla emir verme

**Özellikler:**
- ✅ Floating panel (sağ üstte "Al/Sat" butonları)
- ✅ Fiyat skalasından sürükle-bırak ile limit fiyat belirleme
- ✅ Yapışkan (dock) emir paneli
- ✅ TP/SL preset'leri (±1/2/3/5%)
- ✅ Market/Limit emir türleri
- ✅ WebSocket state'e göre "Çevrimiçi/Çevrimdışı" rozet

**Teknik:**
```typescript
Component: ChartTradingPanel (floating) + OrderDock (sticky)
Location: apps/web-next/src/components/market/ChartTrading.tsx (mevcut)
Integration: apps/web-next/src/app/market/page.tsx (Market sayfasına ekle)
```

**API Endpoints:**
```
POST /api/orders/place     → Place order
GET  /api/orders/history   → Order history
POST /api/orders/cancel    → Cancel order
```

---

### 2. Seans-içi Analiz Widget

**Hedef:** Dashboard'a kompakt seans istatistikleri

**Özellikler:**
- ✅ Seçili zaman aralığında gerçekleşen hacim
- ✅ Yüzdelik değişim
- ✅ Kurum bazlı önemli net işlemler
- ✅ Canlı/pasif mod
- ✅ 2-3 kartlık kompakt versiyon

**Veri Akışı:**
```typescript
SSE Stream: /api/public/market/session-stats (5s interval)
State: Zustand marketStore.sessionStats
Widget: SessionStatsWidget (apps/web-next/src/components/dashboard/)
```

**Metrikler:**
```typescript
type SessionStats = {
  volume24h: number;
  volumeDeltaPercent: number;
  largestTransaction: {
    symbol: string;
    volume: number;
    side: 'buy' | 'sell';
  };
  totalTrades: number;
  activeTraders: number;
  lastUpdate: number;
};
```

---

### 3. Alert → Emir Dönüştürme + Şablonlar

**Hedef:** Alert yönetimi ve hızlı emir dönüşümü

**Özellikler:**
- ✅ "Şablon Kaydet" — Mevcut alert'i şablon olarak kaydet
- ✅ "Şablon Yükle" — Kaydedilmiş şablonu yükle
- ✅ "Emre Dönüştür" — Alert'i manuel emir olarak yürüt
- ✅ Preset'ler: "BTCUSDT 1h BB Breakout", "ETHUSDT 4h MA Crossover", vs.

**Veri Modeli:**
```typescript
// Firestore/DB collection: alerts_presets
type AlertPreset = {
  id: string;
  name: string;
  description: string;
  alertConfig: {
    symbol: string;
    timeframe: string;
    type: string;
    params: Record<string, any>;
  };
  orderConfig?: {
    side: 'buy' | 'sell';
    quantity: number;
    orderType: 'market' | 'limit';
    tp?: number;
    sl?: number;
  };
  userId: string;
  createdAt: number;
  lastUsedAt?: number;
};
```

**UI Eklemeleri:**
```
apps/web-next/src/app/alerts/page.tsx:
- + "Şablon Kaydet" butonu (alert detayında)
- + "Şablonlar" sekmesi
- + "Emre Dönüştür" butonu (sağ tarafta context menu)
```

---

## 📂 Dosya Yapısı

### Yeni Component'ler

```
apps/web-next/src/components/
├── market/
│   └── ChartTrading.tsx (mevcut — iyileştirilecek)
│   └── ChartTradingDock.tsx (yeni — sticky panel)
│   └── OrderQuickActions.tsx (yeni — TP/SL presets)
├── dashboard/
│   └── SessionStatsWidget.tsx (yeni — seans istatistikleri)
│   └── SessionStatsCard.tsx (yeni — tek kart)
└── alerts/
    └── AlertPresetManager.tsx (yeni — şablon yönetimi)
    └── AlertToOrderModal.tsx (yeni — emir dönüştürme)
```

### API Endpoints

```
apps/web-next/src/app/api/
├── market/
│   └── session-stats/route.ts (yeni — SSE stream)
├── alerts/
│   └── presets/route.ts (yeni — CRUD)
│   └── convert-to-order/route.ts (yeni — dönüştürme)
└── orders/
    ├── place/route.ts (yeni — emir verme)
    └── list/route.ts (yeni — emir geçmişi)
```

---

## 🔧 Implementation Adımları

### Phase 1: Chart Trading (2 saat)

1. **ChartTrading.tsx iyileştirme**
   - [ ] Dock mode ekle (sticky/fixed position)
   - [ ] TP/SL preset butonları (ChartTrading içinde mevcut)
   - [ ] WebSocket online/offline badge
   - [ ] Quantity calculator (% of portfolio)

2. **API Integration**
   - [ ] `/api/orders/place` endpoint oluştur
   - [ ] WebSocket state hook (`useWsHeartbeat`)
   - [ ] Order confirmation toast

3. **Market sayfası entegrasyonu**
   - [ ] ChartTrading dock ekle (floating sağ alt)
   - [ ] Symbol seçimi (dropdown)
   - [ ] Real-time price feed

### Phase 2: Session Stats Widget (1.5 saat)

1. **SSE Stream**
   - [ ] `/api/market/session-stats` endpoint (SSE)
   - [ ] Zustand store eklentisi (`sessionStats` state)
   - [ ] Auto-reconnect logic

2. **Widget Component**
   - [ ] SessionStatsCard (3 kart: Hacim, Değişim, Net İşlem)
   - [ ] Live/passive mode toggle
   - [ ] Compact view option

3. **Dashboard entegrasyonu**
   - [ ] SessionStatsWidget ekle (üst kart satırı)
   - [ ] Position: SummaryStrip'in altında

### Phase 3: Alert Presets (1.5 saat)

1. **Veri Modeli**
   - [ ] AlertPreset TypeScript type
   - [ ] Firestore collection (veya Redis Hash)
   - [ ] Migration script (gerekirse)

2. **UI Component'leri**
   - [ ] AlertPresetManager (CRUD modal)
   - [ ] Preset selector (dropdown)
   - [ ] AlertToOrderModal (convert modal)

3. **Alerts sayfası güncelleme**
   - [ ] "Şablon Kaydet" action button
   - [ ] "Presets" sekmesi
   - [ ] "Emre Dönüştür" context menu

---

## 🧪 Test Planı

### Manual Tests

- [ ] Chart Trading: Tek tık emir verme (market/limit)
- [ ] Chart Trading: TP/SL preset'leri (±2%, ±5%)
- [ ] Session Widget: SSE stream (5s güncelleme)
- [ ] Alert Presets: Şablon kaydet/yükle
- [ ] Alert → Order: Emir dönüştürme modal

### Smoke Tests

```bash
# Market sayfası erişilebilirliği
curl http://localhost:3003/market

# Session stats SSE endpoint
curl -N http://localhost:3003/api/market/session-stats

# Alert presets CRUD
curl -X POST http://localhost:3003/api/alerts/presets -d '{...}'
```

---

## 📊 Metrikler

**Beklenen Çıktılar:**
- Emir verme süresi: 10 saniye → 3 saniye (70% azalma)
- Alert → Emir dönüşümü: 6 adım → 1 adım (85% azalma)
- Dashboard KPI görünürlüğü: %100 (seans widget ile)

---

## 🔗 İlgili Dokümanlar

- [Matriks IQ Yardım — Versiyon 5.4.0](https://iqyardim.matriksdata.com/docs/non-knowledgebase/yenilikler/versiyon-5-4-0)
- PR-5 Summary: `PR_5_ULTRA_FINAL_SUMMARY.md`
- Next: PR-7 (Layout Presets + PWA)

---

**Status:** 🟡 IN PROGRESS
**Branch:** feat/pr6-matriks-p0-features
**ETA:** ~5 saat

