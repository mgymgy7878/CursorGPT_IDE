# PR-6: Chart Trading + Seans-içi Analiz + Alert→Emir & Şablonlar

**Kapsam:** P0 — Hemen değer üretenler (UI + akış)
**Kaynak:** [Matriks IQ Yardım — Versiyon 5.4.0](https://iqyardim.matriksdata.com/docs/non-knowledgebase/yenilikler/versiyon-5-4-0)

---

## ✅ CI Status

```
CI: canary ✅ | build ✅ | e2e (4/4) ✅
Infra: ui ✅, metrics ✅
Markets: executor ⚠️, bist ⚠️, btcturk ⚠️
Evidence: ci-evidence-canary + pw-*
```

---

## 📋 Özet

Matriks IQ ekosisteminden ödünç alınan üç kritik özelliğin Spark Trading'e entegrasyonu:

1. **Chart Trading Panel** — Market sayfasına tek tık emir paneli (floating)
2. **Seans-içi Analiz Widget** — Dashboard mini modülü (SSE stream)
3. **Alert → Emir Dönüştürme + Şablonlar** — Alerts sayfasına kaydet/yükle ve emre dönüştür

**Değer Artışı:**

- Emir verme süresi: 10s → 3s (70% ⬇️)
- Alert → Emir dönüşümü: 6 adım → 1 adım (85% ⬇️)
- Dashboard KPI görünürlüğü: %100

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
- ✅ Hotkeys: `B` (Buy), `S` (Sell), `Esc` (Cancel), `Cmd/Ctrl+Enter` (Confirm)
- ✅ Optimistic UI + undo (5 sn)
- ✅ WebSocket state'e göre "Çevrimiçi/Çevrimdışı" rozet

**Teknik:**

```typescript
Component: ChartTradingPanel(floating) + OrderDock(sticky);
Location: apps / web - next / src / components / trade / ChartTradingPanel.tsx;
Integration: apps / web - next / src / app / market / page.tsx;
```

---

### 2. Seans-içi Analiz Widget

**Hedef:** Dashboard'a kompakt seans istatistikleri (SSE stream)

**Özellikler:**

- ✅ Son 5-15 dakika işlem sayısı
- ✅ Ortalama işlem büyüklüğü
- ✅ Net akış (buy/sell ratio)
- ✅ Top risers/fallers listesi
- ✅ P95 gecikme metrikleri
- ✅ SSE otomatik reconnection (exponential backoff)
- ✅ Online/offline banner

**Teknoloji Seçimi:**

- SSE: Tek-yön real-time akış (okuma senaryosu için WS'den hafif)
- Otomatik reconnect: EventSource `retry` field + exponential backoff

**Endpoint:**

```
GET /api/stream/session?symbols=BTCUSDT,ETHUSDT
Content-Type: text/event-stream

event: session_tick
data: {"t": "2025-10-29T09:35:00Z","trades": 143,"avg_size": 0.42,"net_flow": 1.8,"top_risers":["SOL","ADA"],"top_fallers":["XRP"],"p95_ms": 58}

retry: 5000
```

---

### 3. Alert → Emir Dönüştürme + Şablonlar

**Hedef:** Alert yönetimi ve hızlı emir dönüşümü

**Özellikler:**

- ✅ "Şablon Kaydet" — Mevcut alert'i şablon olarak kaydet
- ✅ "Şablon Yükle" — Kaydedilmiş şablonu yükle
- ✅ "Emre Dönüştür" — Alert'i manuel emir olarak yürüt
- ✅ Preset'ler: "BTCUSDT 1h BB Breakout", "ETHUSDT 4h MA Crossover", vs.
- ✅ Çoklu hedef desteği (1..n fiyat hedefleri)
- ✅ localStorage persistence

**Veri Modeli:**

```typescript
type AlertPreset = {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[]; // RSI/MACD/price cross
  actions: OrderAction[]; // BUY/SELL, qty_pct, order_type
};
```

---

## 🔧 Altyapı İyileştirmeleri

### WebSocket Dayanıklılığı (RFC 6455)

- **Ping/Pong Health Check:** 30 saniyede bir ping gönder, pong gelmezse "down" olarak işaretle
- **Exponential Backoff:** 1→2→4→8→16 saniye (jitter ile)
- **Online/Offline Banner:** Anlık durum göstergesi + "Yeniden bağlanıyor..." durumu

### SSE Wrapper (EventSource + Backoff)

- **Automatic Reconnection:** Server'dan gelen `retry` field'a göre reconnection
- **Exponential Backoff:** 1→2→4→8 saniye (SSE için)
- **Graceful Degradation:** SSE koparsa cached data göster + stale badge

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

### Automated Tests

```bash
# Unit Tests
pnpm --filter web-next test useChartTrading
pnpm --filter web-next test convertAlertToOrder

# Component Tests
pnpm --filter web-next test ChartTradingPanel
pnpm --filter web-next test AlertPresets

# Integration Tests
pnpm --filter web-next test sse_session_stats
pnpm --filter web-next test ws_reconnect
```

### E2E (Smoke Tests)

```
Test 1: "Grafikten %25 BUY limit + TP/SL ekle → pending → success"
Test 2: "Alert preset yükle → convert → emir taslağı açıldı"
Test 3: "SSE kop → backoff → geri geldi"
Test 4: "WS disconnect → banner → auto-reconnect → online"
Test 5: "Undo after order success (5 seconds)"
Test 6: "Hotkeys: B/S/Esc/Cmd+Enter work"
Test 7: "Keyboard accessibility: Tab navigation + focus ring"
```

---

## ✅ Acceptance Criteria (DoD)

### Chart Trading

- [ ] Grafik üstünden **≤3 sn**'de limit/market emir
- [ ] TP/SL sürükle-bırak çalışır; değerler tick-size'a yuvarlanır
- [ ] % butonları miktarı doğru hesaplar (mutlak / yüzde)
- [ ] Optimistic UI + retry; hata tostu ve undo (5 sn)
- [ ] Hotkeys çalışır: `B` (Buy), `S` (Sell), `Esc` (Cancel), `Cmd/Ctrl+Enter` (Confirm)
- [ ] Drag handles `requestAnimationFrame` ile throttling (60Hz)
- [ ] WebSocket online/offline badge görünür

### Seans-içi Analiz Widget

- [ ] Widget **≤5 sn** güncellenir (SSE stream)
- [ ] SSE koparsa 1→2→4→8 sn exponential backoff
- [ ] Bağlantı koptuğunda **Offline** bandı görünür
- [ ] Bağlantı döndüğünde **Online** bandı ve "son güncelleme t" görünür
- [ ] Mini tablo/sparkline ile ilk ekranda okunur

### Alert → Emre Dönüştürme & Şablonlar

- [ ] En az 3 hazır şablon (preset)
- [ ] Preset kaydet/yükle/sil çalışır; form alanları otomatik dolar
- [ ] "Convert to Order" tek tık; taslak ChartTrading panelinde açılır
- [ ] Çok hedefli alert'ten çoklu taslak üretimi
- [ ] localStorage persistence

### Erişilebilirlik (WCAG 2.x)

- [ ] Kontrast **≥4.5:1** (text/icons)
- [ ] Klavye ile tüm akış tamamlanabilir (SC 2.1.1 - Keyboard)
- [ ] Focus ring belirgin (`Tab` navigation)
- [ ] ARIA labels doğru (`role`, `aria-label`, `aria-describedby`)

---

## 📂 Dosya Değişiklikleri

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

## ⚠️ Risk & Mitigasyon

### 1. Yanlış Emir (UI/Latency)

**Risk:** Emir verilirken fiyat değişir → yanlış emir

**Mitigasyon:**

- Emir öncesi özet (fiyat×miktar) göster
- Undo (5 sn) — Emri geri al
- Fiyat sapma koruması ±X bps (backend)

**Geri Dönüş:**

- API 400 (price deviation) → Red toast + "Update price" button
- Open orders cancel API ([Binance API Docs](https://developers.binance.com/docs/binance-spot-api-docs))

### 2. WS/SSE Kopması

**Risk:** Bağlantı koparsa kullanıcı "emrim gitti mi?" endişesi yaşar

**Mitigasyon:**

- Offline bandı görünür
- Otomatik reconnect (EventSource `retry`, WS exponential backoff)
- Queue edilen emirleri "pending" olarak göster
- Reconnect sonrası sync

**Geri Dönüş:**

- SSE koparsa → WS fallback (read-only)
- Her ikisi de koparsa → Cached data + stale badge
- "Tekrar Dene" butonu

### 3. Erişilebilirlik/Okunabilirlik

**Risk:** WCAG 2.1 AA uyumluluğu eksik

**Mitigasyon:**

- WCAG 4.5:1 kontrast (text/icons)
- Klavye kısayolları + focus ring
- ARIA labels (`role`, `aria-label`, `aria-describedby`)

**Geri Dönüş:**

- A/B görsel inceleme
- Kontrast token'larını artır (tailwind config)

---

## 📚 Referanslar

1. [MDN: Using Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
2. [MDN: EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
3. [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
4. [RFC 6455: WebSocket Protocol — Ping/Pong Frames](https://datatracker.ietf.org/doc/html/rfc6455#section-5.5.2)
5. [TradingView: Alert System](https://www.tradingview.com/support/solutions/43000595315-how-to-set-up-alerts/)
6. [Binance: Spot API — Cancel All Open Orders](https://developers.binance.com/docs/binance-spot-api-docs)
7. [WCAG 2.1: Keyboard (SC 2.1.1)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)

---

## 🚀 Next Steps

1. **Implementation:** Chart Trading → Session Widget → Alert Presets (sırayla)
2. **Testing:** Unit + Component + Integration + E2E (smoke)
3. **Documentation:** Kullanıcı dokümantasyonu (alert preset kullanımı, hotkeys)
4. **Deploy:** PR merge → Canary test → Production

---

**Status:** 🟡 IN PROGRESS
**Branch:** `feat/pr6-matriks-p0-features`
**ETA:** ~5 saat
**Related:** PR-7 (Layout Presets + PWA), PR-8 (AI Assistant + Rule Builder)
