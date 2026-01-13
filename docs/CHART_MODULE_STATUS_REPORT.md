# Spark Chart Modülü Durum Raporu

**Tarih:** 2024-12-19
**Kapsam:** Ana trading grafiği (chart) bileşenleri ve teknik analiz modülü

---

## 📊 DURUM: KISMI HAZIR / DAĞINIK / YENİDEN DÜZENLENMELİ

### Özet
Chart modülü **hibrit yapıda** çalışıyor: `lightweight-charts` (TradingView kalitesi) ve `recharts` (ikincil grafikler) birlikte kullanılıyor. Ana price chart bileşeni (`PriceChartLC.tsx`) **tam fonksiyonel** ancak **stub olarak kullanılıyor**. İndikatör panelleri (MACD, Stochastic) **recharts ile çalışıyor** ancak **ayrı paneller** olarak gösteriliyor, **entegre değil**.

---

## 🔍 TARANAN ÖNEMLİ DOSYA YOLLARI

### Ana Chart Bileşenleri
- `apps/web-next/src/components/technical/PriceChartLC.tsx` - **Lightweight Charts** ana candlestick chart (tam fonksiyonel)
- `apps/web-next/src/components/technical/PriceChartLCStub.tsx` - **Stub** (şu an kullanılan)
- `apps/web-next/src/components/technical/PriceChart.tsx` - **DISABLED** (TypeScript build hataları nedeniyle)
- `apps/web-next/src/components/market/ChartTrading.tsx` - **Placeholder** (gerçek chart yok, sadece UI mock)

### İndikatör Panelleri
- `apps/web-next/src/components/technical/MACDPanel.tsx` - MACD indikatörü (Recharts)
- `apps/web-next/src/components/technical/StochPanel.tsx` - Stochastic indikatörü (Recharts)
- `apps/web-next/src/components/technical/MACDPanelStub.tsx` - Stub
- `apps/web-next/src/components/technical/StochPanelStub.tsx` - Stub

### Yardımcı Bileşenler
- `apps/web-next/src/components/market/DepthChart.tsx` - Order book depth chart (Canvas)
- `apps/web-next/src/components/charts/RechartsLine.tsx` - Recharts stub
- `apps/web-next/src/components/ui/LazyChart.tsx` - Lazy loading wrapper

### Type Definitions
- `apps/web-next/src/types/chart.ts` - Merkezi chart type tanımları

### API Endpoints
- `apps/web-next/src/app/api/marketdata/candles/route.ts` - HTTP candle data (Binance API)
- `apps/web-next/src/app/api/marketdata/stream/route.ts` - SSE/WS stream (Binance WebSocket)

### Kullanım Noktaları
- `apps/web-next/src/app/technical-analysis/page.tsx` - Ana teknik analiz sayfası

---

## 📦 DATA VE STATE YAPISI

### Candle Data Modeli
```typescript
type Candle = {
  t: number;  // timestamp (ms)
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}
```

### İndikatör Data Modelleri
- **MACD**: `{ macd: number[], signal: number[], hist: number[] }`
- **Stochastic**: `{ k: number[], d: number[] }`
- **Bollinger Bands**: `{ u: number, m: number, l: number }[]`
- **Fibonacci**: `{ ratio: number, price: number }[]`

### Chart Props ve State
**PriceChartLC.tsx:**
- Props: `candles`, `fibLevels`, `bbSeries`, `symbol`, `timeframe`, `height`
- State: `live` (SSE stream açık/kapalı)
- Refs: `chartRef`, `candleSeriesRef`, `volSeriesRef`, `lastBarTimeRef`

**Technical Analysis Page:**
- State: `symbol`, `tf` (timeframe), `loading`, `showFib`, `showBB`
- Data: `candles`, `fib`, `bb`, `macd`, `stoch`

### Veri Akışı

#### HTTP (Initial Load)
- **Endpoint**: `/api/marketdata/candles?symbol={symbol}&timeframe={tf}&limit=300`
- **Kaynak**: Binance REST API (`/api/v1/klines`)
- **Cache**: 15 saniye in-memory cache
- **Format**: JSON array of candles

#### SSE/WebSocket (Live Updates)
- **Endpoint**: `/api/marketdata/stream?symbol={symbol}&timeframe={tf}`
- **Kaynak**: Binance WebSocket (`wss://stream.binance.com:9443/ws/{symbol}@kline_{interval}`)
- **Format**: Server-Sent Events (SSE)
- **Batch Updates**: 120ms debounce ile batch güncelleme
- **Reconnect**: Otomatik reconnection (backoff: 1.5-5s)

#### İndikatör Hesaplamaları
- **Endpoint**: `/api/copilot/action` (POST)
- **Actions**: `tools/fibonacci_levels`, `tools/bollinger_bands`, `tools/macd`, `tools/stochastic`
- **Format**: JSON request/response

---

## 🎨 UI / ETKİLEŞİM ALANLARI

### Mevcut Paneller

#### 1. Ana Price Chart (PriceChartLC.tsx)
- **Kütüphane**: `lightweight-charts` v5.0.9
- **Özellikler**:
  - ✅ Candlestick series (yeşil/kırmızı)
  - ✅ Volume histogram (secondary scale, %85 top margin)
  - ✅ Bollinger Bands overlay (3 line: upper/middle/lower)
  - ✅ Fibonacci retracement levels (horizontal price lines)
  - ✅ Crosshair (normal mode)
  - ✅ Time scale (right offset, time visible)
  - ✅ Live SSE stream (batch updates)
- **Eksikler**:
  - ❌ Drawing tools (trendline, box, etc.)
  - ❌ Zoom/Pan kontrolleri (sadece native chart zoom)
  - ❌ Toolbar (timeframe switcher, indikatör toggle)
  - ❌ EMA/SMA overlay seçenekleri
  - ❌ Price alerts (chart üzerinde)

#### 2. Volume Panel
- **Durum**: Ana chart içinde **histogram olarak** gösteriliyor
- **Yerleşim**: Secondary price scale (top margin %85)
- **Renk**: Yeşil (up) / Kırmızı (down) with transparency

#### 3. İndikatör Panelleri
- **MACD Panel**: Ayrı panel (160px yükseklik, Recharts)
- **Stochastic Panel**: Ayrı panel (160px yükseklik, Recharts)
- **Durum**: **Ana chart'tan ayrı**, alt alta gösteriliyor
- **Sorun**: **Senkronizasyon yok** (timeframe değişince manuel reload)

#### 4. Depth Chart (Order Book)
- **Kütüphane**: Custom Canvas
- **Özellikler**: Kümülatif bid/ask eğrileri, spread çizgileri
- **Durum**: Mock data (gerçek WS entegrasyonu yok)

### Kullanıcı Etkileşimleri

#### Mevcut
- ✅ Symbol değiştirme (input)
- ✅ Timeframe seçimi (dropdown: 15m, 1h, 4h, 1d)
- ✅ Fibonacci toggle (checkbox)
- ✅ Bollinger Bands toggle (checkbox)
- ✅ Live stream toggle (button)
- ✅ Chart hover/crosshair (native lightweight-charts)
- ✅ Manual data reload (button)

#### Eksik
- ❌ Zoom kontrolleri (UI buttons)
- ❌ Pan (drag to scroll)
- ❌ Drawing tools (trendline, box, horizontal line)
- ❌ Price line annotations
- ❌ Alert creation from chart
- ❌ Replay mode
- ❌ Fullscreen mode
- ❌ Chart template save/load

---

## 🐛 BUG / TEKNİK BORÇ TARAMASI

### Kritik Sorunlar

#### 1. PriceChart.tsx DISABLED
- **Dosya**: `apps/web-next/src/components/technical/PriceChart.tsx`
- **Durum**: "Temporary disabled due to TypeScript build errors in CI"
- **Etki**: Alternatif chart bileşeni kullanılamıyor
- **Çözüm**: TypeScript hatalarını düzelt veya dosyayı kaldır

#### 2. PriceChartLC Stub Kullanılıyor
- **Dosya**: `apps/web-next/src/app/technical-analysis/page.tsx:8`
- **Durum**: `PriceChartLCStub` import ediliyor, gerçek `PriceChartLC` değil
- **Etki**: Chart render edilmiyor, sadece placeholder gösteriliyor
- **Çözüm**: Stub yerine gerçek `PriceChartLC` kullan

#### 3. ChartTrading Placeholder
- **Dosya**: `apps/web-next/src/components/market/ChartTrading.tsx`
- **Durum**: Gerçek chart yok, sadece UI mock (drag price level)
- **Etki**: Trading sayfasında chart görüntülenemiyor
- **Çözüm**: `PriceChartLC` veya başka bir chart bileşeni entegre et

### TODO / FIXME Notları

#### Chart İle İlgili
1. **CopilotDock.tsx:40** - `TODO: SSE/WS entegrasyonu` (chart değil, genel)
2. **MarketMiniGrid.tsx:95** - `TODO: Market store'a volume ekle`
3. **MarketGrid.tsx:77-80** - `TODO: Market store'a volume ekle`, `TODO: Likidite skoru hesapla`, `TODO: Vadeli için OI`, `TODO: Perp için funding`

#### Data Akışı
- **DepthChart.tsx:37** - "Mock data - gerçekte WS'den gelecek"
- **PriceChartLC.tsx:189** - SSE stream kullanılıyor ancak **error handling zayıf**

### Layout / Responsive Sorunları

#### Tespit Edilen
- ❌ Chart yükseklikleri **sabit** (420px, 160px) - responsive değil
- ❌ İndikatör panelleri **alt alta** - grid layout yok
- ❌ Technical analysis sayfasında **scroll** gerekiyor (dense değil)
- ❌ Chart container'ları **overflow** kontrolü yok

### Performans / Teknik Riskler

#### Tespit Edilen
1. **PriceChartLC.tsx:178** - `useEffect` dependency array: `[candles, fibLevels, bbSeries, height]`
   - **Risk**: Her prop değişiminde **full chart re-init** (chart.remove() + createChart())
   - **Etki**: Performans sorunu, flicker
   - **Çözüm**: Series update kullan, full re-init sadece gerektiğinde

2. **PriceChartLC.tsx:34-41** - Chart destroy/recreate pattern
   - **Risk**: Memory leak potansiyeli (ResizeObserver cleanup)
   - **Durum**: Cleanup mevcut ama **race condition** riski var

3. **Technical Analysis Page:22-79** - `loadAll()` fonksiyonu
   - **Risk**: **Sequential API calls** (await chain)
   - **Etki**: Yavaş yükleme (5+ API call sırayla)
   - **Çözüm**: `Promise.all()` ile parallel fetch

4. **API Cache:15s TTL** - Çok kısa, sık cache miss
   - **Etki**: Gereksiz Binance API calls
   - **Çözüm**: TTL'i artır veya client-side cache ekle

---

## 🎯 ÖNERİLEN ŞABLON / HEDEF

### Hedef Yapı: 3 Panelli Entegre Chart

```
┌─────────────────────────────────────────┐
│  Toolbar: [Symbol] [TF] [Indicators]   │
├─────────────────────────────────────────┤
│  Panel 1: Candlestick + EMA/Bollinger   │
│  (Lightweight Charts, 60% height)       │
├─────────────────────────────────────────┤
│  Panel 2: Volume Histogram              │
│  (Lightweight Charts, 20% height)       │
├─────────────────────────────────────────┤
│  Panel 3: RSI / MACD / Stochastic      │
│  (Recharts veya Lightweight, 20%)      │
└─────────────────────────────────────────┘
```

### Şu Anki Kod vs Hedef Farkları

| Özellik | Şu Anki | Hedef |
|---------|---------|-------|
| **Panel Yapısı** | Ayrı paneller (alt alta) | Entegre 3 panel (aynı container) |
| **Senkronizasyon** | Yok (manuel reload) | Otomatik (aynı timeframe) |
| **Volume** | Ana chart içinde histogram | Ayrı panel (20% height) |
| **İndikatörler** | Ayrı Recharts panelleri | Seçilebilir (RSI/MACD/Stoch) |
| **Toolbar** | Sayfa seviyesinde kontroller | Chart toolbar (üstte) |
| **Drawing** | Yok | Trendline, box, horizontal line |
| **Zoom/Pan** | Native (mouse wheel) | UI kontrolleri + native |

### docs/CHART_SPEC.md Önerilen Başlıklar

1. **Genel Bakış**
   - Chart modülü mimarisi
   - Kütüphane seçimi (lightweight-charts vs recharts)
   - Panel yapısı

2. **Data Modeli**
   - Candle format
   - İndikatör formatları
   - API kontratları

3. **Panel Spesifikasyonları**
   - Panel 1: Price Chart (candlestick + overlays)
   - Panel 2: Volume Chart
   - Panel 3: İndikatör Paneli (RSI/MACD/Stoch)

4. **Etkileşimler**
   - Zoom/Pan
   - Drawing tools
   - Toolbar kontrolleri
   - Alert creation

5. **Performans**
   - Data update stratejisi
   - Caching
   - Lazy loading

6. **Figma Entegrasyonu**
   - Layout ölçüleri
   - Spacing
   - Renkler
   - Typography

---

## 🚀 BİR SONRAKİ ADIMLAR

### 1. `docs/CHART_SPEC.md` Şablonunun Oluşturulması
- [ ] Panel yapısı detaylandırılmalı (yükseklikler, spacing)
- [ ] Data input formatları belirlenmeli
- [ ] Etkileşimler dokümante edilmeli
- [ ] API kontratları yazılmalı

### 2. Figma ile Align Edilmesi Gereken Ana Maddeler
- [ ] **Panel yükseklikleri**: Şu an 420px (price) + 160px (indicator) = 580px total
  - **Figma'dan**: Panel 1, 2, 3 yükseklikleri alınmalı
- [ ] **Spacing**: Panel araları, toolbar yüksekliği
- [ ] **Toolbar yapısı**: Timeframe switcher, indikatör toggle, drawing tools
- [ ] **Renkler**: Chart renkleri (candlestick, volume, indikatörler)
- [ ] **Typography**: Axis labels, tooltip font sizes

### 3. Chart Bileşenlerinin Refactor/Yeniden İsimlendirme/Klasörleme İhtiyacı

#### Önerilen Yapı
```
apps/web-next/src/components/charts/
├── main/
│   ├── PriceChart.tsx          # Ana price chart (lightweight-charts)
│   ├── VolumeChart.tsx          # Volume panel (lightweight-charts)
│   └── IndicatorPanel.tsx      # İndikatör paneli (recharts/lightweight)
├── overlays/
│   ├── BollingerBands.tsx      # BB overlay
│   ├── FibonacciLevels.tsx     # Fib levels
│   └── EMASeries.tsx          # EMA overlay
├── tools/
│   ├── ChartToolbar.tsx        # Toolbar (timeframe, indicators)
│   ├── DrawingTools.tsx       # Drawing tools
│   └── ZoomControls.tsx       # Zoom/Pan controls
├── indicators/
│   ├── MACDPanel.tsx           # MACD (recharts)
│   ├── StochPanel.tsx          # Stochastic (recharts)
│   └── RSIPanel.tsx            # RSI (recharts)
└── containers/
    ├── ChartContainer.tsx     # Ana container (3 panel layout)
    └── ChartLayout.tsx        # Layout wrapper
```

#### Yapılacaklar
- [ ] `PriceChartLC.tsx` → `charts/main/PriceChart.tsx` taşı
- [ ] `PriceChart.tsx` (disabled) → Kaldır veya düzelt
- [ ] `ChartTrading.tsx` → `PriceChart` kullanacak şekilde güncelle
- [ ] İndikatör panelleri → `charts/indicators/` altına taşı
- [ ] Stub dosyaları → Kaldır (gerçek bileşenler kullan)
- [ ] `ChartContainer` oluştur (3 panelli layout)

---

## 📝 DEĞİŞEN DOSYALAR

**YOK** - Bu görevde sadece okuma/analiz yapıldı, kod değiştirilmedi.

---

## ✅ TEST / BUILD SONUÇLARI

**ÇALIŞTIRILMADI** - Sadece okuma/analiz görevi.

---

## ⚠️ HATALAR / UYARILAR

### Bulunan BUG/TODO/teknik borç maddeleri

1. **PriceChart.tsx DISABLED** - TypeScript build hataları nedeniyle devre dışı
2. **PriceChartLCStub kullanılıyor** - Gerçek chart render edilmiyor
3. **ChartTrading placeholder** - Gerçek chart entegrasyonu yok
4. **Full chart re-init** - Her prop değişiminde chart yeniden oluşturuluyor (performans)
5. **Sequential API calls** - İndikatörler sırayla fetch ediliyor (yavaş)
6. **Senkronizasyon yok** - İndikatör panelleri ana chart ile senkronize değil
7. **Mock data** - DepthChart mock data kullanıyor (WS entegrasyonu yok)
8. **Cache TTL kısa** - 15 saniye cache çok kısa, sık miss
9. **Layout responsive değil** - Sabit yükseklikler, grid layout yok
10. **TODO: Volume ekle** - Market store'a volume bilgisi eklenmeli

---

## 📊 ÖZET TABLO

| Kategori | Durum | Not |
|----------|-------|-----|
| **Ana Chart** | ⚠️ Stub kullanılıyor | PriceChartLC tam fonksiyonel ama stub import ediliyor |
| **İndikatörler** | ✅ Çalışıyor | MACD, Stochastic Recharts ile çalışıyor |
| **Volume** | ✅ Çalışıyor | Ana chart içinde histogram |
| **Live Stream** | ✅ Çalışıyor | SSE stream aktif, batch updates |
| **Drawing Tools** | ❌ Yok | Trendline, box, etc. yok |
| **Toolbar** | ⚠️ Kısmi | Sayfa seviyesinde kontroller var, chart toolbar yok |
| **Layout** | ⚠️ Dağınık | Ayrı paneller, entegre değil |
| **Responsive** | ❌ Yok | Sabit yükseklikler |
| **Figma Align** | ❌ Yapılmadı | Figma tasarımı ile align edilmeli |

---

**Rapor Sonu**

