# PR-6 COMPLETE PACKAGE — Chart Trading + Seans-içi Analiz + Alert→Emir

**Status:** 🟢 READY TO IMPLEMENT
**Branch:** `feat/pr6-matriks-p0-features`
**Kapsam:** Matriks IQ P0 Özellikleri (Chart Trading + Session Widget + Alert Presets)
**ETA:** ~5 saat
**Date:** 29 Ekim 2025

---

## 📋 Summary

Matriks IQ ekosisteminden Spark Trading'e üç kritik özelliğin entegrasyonu:

1. **Chart Trading Panel** — Market sayfasında tek tık emir verme (floating panel)
2. **Seans-içi Analiz Widget** — Dashboard'da mikro-telemetri (SSE stream)
3. **Alert → Emir Dönüştürme + Şablonlar** — Alerts sayfasında kaydet/yükle ve emre dönüştür

**İş Değeri:**
- Emir verme süresi: 10s → 3s (70% ⬇️)
- Alert → Emir dönüşümü: 6 adım → 1 adım (85% ⬇️)
- Dashboard KPI görünürlüğü: %100

---

## 📂 Doküman Yapısı

### 1. Master Plan
- `docs/MATRIKS_FEATURES_MASTER_PLAN.md` — 3 PR'ın toplam planı

### 2. PR-6 Dokümanları
- `docs/PR_6_MATRIKS_FEATURES_P0.md` — İlk plan (genel)
- `docs/PR_6_DETAILED_IMPLEMENTATION_PLAN.md` — Detaylı implementation (500+ satır)
  - Sorun teşhisi (ekran kanıtlarına dayalı)
  - Çözüm tasarımı
  - Akış örnekleri
  - Risk matrisi + Mitigasyon
  - Telemetri planı
- `docs/PR_6_CLEAN_PLACEHOLDER.md` — PR açıklaması (kopyala-yapıştır)

### 3. Test Altyapısı
- `tests/e2e/pr6-matriks-features.spec.ts` — E2E test senaryoları (Playwright)
- `.github/workflows/pr6-e2e.yml` — GitHub Actions CI workflow
- `apps/web-next/playwright.config.ts` — Playwright configuration

### 4. Diğer PR'lar
- `docs/PR_7_MATRIKS_FEATURES_P0_PT2.md` — Layout Presets + PWA
- `docs/PR_8_MATRIKS_FEATURES_P1.md` — AI Assistant + Rule Builder + Portfolio Actions

---

## 🎯 Özellik Detayları (Quick Reference)

### Chart Trading Panel

**Component:** `apps/web-next/src/components/trade/ChartTradingPanel.tsx`
**Integration:** `apps/web-next/src/app/market/page.tsx`
**Features:**
- Floating panel (sağ üst)
- Market/Limit emir türleri
- TP/SL presets (±1/2/3/5%)
- Drag handles (sürükle-bırak)
- Hotkeys: `B` (Buy), `S` (Sell), `Esc` (Cancel), `Cmd/Ctrl+Enter` (Confirm)
- Optimistic UI + undo (5 sn)
- WebSocket online/offline badge

**API Endpoint:** `POST /api/trade/place`

---

### Seans-içi Analiz Widget

**Component:** `apps/web-next/src/components/dashboard/SessionMini.tsx`
**Integration:** `apps/web-next/src/app/dashboard/page.tsx`
**Features:**
- SSE stream (5 sn güncelleme)
- Trades count, avg_size, net_flow
- Top risers/fallers
- P95 latency metric
- Online/offline banner
- Exponential backoff (1→2→4→8 sn)

**API Endpoint:** `GET /api/stream/session` (SSE)

---

### Alert Presets & Convert to Order

**Components:**
- `apps/web-next/src/components/alerts/AlertPresets.tsx`
- `apps/web-next/src/lib/convertAlertToOrder.ts`

**Integration:** `apps/web-next/src/app/alerts/page.tsx`
**Features:**
- Preset save/load (localStorage)
- Convert alert to order (single click)
- Multi-target support (1..n price targets)
- Preset templates ("BTCUSDT 1h BB Breakout", etc.)

**API Endpoints:** `POST /api/alerts/presets`, `POST /api/alerts/convert`

---

## 🔧 Implementation Checklist

### Phase 1: Chart Trading (2h)
- [ ] Create `ChartTradingPanel.tsx` component
- [ ] Create `useChartTrading.ts` hook
- [ ] Implement Market/Limit order types
- [ ] Add TP/SL presets (±1/2/3/5%)
- [ ] Implement drag handles (60Hz throttling)
- [ ] Add hotkeys (B/S/Esc/Cmd+Enter)
- [ ] Implement optimistic UI + undo
- [ ] Add WebSocket online/offline badge
- [ ] Create `/api/trade/place` endpoint
- [ ] Integrate into Market page

### Phase 2: Session Widget (1.5h)
- [ ] Create `SessionMini.tsx` component
- [ ] Create SSE client wrapper (`lib/sse.ts`)
- [ ] Create `/api/stream/session` endpoint (SSE)
- [ ] Implement exponential backoff (1→2→4→8 sn)
- [ ] Add online/offline banner
- [ ] Add Zustand state (`marketStore.sessionStats`)
- [ ] Integrate into Dashboard
- [ ] Test SSE reconnection

### Phase 3: Alert Presets (1.5h)
- [ ] Create `AlertPresets.tsx` component
- [ ] Create `convertAlertToOrder.ts` utility
- [ ] Implement preset save/load (localStorage)
- [ ] Add "Convert to Order" button
- [ ] Implement multi-target support
- [ ] Create preset templates
- [ ] Create `/api/alerts/presets` endpoint
- [ ] Integrate into Alerts page

### Phase 4: Testing (1h)
- [ ] Unit tests (useChartTrading, convertAlertToOrder)
- [ ] Component tests (ChartTradingPanel, AlertPresets)
- [ ] E2E tests (15+ scenarios)
- [ ] Accessibility tests (WCAG 2.1)
- [ ] CI verification (GitHub Actions)

---

## 🧪 Test Coverage

### E2E Test Matrix (15+ scenarios)

**Chart Trading (4 tests):**
1. Single-click market order with TP/SL
2. Keyboard shortcuts (B/S/Esc)
3. Drag handles for TP/SL
4. Optimistic UI rollback on error

**Session Widget (4 tests):**
1. SSE stream updates every 5 seconds
2. Offline banner on SSE disconnect
3. Online banner on SSE reconnect
4. Session widget latency < 1s

**Alert Presets (4 tests):**
1. Save alert preset
2. Load alert preset
3. Convert alert to order
4. Multi-target alert conversion

**Accessibility (3 tests):**
1. Keyboard navigation (Tab/Shift+Tab)
2. Contrast ratio ≥ 4.5:1
3. ARIA labels present

### Test Commands

```bash
# Run E2E tests
pnpm --filter web-next test:e2e

# Run E2E tests with UI
pnpm --filter web-next test:e2e:ui

# Run E2E tests in debug mode
pnpm --filter web-next test:e2e:debug

# Show test report
pnpm --filter web-next test:e2e:report
```

---

## ✅ Acceptance Criteria (DoD)

### Chart Trading
- [ ] Grafik üstünden **≤3 sn**'de limit/market emir
- [ ] TP/SL sürükle-bırak çalışır; değerler tick-size'a yuvarlanır
- [ ] % butonları miktarı doğru hesaplar
- [ ] Optimistic UI + retry; hata tostu ve undo (5 sn)
- [ ] Hotkeys çalışır: `B`, `S`, `Esc`, `Cmd/Ctrl+Enter`
- [ ] Drag handles `requestAnimationFrame` ile throttling (60Hz)
- [ ] WebSocket online/offline badge görünür

### Seans-içi Analiz Widget
- [ ] Widget **≤5 sn** güncellenir (SSE stream)
- [ ] SSE koparsa 1→2→4→8 sn exponential backoff
- [ ] Bağlantı koptuğunda **Offline** bandı görünür
- [ ] Bağlantı döndüğünde **Online** bandı görünür
- [ ] Mini tablo/sparkline ile ilk ekranda okunur

### Alert → Emre Dönüştürme & Şablonlar
- [ ] En az 3 hazır şablon
- [ ] Preset kaydet/yükle/sil çalışır
- [ ] "Convert to Order" tek tık; taslak ChartTrading panelinde açılır
- [ ] Çok hedefli alert'ten çoklu taslak üretimi
- [ ] localStorage persistence

### Erişilebilirlik (WCAG 2.1)
- [ ] Kontrast **≥4.5:1**
- [ ] Klavye ile tüm akış tamamlanabilir (SC 2.1.1)
- [ ] Focus ring belirgin
- [ ] ARIA labels doğru

---

## 📊 Telemetry

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

## ⚠️ Risk & Mitigasyon

| Risk | Etki | Olasılık | Mitigasyon | Geri Dönüş |
|------|------|----------|------------|------------|
| Yanlış emir (UI/latency) | Yüksek | Orta | Emir öncesi özet, undo (5 sn), fiyat sapma koruması | Emir iptali API çağrısı |
| WS/SSE kopması | Orta | Orta | Offline bandı, otomatik reconnect, WS ping/pong | Queue edilen intent'leri discard et |
| Erişilebilirlik | Orta | Orta | WCAG 4.5:1 kontrast, klavye kısayolları, ARIA | Kontrast token'larını artır |

---

## 📚 Referanslar

1. [MDN: Using Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
2. [MDN: EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
3. [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
4. [RFC 6455: WebSocket Protocol — Ping/Pong Frames](https://datatracker.ietf.org/doc/html/rfc6455#section-5.5.2)
5. [TradingView: Alert System](https://www.tradingview.com/support/solutions/43000595315-how-to-set-up-alerts/)
6. [TradingView: Order Ticket](https://www.tradingview.com/charting-library-docs/latest/trading_terminal/order-ticket/)
7. [Binance: Spot API — Cancel All Open Orders](https://developers.binance.com/docs/binance-spot-api-docs)
8. [WCAG 2.1: Keyboard (SC 2.1.1)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
9. [DEV Community: WebSocket Reconnection Strategies](https://dev.to/hexshift/robust-websocket-reconnection-strategies-in-javascript-with-exponential-backoff-40n1)

---

## 🚀 Next Steps

1. **Branch oluştur:** `git checkout -b feat/pr6-matriks-p0-features`
2. **Implementation başlat:** Phase 1 (Chart Trading)
3. **CI'ı test et:** `git push` → GitHub Actions
4. **E2E testleri çalıştır:** `pnpm --filter web-next test:e2e`
5. **PR aç:** `docs/PR_6_CLEAN_PLACEHOLDER.md` içeriğini kopyala-yapıştır
6. **Review & Merge:** Tüm acceptance criteria yeşil olunca merge

---

**Status:** 🟢 READY TO START
**Hazır Dosyalar:** 9 dosya (plan + test + CI)
**Sonraki PR:** PR-7 (Layout Presets + PWA)
**Master Plan:** `docs/MATRIKS_FEATURES_MASTER_PLAN.md`

