# Orders Runbook (Confirm Gate & Guards)

## Amaç
Confirm gate OFF iken 403+`confirm_required:true` akışını güvenceye almak; whitelist/minNotional/maxLeverage korumaları.

## AI Quickstart Entegrasyonu
AI destekli hızlı strateji üretimi ve uygulama akışı:

### Akış
1. **AI Öner** → `POST /api/advisor/suggest` (symbol, side, qty, leverage, risk)
2. **Planla** → `POST /api/canary/live-trade.plan` (suggestId + dryRun:true)
3. **Kuru Çalıştır** → `POST /api/futures/order` (x-dry-run:1 → 403+confirm_required)
4. **Uygula** → Gate açık iken confirm modal → canlı emir

### Risk Seviyeleri
- **Low**: Stop 0.8%, TP [0.6%, 1.2%], Confidence 75%
- **Med**: Stop 1.2%, TP [1.0%, 2.0%], Confidence 65%  
- **High**: Stop 1.8%, TP [1.5%, 3.0%], Confidence 55%

### Whitelist
- Semboller: BTCUSDT, ETHUSDT
- Kaldıraç: 1-20x
- Testnet: Varsayılan aktif

## Sinyaller
- Sayaç: `futures_orders_blocked_total{reason="gate_closed|whitelist|max_notional|max_leverage"}`
- Alert: **FuturesOrdersBlockedSurge** — `rate(futures_orders_blocked_total[5m]) > 3`

### AI Quickstart Metrikleri
- `advisor_suggest_total{status}` - AI öneri istekleri
- `advisor_tokens_total{model}` - Token kullanımı
- `advisor_latency_ms{risk}` - AI yanıt gecikmesi
- `canary_plan_total{status}` - Canary plan istekleri
- `ai_to_plan_ms` - AI'den plana geçiş süresi
- `plan_to_order_ms` - Plandan emre geçiş süresi

### AI Quickstart Alertleri
- **AdvisorErrorRateHigh**: `rate(advisor_suggest_total{status="error"}[5m]) > 3`
- **CanaryPlanFailSurge**: `rate(canary_plan_total{status="error"}[10m]) > 3`
- **AdvisorLatencyHigh**: `histogram_quantile(0.95, rate(advisor_latency_ms_bucket[5m])) > 2000`

## Karar Ağacı (özet)
1. **Gate** OFF → tüm canlı emirler **403 confirm_required**.
2. **Gate** ON → whitelist/minNot/maxLev kontrolleri:
   - Fail → 403 (reason ile)
   - Pass → 2xx → broker’a iletilir.

## Operasyon
- UI modal yalnızca 403+confirm_required’ta açılır.
- Dry-Run: `POST /api/futures/order` `x-dry-run: true`.
- Intent kayıt: `/api/private/executions/confirm` (audit zorunlu).

## Triage
- Beklenmeyen 403 spike → alert tetikler → executor audit ve reason dağılımı incelenir.
- Notional/levrage yanlış hesap → types & calc gözden geçir; p95 gecikme <1s.
