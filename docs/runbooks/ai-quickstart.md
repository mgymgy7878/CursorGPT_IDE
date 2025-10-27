# AI Quickstart Runbook

## Amaç
AI destekli hızlı strateji üretimi ve Binance Futures testnet uygulaması için operasyonel rehber.

## Özellik Bayrağı
```bash
NEXT_PUBLIC_AI_QUICKSTART=true
```

## UI Erişim
- **URL**: `/ops` (Operasyon Paneli)
- **Kart**: "🚀 Hızlı Futures Başlat" (bayrak aktif iken görünür)

## Akış Adımları

### 1. AI Öner
**Endpoint**: `POST /api/advisor/suggest`

**Parametreler**:
```json
{
  "symbol": "BTCUSDT|ETHUSDT",
  "side": "BUY|SELL", 
  "qty": 0.001,
  "leverage": 5,
  "risk": "low|med|high",
  "testnet": true
}
```

**Yanıt**:
```json
{
  "id": "sg_20250914_001",
  "symbol": "BTCUSDT",
  "side": "BUY",
  "leverage": 5,
  "entry": "market",
  "stop": "-0.8%",
  "takeProfits": [{"tp": "0.6%"}, {"tp": "1.2%"}],
  "confidence": 0.72,
  "rationale": "AI analizi...",
  "tokens": 1234,
  "model": "gpt-4o-mini"
}
```

### 2. Planla
**Endpoint**: `POST /api/canary/live-trade.plan`

**Parametreler**:
```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "qty": 0.001,
  "leverage": 5,
  "risk": "low",
  "suggestId": "sg_20250914_001",
  "dryRun": true
}
```

### 3. Kuru Çalıştır
**Endpoint**: `POST /api/futures/order`

**Headers**: `x-dry-run: 1`

**Beklenen Yanıt**: `403` + `confirm_required: true`

### 4. Uygula
- Gate açık iken confirm modal tetiklenir
- Onay sonrası canlı emir gönderilir

## Risk Seviyeleri

| Risk | Stop Loss | Take Profit | Confidence |
|------|-----------|-------------|------------|
| Low  | 0.8%      | 0.6%, 1.2%  | 75%        |
| Med  | 1.2%      | 1.0%, 2.0%  | 65%        |
| High | 1.8%      | 1.5%, 3.0%  | 55%        |

## Whitelist Kısıtlamaları

### Semboller
- BTCUSDT
- ETHUSDT

### Kaldıraç
- Min: 1x
- Max: 20x

### Testnet
- Varsayılan: Aktif
- Prod kapıları: Kapalı (RBAC korumalı)

## Metrikler

### Temel Metrikler
- `advisor_suggest_total{status}` - AI öneri istekleri
- `advisor_tokens_total{model}` - Token kullanımı  
- `advisor_latency_ms{risk}` - AI yanıt gecikmesi
- `canary_plan_total{status}` - Canary plan istekleri

### Performans Metrikleri
- `ai_to_plan_ms` - AI'den plana geçiş süresi
- `plan_to_order_ms` - Plandan emre geçiş süresi

## Alert Kuralları

### Kritik Alertler
- **AdvisorErrorRateHigh**: AI hata oranı > 3/sn (5dk)
- **CanaryPlanFailSurge**: Plan hata oranı > 3/sn (10dk)
- **AdvisorLatencyHigh**: 95p gecikme > 2000ms

### Uyarı Alertleri
- **AdvisorTokensQuotaExceeded**: Token kullanımı > 10k/saat
- **AIQuickstartDown**: Executor servisi down

## Smoke Testleri

### Komut
```bash
pnpm smoke:ai-quickstart
```

### Test Kapsamı
1. AI Advisor Suggest (200)
2. Canary Plan (200 + evidence path)
3. Dry Run Order (403 + confirm_required)
4. Metrics endpoint (advisor_* metrikleri)
5. Advisor Health (200)

### Kabul Kriterleri
- Tüm endpoint'ler 200/403 (beklenen)
- Advisor metrikleri görünür
- Evidence dosyaları oluşturulur

## Troubleshooting

### AI Öneri Hatası
1. Executor servisi çalışıyor mu? (`/api/advisor/health`)
2. Token limiti aşıldı mı? (`advisor_tokens_total`)
3. Risk seviyesi geçerli mi? (`low|med|high`)

### Plan Hatası
1. SuggestId geçerli mi?
2. Canary servisi aktif mi?
3. Evidence dizini yazılabilir mi?

### Emir Hatası
1. Gate durumu? (OFF → 403 beklenir)
2. Whitelist kontrolü? (BTCUSDT/ETHUSDT)
3. Kaldıraç sınırı? (1-20x)

## Rollout Stratejisi

### Dev → Stage
- Bayrak: `NEXT_PUBLIC_AI_QUICKSTART=true`
- RBAC: `trader-admin` gerekli
- Testnet: Aktif

### Stage → Prod
- Kademeli rollout
- Gate'ler kapalı başlangıç
- Monitor: advisor_* metrikleri

### Backout
- Bayrak kapat: `NEXT_PUBLIC_AI_QUICKSTART=false`
- Kart gizlenir
- Eski davranış korunur

## Güvenlik

### RBAC
- Prod: `trader-admin` rolü gerekli
- Dev/Stage: Bayrak kontrolü

### Rate Limiting
- AI öneri: 20/dk (dev), 5/dk (prod)
- Plan: 10/dk (dev), 3/dk (prod)

### Audit
- Tüm AI önerileri loglanır
- Plan ve emir akışları audit trail
- Token kullanımı izlenir
