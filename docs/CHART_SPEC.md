# Spark Chart Spec v0

## 1. Genel Bakış

- **Amaç**: Spark Trading ana grafiğinin (price + volume + indikatör) **tek bir standart** üzerinden çizilmesi.

- **Kütüphane**:
  - Ana fiyat grafiği: `lightweight-charts` v5.0.9
  - Volume: `lightweight-charts` histogram veya ayrı panel
  - İndikatör paneli: başlangıçta `recharts`, ileride `lightweight-charts` ile birleşik

- **Versiyon**: v0 (mevcut durum: stub kullanılıyor, entegrasyon eksik)

---

## 2. Panel Yapısı

### 2.1. Panel 1 – Price Chart

- **İçerik**:
  - Candlestick (OHLCV)
  - Opsiyonel overlay'ler:
    - EMA(9/21) veya SMA
    - Bollinger Bands
    - Fibonacci seviyeleri

- **Yükseklik**:
  - Hedef: `TODO_FIGMA` (şu an kodda **420px** sabit)

- **Layout**:
  - Üstte toolbar ile arasında dikey boşluk: `TODO_FIGMA`
  - Sağda fiyat ekseni, altta zaman ekseni

### 2.2. Panel 2 – Volume

- **İçerik**:
  - Volume histogram (up/down renkli)

- **Yükseklik**:
  - Hedef: Price panel yüksekliğinin `%TODO_FIGMA`'i
  - Şu an: Price panel içinde secondary scale olarak gösteriliyor

- **Layout**:
  - Price panel ile arasında dikey gap: `TODO_FIGMA`

### 2.3. Panel 3 – Indicator

- **İçerik**:
  - İlk sürüm: RSI veya MACD veya Stochastic (seçilebilir)

- **Yükseklik**:
  - Hedef: `TODO_FIGMA` (şu an MACD/Stoch paneli **160px** sabit)

- **Layout**:
  - Volume ile arasında dikey gap: `TODO_FIGMA`

---

## 3. Data Modeli

### 3.1. Candle

```typescript
type Candle = {
  t: number; // timestamp (ms)
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};
```

### 3.2. İndikatörler

- **MACD**: `{ macd: number[]; signal: number[]; hist: number[] }`
- **Stochastic**: `{ k: number[]; d: number[] }`
- **Bollinger**: `{ u: number; m: number; l: number }[]`
- **(İleride) RSI**: `number[]`

---

## 4. Etkileşimler

### 4.1. Mevcut (v0)

- **Hover**: Crosshair tüm panellerde senkron
- **Zoom**: Mouse wheel (native lightweight-charts)
- **Pan**: Mouse drag (native)
- **Live toggle**: ON/OFF

### 4.2. Hedef (v1)

**Toolbar'dan:**
- Timeframe seçimi: `1m | 5m | 15m | 1H | 4H | 1D`
- Indicator seçimi: `RSI / MACD / Stoch`
- Overlay toggle: `BB`, `EMA`

**Zoom/Pan UI:**
- `+ / -` butonları
- "Reset view" butonu

**İleride:**
- Drawing tools: trendline, box, horizontal line
- Replay modu

---

## 5. Layout & Figma Align

Aşağıdaki değerler Figma'dan doldurulacak:

### Ana chart container:
- **Width**: `TODO_FIGMA`
- **Height**: `TODO_FIGMA`
- **Padding** (top/right/bottom/left): `TODO_FIGMA`

### Panel yükseklikleri:
- **Price panel**: `TODO_FIGMA` (şu an 420px)
- **Volume panel**: `TODO_FIGMA`
- **Indicator panel**: `TODO_FIGMA` (şu an 160px)

### Paneller arası boşluk:
- **Price–Volume gap**: `TODO_FIGMA`
- **Volume–Indicator gap**: `TODO_FIGMA`

### Toolbar:
- **Yükseklik**: `TODO_FIGMA`
- **Buton boyutu**: `TODO_FIGMA` (genişlik x yükseklik)
- **Butonlar arası gap**: `TODO_FIGMA`

---

## 6. Tema / Design Tokens

### 6.1. Renkler

```css
color.chart.bg           = "#TODO_FIGMA" // ana chart bg
color.chart.panel.bg     = "#TODO_FIGMA"
color.chart.candle.up    = "#TODO_FIGMA"
color.chart.candle.down  = "#TODO_FIGMA"
color.chart.volume.up    = "#TODO_FIGMA"
color.chart.volume.down  = "#TODO_FIGMA"
color.chart.grid         = "#TODO_FIGMA"
color.chart.axis.text    = "#TODO_FIGMA"
```

### 6.2. Spacing

```css
spacing.1 = TODO_FIGMA // örn 4px
spacing.2 = TODO_FIGMA // örn 8px
spacing.3 = TODO_FIGMA // örn 12px
```

### 6.3. Typography

```css
text.chartTitle:
  font-size: TODO_FIGMA
  font-weight: TODO_FIGMA

text.axisLabel:
  font-size: TODO_FIGMA
  font-weight: TODO_FIGMA

text.toolbarButton:
  font-size: TODO_FIGMA
  font-weight: TODO_FIGMA
```

---

## 7. API Kontratları

### 7.1. Candle Data Endpoint

```
GET /api/marketdata/candles?symbol={symbol}&timeframe={tf}&limit={limit}
```

**Response:**
```json
[
  { "t": 1234567890, "o": 65000, "h": 65500, "l": 64800, "c": 65200, "v": 1234.56 }
]
```

### 7.2. Live Stream Endpoint

```
GET /api/marketdata/stream?symbol={symbol}&timeframe={tf}
```

**Format:** Server-Sent Events (SSE)

**Event Format:**
```json
{
  "event": "kline",
  "symbol": "BTCUSDT",
  "interval": "1h",
  "t": 1234567890,
  "o": 65000,
  "h": 65500,
  "l": 64800,
  "c": 65200,
  "v": 1234.56,
  "final": true
}
```

### 7.3. İndikatör Endpoints

```
POST /api/copilot/action
```

**Actions:**
- `tools/fibonacci_levels`
- `tools/bollinger_bands`
- `tools/macd`
- `tools/stochastic`

---

## 8. Performans Gereksinimleri

- **Initial Load**: < 500ms (cached data)
- **Live Update Latency**: < 200ms (batch updates)
- **Chart Re-render**: Sadece data değişiminde (full re-init yok)
- **Memory**: Chart instance'ı cleanup edilmeli (unmount)

---

## 9. Erişilebilirlik (A11y)

- **Keyboard Navigation**: Tab ile toolbar kontrollerine erişim
- **Screen Reader**: Chart verileri için `aria-label` ve `aria-live`
- **Color Contrast**: WCAG AA uyumlu renkler
- **Reduced Motion**: Animasyonlar `prefers-reduced-motion` ile kontrol edilmeli

---

## 10. Versiyonlama

- **v0** (Mevcut): Stub kullanılıyor, dağınık yapı
- **v1** (Hedef): 3 panelli entegre chart, toolbar, senkronizasyon
- **v2** (İleride): Drawing tools, replay, alert creation

---

**Not**: Bu dosya, "Figma + Cursor + ChatGPT" üçlüsü arasında **resmi sözleşme** gibi düşünülebilir. Figma'dan gelen sayısal değerler `TODO_FIGMA` alanlarına doldurulacak.

