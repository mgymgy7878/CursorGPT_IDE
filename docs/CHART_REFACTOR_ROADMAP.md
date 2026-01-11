# Chart Refactor Yol Haritası

**Hedef**: Dağınık POC'ten düzenli v1'e geçiş
**Süre**: Mini-sprint (5 adım)
**Öncelik**: P0 (Kritik)

---

## 📋 Sprint Özeti

Chart modülü şu an **hibrit ve dağınık** durumda:
- ✅ Ana chart bileşeni (`PriceChartLC.tsx`) tam fonksiyonel
- ❌ Ancak **stub kullanılıyor** (gerçek chart render edilmiyor)
- ❌ İndikatörler ayrı panellerde, senkronize değil
- ❌ Layout responsive değil, paneller dağınık
- ❌ Performans sorunları (full re-init, sequential API calls)

**Hedef**: 3 panelli entegre chart, toolbar, senkronizasyon, performans iyileştirmeleri.

---

## 🎯 Adım 1: Stub'ı Öldür, Gerçek Chart'ı Devreye Al

### Dosya
- `apps/web-next/src/app/technical-analysis/page.tsx`

### Değişiklik
```typescript
// ÖNCE (stub):
const PriceChartLC = dynamic(() => import('@/components/technical/PriceChartLCStub'), { ssr: false });

// SONRA (gerçek):
const PriceChartLC = dynamic(() => import('@/components/technical/PriceChartLC'), { ssr: false });
```

### Props Geçişi
```typescript
// technical-analysis/page.tsx içinde:
<PriceChartLC
  candles={candles}
  fibLevels={fibLevels}
  bbSeries={bbSeries}
  symbol={symbol}
  timeframe={tf}
  height={420} // Şimdilik sabit, sonra Figma değerini bağlarız
/>
```

### Test
- [ ] Chart render ediliyor mu?
- [ ] Candlestick görünüyor mu?
- [ ] Volume histogram görünüyor mu?
- [ ] Bollinger Bands overlay çalışıyor mu?
- [ ] Fibonacci levels görünüyor mu?

### Notlar
- İlk aşamada `height={420}` kalsın
- Figma değerleri geldikten sonra `CHART_SPEC.md`'den alınacak

---

## 🎯 Adım 2: ChartContainer Oluştur (3 Panel Layout)

### Yeni Dosya
- `apps/web-next/src/components/charts/containers/ChartContainer.tsx`

### Yapı
```typescript
interface ChartContainerProps {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  indicators?: {
    macd?: MACDData;
    stoch?: StochasticData;
    rsi?: number[];
  };
  overlays?: {
    showBB?: boolean;
    showFib?: boolean;
    showEMA?: boolean;
  };
}

export default function ChartContainer({ ... }: ChartContainerProps) {
  return (
    <div className="chart-container">
      {/* Toolbar */}
      <ChartToolbar symbol={symbol} timeframe={timeframe} />

      {/* Panel 1: Price Chart */}
      <PriceChart
        candles={candles}
        overlays={overlays}
        height={420} // TODO: Figma'dan
      />

      {/* Panel 2: Volume (opsiyonel, şimdilik price içinde) */}
      {/* TODO: Ayrı panel olarak çıkar */}

      {/* Panel 3: Indicator */}
      <IndicatorPanel
        type="macd" // veya "stoch" veya "rsi"
        data={indicators}
        height={160} // TODO: Figma'dan
      />
    </div>
  );
}
```

### Toolbar (Basit)
```typescript
// apps/web-next/src/components/charts/tools/ChartToolbar.tsx
export default function ChartToolbar({ symbol, timeframe, onSymbolChange, onTimeframeChange }) {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <input value={symbol} onChange={e => onSymbolChange(e.target.value)} />
      <select value={timeframe} onChange={e => onTimeframeChange(e.target.value)}>
        <option value="1m">1m</option>
        <option value="5m">5m</option>
        <option value="15m">15m</option>
        <option value="1h">1h</option>
        <option value="4h">4h</option>
        <option value="1d">1d</option>
      </select>
    </div>
  );
}
```

### IndicatorPanel
```typescript
// apps/web-next/src/components/charts/indicators/IndicatorPanel.tsx
export default function IndicatorPanel({ type, data, height }) {
  if (type === 'macd') return <MACDPanel macd={data.macd} signal={data.signal} hist={data.hist} height={height} />;
  if (type === 'stoch') return <StochPanel k={data.k} d={data.d} height={height} />;
  // TODO: RSI panel
  return null;
}
```

### Kullanım
```typescript
// technical-analysis/page.tsx
<ChartContainer
  symbol={symbol}
  timeframe={tf}
  candles={candles}
  indicators={{ macd, stoch }}
  overlays={{ showBB, showFib }}
/>
```

### Test
- [ ] 3 panel düzgün görünüyor mu?
- [ ] Toolbar çalışıyor mu?
- [ ] Panel yükseklikleri doğru mu?
- [ ] Gap'ler doğru mu?

### Notlar
- Yükseklikler şimdilik mevcut `420 + 160` üzerinden
- `CHART_SPEC.md` ile uyumlu Figma sayılarını gelince güncelle

---

## 🎯 Adım 3: Promise.all ile İndikatör Fetch Düzeltmesi

### Dosya
- `apps/web-next/src/app/technical-analysis/page.tsx`

### ÖNCE (Sequential)
```typescript
async function loadAll() {
  setLoading(true);
  try {
    const candlesRes = await fetch(`/api/marketdata/candles?...`);
    const cd = await candlesRes.json();

    const fibRes = showFib ? await fetch('/api/copilot/action', {...}) : null;
    const bbRes = showBB ? await fetch('/api/copilot/action', {...}) : null;
    const macdRes = await fetch('/api/copilot/action', {...});
    const stochRes = await fetch('/api/copilot/action', {...});

    setCandles(cd);
    setFib(fibRes);
    setBb(bbRes);
    setMacd(macdRes);
    setStoch(stochRes);
  } finally {
    setLoading(false);
  }
}
```

### SONRA (Parallel)
```typescript
async function loadAll() {
  setLoading(true);
  try {
    // Candle'ları önce çek (diğerleri buna bağlı olabilir)
    const candlesRes = await fetch(`/api/marketdata/candles?symbol=${symbol}&timeframe=${tf}&limit=300&ts=${Date.now()}`);
    const cd = await candlesRes.json();
    setCandles(cd);

    // İndikatörleri paralel çek
    const [fibRes, bbRes, macdRes, stochRes] = await Promise.all([
      showFib ? fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'tools/fibonacci_levels',
          params: { symbol, timeframe: tf, period: 300 }
        })
      }).then(r => r.json()).catch(() => null) : Promise.resolve(null),

      showBB ? fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'tools/bollinger_bands',
          params: { symbol, timeframe: tf, period: 20, stdDev: 2 }
        })
      }).then(r => r.json()).catch(() => null) : Promise.resolve(null),

      fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'tools/macd',
          params: { symbol, timeframe: tf }
        })
      }).then(r => r.json()).catch(() => null),

      fetch('/api/copilot/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'tools/stochastic',
          params: { symbol, timeframe: tf }
        })
      }).then(r => r.json()).catch(() => null),
    ]);

    setFib(fibRes);
    setBb(bbRes);
    setMacd(macdRes);
    setStoch(stochRes);
  } catch (err) {
    console.error('Load error:', err);
  } finally {
    setLoading(false);
  }
}
```

### Test
- [ ] Yükleme süresi kısaldı mı? (5+ saniye → ~2 saniye)
- [ ] Tüm indikatörler aynı anda geliyor mu?
- [ ] Hata durumunda diğerleri çalışmaya devam ediyor mu?

### Notlar
- `catch(() => null)` ile hata durumunda diğerleri çalışmaya devam eder
- Candle'lar önce çekiliyor (diğerleri buna bağlı olabilir)

---

## 🎯 Adım 4: Chart Re-init Sorununu Azalt

### Dosya
- `apps/web-next/src/components/technical/PriceChartLC.tsx`

### Sorun
```typescript
// ŞU AN (her prop değişiminde full re-init):
useEffect(() => {
  if (!divRef.current || !candles || candles.length === 0) return;

  // Destroy previous chart
  if (chartRef.current) {
    chartRef.current.remove();
    chartRef.current = null;
  }

  // Create new chart
  const chart = createChart(...);
  // ...
}, [candles, fibLevels, bbSeries, height]); // Her değişimde re-init
```

### Çözüm
```typescript
// Chart'ı 1 kere oluştur
useEffect(() => {
  if (!divRef.current) return;

  if (!chartRef.current) {
    const chart = createChart(divRef.current, { ... });
    chartRef.current = chart;

    // Series'leri oluştur
    const candleSeries = chart.addCandlestickSeries({ ... });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({ ... });
    volSeriesRef.current = volumeSeries;

    // ResizeObserver
    const ro = new ResizeObserver(...);
    ro.observe(divRef.current);
    resizeObserverRef.current = ro;
  }

  return () => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
  };
}, []); // Sadece mount/unmount

// Data güncellemeleri ayrı effect
useEffect(() => {
  if (!candleSeriesRef.current || !candles || candles.length === 0) return;

  const candleData = candles.map(k => ({
    time: Math.floor(k.t / 1000) as any,
    open: k.o,
    high: k.h,
    low: k.l,
    close: k.c
  }));

  candleSeriesRef.current.setData(candleData);
  lastBarTimeRef.current = candleData[candleData.length - 1]?.time;
}, [candles]);

useEffect(() => {
  if (!volSeriesRef.current || !candles || candles.length === 0) return;

  volSeriesRef.current.setData(
    candles.map(k => ({
      time: Math.floor(k.t / 1000) as any,
      value: k.v,
      color: k.c >= k.o ? "#16a34a66" : "#ef444466"
    }))
  );
}, [candles]);

// BB overlay güncellemesi
useEffect(() => {
  if (!chartRef.current || !bbSeries || !candles) return;

  // Mevcut BB serilerini temizle ve yeniden oluştur
  // (lightweight-charts'ta series remove/add gerekli)
}, [bbSeries, candles]);

// Fib levels güncellemesi
useEffect(() => {
  if (!candleSeriesRef.current || !fibLevels) return;

  // Mevcut price line'ları temizle ve yeniden oluştur
}, [fibLevels]);
```

### Test
- [ ] Chart sadece 1 kere oluşturuluyor mu?
- [ ] Data güncellemelerinde flicker yok mu?
- [ ] CPU kullanımı düştü mü?
- [ ] Memory leak yok mu?

### Notlar
- Chart instance'ı sadece unmount'ta temizleniyor
- Series update'leri ayrı effect'lerde
- BB ve Fib için series remove/add gerekli (lightweight-charts API)

---

## 🎯 Adım 5: DepthChart'ı TODO Olarak İşaretle

### Dosya
- `apps/web-next/src/components/market/DepthChart.tsx`

### Değişiklik
```typescript
/**
 * Depth Chart - Kümülatif bid/ask eğrileri
 *
 * TODO (v2): Gerçek WebSocket entegrasyonu
 * - Şu an mock data kullanılıyor
 * - Order book WS stream'i entegre edilmeli
 * - Real-time bid/ask depth güncellemeleri
 *
 * @deprecated v0 - Mock data, v2'de gerçek entegrasyon
 */
export default function DepthChart({ symbol }: DepthChartProps) {
  // Mock data - gerçekte WS'den gelecek
  // ...
}
```

### Notlar
- DepthChart şimdilik "v2" işaretiyle kenara alındı
- Ana odak: price + volume + indicator üçlüsü
- v2'de order book WS entegrasyonu yapılacak

---

## ✅ Sprint Tamamlandığında

### Beklenen Sonuçlar
- ✅ Gerçek chart render ediliyor (stub yok)
- ✅ 3 panelli entegre layout
- ✅ Toolbar çalışıyor
- ✅ İndikatörler senkronize
- ✅ Performans iyileştirildi (re-init yok, parallel fetch)
- ✅ Kod düzenli ve bakımı kolay

### Sonraki Adımlar (v1+)
- Drawing tools (trendline, box, horizontal line)
- Replay modu
- Alert creation from chart
- Fullscreen mode
- Chart template save/load

---

## 📝 Notlar

- Tüm değişiklikler `CHART_SPEC.md` ile uyumlu olmalı
- Figma değerleri geldikçe `TODO_FIGMA` alanları doldurulacak
- Her adım sonrası test edilmeli
- TypeScript strict mode uyumlu olmalı

---

**Sprint Başlangıç**: TBD
**Sprint Bitiş**: TBD
**Durum**: 📋 Planlandı

