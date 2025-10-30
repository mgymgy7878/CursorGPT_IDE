# PR-6 (P0) – Spesifik Sorun Teşhisi + Cerrahi Implementation Plan

**Tarih:** 29 Ekim 2025
**Kapsam:** Chart Trading + Session Widget + Alert Presets
**Kaynak:** Ekran kanıtları + Endüstri standartları (MDN, RFC 6455, TradingView)

---

## 🔍 Spesifik Sorun Teşhisi (Ekranlara Dayalı)

### 1. WebSocket Durumu Çevrimdışı Ama Veri Gösteriliyor ⚠️

**Sorun:**
- WS status: "Çevrimdışı" (kırmızı nokta) sık görülüyor
- Ancak sayfalar veri gösteriyor (cached veya SSE)
- Net durum göstergesi eksik

**Neden Önemli:**
- Operatör gerçek zamanlı veriye güvenemiyor
- Yeniden bağlanma otomatik ama kullanıcı görmez
- Ping/pong health check yok

**Çözüm (Dayanak: MDN + RFC 6455):**
```typescript
// RFC 6455 ping/pong frame kontrolü
// Exponential backoff: 1→2→4→8→16 sn (jitter ile)
// UI: Anlık durum banner'ı (çevrimiçi/çevrimdışı/yeniden bağlanıyor)
```

**Referanslar:**
- [DEV Community: WebSocket Reconnection Strategies](https://dev.to/hexshift/robust-websocket-reconnection-strategies-in-javascript-with-exponential-backoff-40n1)
- [RFC 6455: WebSocket Protocol — Ping/Pong Frames](https://dl.acm.org/doi/10.17487/RFC6455)

---

### 2. Dashboard'da Seans-içi Mikro-Telemetri Yok ⚠️

**Sorun:**
- Makro metrikler var (P95 latency, staleness)
- Ancak son 5 dakika için: işlem sayısı, ortalama işlem büyüklüğü, yön eğilimi eksik
- Operatör "anlık durum" için detaylı analysis sayfasına gitmek zorunda

**Çözüm (Dayanak: SSE Standardı):**
```typescript
// SSE: Tek-yön real-time akış (okuma senaryosu için WS'den hafif)
// Backend endpoint: GET /api/stream/session
// Widget: Mini tablo (trades, avg_size, net_flow, top_risers/fallers)
```

**Referans:**
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

---

### 3. Market Kartları Aksiyonlu Ama "Chart Trading" Eksik ⚠️

**Sorun:**
- Market kartlarında "Hızlı Uyarı" butonu var
- Ancak grafik üzerinden tek tık emir akışı yok
- Operatör hızı kısıtlı (10 saniye emir verme süresi)

**Çözüm (Dayanak: TradingView Paradigması):**
```typescript
// Floating emir paneli (sağ üst)
// Grafik üzerinde sürükle-bırak TP/SL seviyeleri
// Hotkeys: B (Buy), S (Sell), Esc (Cancel)
// Optimistic UI + retry + undo
```

**Referans:**
- [TradingView: Order Ticket Documentation](https://www.tradingview.com/charting-library-docs/latest/trading_terminal/order-ticket/)

---

### 4. Alerts'te "Preset" ve "Emre Dönüştür" Akışı Eksik ⚠️

**Sorun:**
- Alert oluşturma manuel ve tekrar eden adımlar gerektiriyor
- Sık kullanılan alert ayarları kaydedilemiyor
- Alert tetiklendiğinde manuel emir verme gerekli (6 adım)

**Çözüm (Dayanak: TradingView Alert System):**
```typescript
// Preset kaydet/yükle (localStorage + opsiyonel cloud)
// Convert to Order: Alert koşulundan emir taslağı türetme
// Çoklu hedef desteği (1..n fiyat hedefleri)
```

**Referans:**
- [TradingView: How to Set Up Alerts](https://www.tradingview.com/support/solutions/43000595315-how-to-set-up-alerts/)

---

## 📐 PR-6 Kapsamı

### A) Chart Trading Panel

**Amaç:** Grafikten tek tık işlemler (market/limit), sürükle-bırak TP/SL, hızlı yüzde butonları

**Component Yapısı:**
```typescript
// apps/web-next/components/trade/ChartTradingPanel.tsx (yeni)
interface ChartTradingPanelProps {
  symbol: string;
  currentPrice: number;
  onOrder: (order: OrderPayload) => Promise<void>;
}

// apps/web-next/hooks/useChartTrading.ts (yeni)
interface UseChartTradingReturn {
  isDragging: boolean;
  dragPrice: number;
  quantity: number;
  orderType: 'market' | 'limit';
  handleQuickOrder: (side: 'buy' | 'sell') => void;
  handleTPSL: (type: 'tp' | 'sl', percentage: number) => void;
}
```

**UI/UX Esasları:**
- Floating panel (sağ üst, dock olabilir)
- Grafik üzerinde sürükle-bırak (drag handles)
- Snap to tick/price (tick size'a yuvarlama)
- Hotkeys: `B` (Buy), `S` (Sell), `Esc` (Cancel), `Cmd/Ctrl+Enter` (Confirm)
- Miktar: Mutlak / yüzde (%25, %50, %100)

**Veri Sözleşmesi (UI → Executor):**
```json
POST /api/trade/place
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "LIMIT",
  "qty_pct": 0.25,
  "price": 42500.0,
  "tp": 43450.0,
  "sl": 41850.0,
  "client_id": "ct_{{uuid}}"
}
```

**Optimistic UI:**
1. Emir verilir → "pending" badge göster
2. Backend başarılı → "success" toast + undo (5 sn)
3. Backend başarısız → rollback + error toast

**Kabul Kriterleri:**
- [ ] Grafikten tek tık market/limit emri
- [ ] TP/SL sürükle-bırak; değerler tick-size'a yuvarlanır
- [ ] % butonları miktarı doğru hesaplar
- [ ] Optimistic UI + retry; hata tostu ve undo
- [ ] Hotkeys çalışır (B/S/Esc/Cmd+Enter)
- [ ] Drag handles `requestAnimationFrame` ile throttling (60Hz)

---

### B) Seans-içi Analiz Widget (Dashboard)

**Amaç:** Son 5-15 dakika için mikro-telemetri (işlem sayısı, ortalama büyüklük, net akış, top risers/fallers)

**Teknoloji Seçimi (SSE > WS):**
- SSE: Tek-yön real-time akış, okuma senaryosu için ideal
- WS zaten var (iki-yön); SSE ile sadeleşme

**Endpoint:**
```
GET /api/stream/session?symbols=BTCUSDT,ETHUSDT
Content-Type: text/event-stream
```

**Event Format:**
```json
event: session_tick
data: {
  "t": "2025-10-29T09:35:00Z",
  "trades": 143,
  "avg_size": 0.42,
  "net_flow": 1.8,
  "top_risers": ["SOL", "ADA"],
  "top_fallers": ["XRP"],
  "p95_ms": 58
}
```

**Component:**
```typescript
// apps/web-next/components/dashboard/SessionMini.tsx (yeni)
interface SessionStats {
  trades: number;
  avg_size: number;
  net_flow: number;
  top_risers: string[];
  top_fallers: string[];
  p95_ms: number;
}
```

**Reconnect Stratejisi:**
```typescript
// Exponential backoff: 1→2→4→8 sn
// UI: "Yeniden bağlanıyor..." durumu
// EventSource wrapper (apps/web-next/lib/sse.ts)
```

**Kabul Kriterleri:**
- [ ] Widget latency < 1s
- [ ] SSE koparsa 1→2→4→8 sn exponential backoff
- [ ] Mini tablo/sparkline ile ilk ekranda okunur
- [ ] Kopuşta "yeniden bağlanıyor" durumu görünür

---

### C) Alert → Emre Dönüştürme + Şablonlar

**Amaç:** Alert'i tek tıkla emir taslağına dönüştür + sık kullandığın alert ayarlarını kaydet

**Component:**
```typescript
// apps/web-next/components/alerts/AlertPresets.tsx (yeni)
interface AlertPreset {
  id: string;
  name: string;
  conditions: AlertCondition[];
  actions: OrderAction[];
}

// apps/web-next/lib/convertAlertToOrder.ts (yeni)
function convertAlertToOrder(alert: Alert): OrderDraft
```

**Kullanım Senaryosu:**
1. Alert tetiklenir → "Convert to Order" butonu göster
2. Kullanıcı tıklar → ChartTrading panelinde emir taslağı açılır
3. Düzenler + onaylar → Emir verilir

**Preset Kaydetme:**
```typescript
// localStorage + opsiyonel cloud sync
POST /api/alerts/presets
{
  "name": "Breakout-1h",
  "conditions": [
    { "type": "cross", "left": "close", "right": 42500 }
  ],
  "actions": [
    { "type": "OPEN", "side": "BUY", "qty_pct": 0.25 }
  ]
}
```

**Çoklu Hedef Desteği:**
```typescript
// Alert'te 1..n fiyat hedefleri varsa
// → Her hedef için ayrı emir taslağı
// → "Place All" butonu
```

**Kabul Kriterleri:**
- [ ] Preset kaydet/yükle/sil; form alanları otomatik dolar
- [ ] "Convert to Order" tek tık; taslak ChartTrading panelinde açılır
- [ ] Çok hedefli alert'ten çoklu taslak üretimi
- [ ] localStorage persistence

---

## 🔧 Altyapı Sertleştirmesi

### WebSocket Dayanıklılığı

**Exponential Backoff (Dayanak: MDN):**
```typescript
// apps/web-next/lib/ws.ts (reconnect + ping/pong)
const backoff = [1000, 2000, 4000, 8000, 16000];
const jitter = Math.random() * 1000;
const delay = backoff[reconnectAttempt] + jitter;
```

**Ping/Pong Health (RFC 6455):**
```typescript
// 30 saniyede bir ping gönder
// Pong gelmezse → "down" olarak işaretle
// UI: Online/offline banner
```

**Online/Offline Banner:**
```typescript
// apps/web-next/components/common/OfflineBanner.tsx (yeni)
interface OfflineBannerProps {
  status: 'online' | 'offline' | 'connecting';
  lastConnectedAt?: Date;
}
```

### SSE Wrapper (Backoff + Reconnect)

```typescript
// apps/web-next/lib/sse.ts (yeni)
class SSEClient {
  private reconnectAttempt = 0;
  private exponentialBackoff(): number;
  private onReconnect(): void;
}
```

---

## 📊 Telemetry Planı

### Metrikler

**Trade İşlemleri:**
```
trade_place_attempt_total{type,side,symbol}
trade_place_success_total{type,side,symbol}
trade_place_latency_ms{p50,p95,p99}
trade_place_failure_total{reason,symbol}
```

**Alert Dönüşümleri:**
```
alerts_convert_click_total
alerts_convert_success_total
alerts_convert_latency_ms{p95}
alerts_preset_save_total
```

**Bağlantı Durumu:**
```
ws_reconnect_total
sse_reconnect_total
ws_health_ping_total
ws_health_pong_total
```

**Render Performansı:**
```
drag_handle_render_ms{p95}
sse_event_to_paint_ms{p95}
chart_trading_render_ms{p95}
```

---

## 🧪 Test Planı

### Unit Tests

```typescript
// useChartTrading.ts
test('quantity calculation: %25 of portfolio', () => { ... });
test('tick-size rounding: 42500.123 → 42500.00', () => { ... });

// convertAlertToOrder.ts
test('cross above condition → BUY limit order', () => { ... });
test('multi-target alert → multiple order drafts', () => { ... });
```

### Component Tests

```typescript
// ChartTradingPanel.tsx
test('drag-handles on mouse events', () => { ... });
test('TP/SL preset buttons', () => { ... });

// AlertPresets.tsx
test('preset save/load flow', () => { ... });
test('convert to order modal', () => { ... });
```

### Integration Tests

```typescript
// SSE stream → widget update
test('session stats SSE stream', async () => { ... });

// WS disconnect → banner → retry
test('WS fallback on disconnect', async () => { ... });
```

### E2E (Smoke Tests)

```
Test 1: "Grafikten %25 BUY limit + TP/SL ekle → pending → success"
Test 2: "Alert preset yükle → convert → emir taslağı açıldı"
Test 3: "SSE kop → backoff → geri geldi"
Test 4: "WS disconnect → banner → auto-reconnect → online"
Test 5: "Undo after order success (5 seconds)"
```

---

## 📂 Dosya & Değişiklik Listesi

### Yeni Dosyalar

```
apps/web-next/
├── components/
│   ├── trade/
│   │   └── ChartTradingPanel.tsx (yeni — floating emir paneli)
│   ├── dashboard/
│   │   └── SessionMini.tsx (yeni — SSE session stats)
│   ├── alerts/
│   │   └── AlertPresets.tsx (yeni — preset manager)
│   └── common/
│       └── OfflineBanner.tsx (yeni — WS/SSE status)
├── hooks/
│   └── useChartTrading.ts (yeni — emir mantığı)
├── lib/
│   ├── sse.ts (yeni — EventSource wrapper + backoff)
│   ├── ws.ts (yeni — reconnect + ping/pong)
│   └── convertAlertToOrder.ts (yeni — alert → emir dönüşümü)
└── app/api/
    ├── trade/
    │   └── place/route.ts (yeni)
    ├── stream/
    │   └── session/route.ts (yeni — SSE endpoint)
    └── alerts/
        └── presets/route.ts (yeni)
```

### Güncellenecek Dosyalar

```
apps/web-next/
├── app/market/page.tsx (+ ChartTradingPanel integration)
├── app/dashboard/page.tsx (+ SessionMini widget)
├── app/alerts/page.tsx (+ AlertPresets + Convert to Order)
└── stores/
    └── marketStore.ts (+ sessionStats state)
```

---

## ⚠️ Risk & Geri Dönüş Planı

### 1. Emir Yerleştirme Hataları

**Risk:** Backend doğrulaması başarısız → Emir iptal olur, ancak UI'da "pending" gösterilir

**Mitigasyon:**
- Optimistic UI **sadece** frontend'de "pending" katmanında
- Backend doğrulaması başarısızsa → rollback + toast
- Log/Audit kayıtları (ileriki PR'da)

**Geri Dönüş:**
- Emir verilemezse → Red toast + "Retry" butonu
- Undo (5 sn) → Emri geri al

### 2. SSE/WS Eskalasyonları

**Risk:** SSE başarısız olursa → Widget veri gösteremez

**Mitigasyon:**
- SSE başarısız → WS fallback (yalnız okuma akışında SSE tercih)
- Exponential backoff + jitter
- UI: "Yeniden bağlanıyor..." durumu

**Geri Dönüş:**
- SSE koparsa → WS'e geç (read-only fallback)
- Her ikisi de koparsa → Cache'den göster (stale data badge)

### 3. Performans

**Risk:** Drag-handles `requestAnimationFrame` throttling olmadan lag yapabilir

**Mitigasyon:**
- `requestAnimationFrame` ile 60Hz throttling
- Batch updates (120ms debounce)
- Geri bildirim bandı görünür

**Geri Dönüş:**
- Performans kötüyse → Throttle değerini artır (120ms → 200ms)
- Drop animation → Instant feedback

---

## ✅ "Bitti" Tanımı (Done)

### Kabul Kriterleri

- [ ] **Chart Trading:** Grafikten tek tık emir + TP/SL sürükle-bırak, hotkeys ve undo
- [ ] **Session Widget:** Dashboard'ta seans-içi mini panel SSE ile gerçek zamanlı
- [ ] **Alert Presets:** Presetleri var; "alert → tek tık emir taslağı" çalışır
- [ ] **WS/SSE:** Kopuşlar kullanıcıya net bildirilir; otomatik geri bağlanır
- [ ] **Telemetry:** Tüm yeni akışlar için metrikler aktif
- [ ] **Tests:** Unit + Component + Integration + E2E (smoke) yeşil

### "Shippable" Durum

1. **Typecheck:** ✅ PASS
2. **Build:** ✅ PASS
3. **Smoke Tests:** ✅ 5/5 PASS
4. **Manual Tests:** ✅ Tüm akışlar çalışır
5. **Accessibility:** ✅ Keyboard erişilebilir (`Tab`, `Esc`, `B/S`)
6. **Performance:** ✅ Drag handles < 16ms render (60Hz)

---

## 📚 Referanslar

1. **WebSocket Reconnection:** [DEV Community — Robust WS Reconnection with Exponential Backoff](https://dev.to/hexshift/robust-websocket-reconnection-strategies-in-javascript-with-exponential-backoff-40n1)

2. **SSE Standard:** [MDN — Using Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

3. **TradingView Alert System:** [TradingView — How to Set Up Alerts](https://www.tradingview.com/support/solutions/43000595315-how-to-set-up-alerts/)

4. **TradingView Order Ticket:** [TradingView — Order Ticket Documentation](https://www.tradingview.com/charting-library-docs/latest/trading_terminal/order-ticket/)

5. **RFC 6455 — Ping/Pong:** [ACM Digital Library — RFC 6455](https://dl.acm.org/doi/10.17487/RFC6455)

---

**Status:** 🟢 READY TO IMPLEMENT
**Branch:** `feat/pr6-matriks-p0-features`
**ETA:** ~5 saat
**Next:** PR-7 (Layout Presets + PWA)

