# RightRail Endpoints - Smoke Test Evidence

Bu dosya RightRail endpoint'lerinin smoke test sonuçlarını içerir.

## Test Tarihi
- Tarih: 2025-12-10
- Ortam: Development (localhost:3003)
- Mock Data: Aktif

## Endpoint'ler

### 1. GET /api/system/status
**Beklenen Response:** `SystemStatusDto`

```json
{
  "api": "up",
  "ws": "up",
  "executor": {
    "status": "up",
    "p95LatencyMs": 12
  },
  "evidenceBalancePct": 87.5,
  "lastUpdatedIso": "2025-12-10T19:54:00.000Z"
}
```

**Test:**
```bash
curl http://localhost:3003/api/system/status
```

**Durum:** ✅ Mock data döndürüyor, DTO ile uyumlu

---

### 2. GET /api/portfolio/risk-summary
**Beklenen Response:** `TopRisksDto`

```json
{
  "mostRiskyStrategy": {
    "id": "strat_eth_mean_rev",
    "name": "ETH Mean Reversion",
    "symbol": "ETHUSDT",
    "timeframe": "15m",
    "currentDrawdownPct": -3.1,
    "maxAllowedDrawdownPct": -5.0,
    "pnl24hPct": 1.2
  },
  "mostConcentratedMarket": {
    "symbol": "BTCUSDT",
    "weightPct": 42.5,
    "positions": 5
  },
  "dailyMaxDrawdown": {
    "valuePct": -3.1,
    "limitPct": -5.0
  },
  "newsImpact": {
    "level": "medium",
    "summary": "Fed faiz kararı yaklaşıyor, volatilite artışı bekleniyor"
  },
  "meta": {
    "markets": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    "strategiesActive": 12,
    "portfolioStatus": "caution"
  },
  "lastUpdatedIso": "2025-12-10T19:54:00.000Z"
}
```

**Test:**
```bash
curl http://localhost:3003/api/portfolio/risk-summary
```

**Durum:** ✅ Mock data döndürüyor, DTO ile uyumlu

---

### 3. GET /api/exchanges/health
**Beklenen Response:** `ExchangeHealthDto`

```json
{
  "exchanges": [
    {
      "name": "Binance",
      "status": "up",
      "lastSyncAgoSec": 2,
      "rateLimitUsedPct": 45,
      "latencyMs": 12
    },
    {
      "name": "BTCTurk",
      "status": "up",
      "lastSyncAgoSec": 5,
      "rateLimitUsedPct": 23,
      "latencyMs": 28
    },
    {
      "name": "BIST",
      "status": "degraded",
      "lastSyncAgoSec": 15,
      "rateLimitUsedPct": 78,
      "latencyMs": 145
    }
  ],
  "lastUpdatedIso": "2025-12-10T19:54:00.000Z"
}
```

**Test:**
```bash
curl http://localhost:3003/api/exchanges/health
```

**Durum:** ✅ Mock data döndürüyor, DTO ile uyumlu

---

### 4. GET /api/right-rail
**Beklenen Response:** `RightRailSnapshotDto`

```json
{
  "topRisks": { /* TopRisksDto */ },
  "systemStatus": { /* SystemStatusDto */ },
  "exchangeHealth": { /* ExchangeHealthDto */ },
  "asOfIso": "2025-12-10T19:54:00.000Z"
}
```

**Test:**
```bash
curl http://localhost:3003/api/right-rail
```

**Durum:** ✅ Aggregator çalışıyor, 3 endpoint'ten Promise.all ile veri topluyor

**Notlar:**
- Timeout: 5 saniye
- Degrade mod: Başarısız endpoint'ler için mock fallback
- Tüm endpoint'ler başarılı olduğunda gerçek veri döndürüyor

---

### 5. GET /api/right-rail/summary
**Beklenen Response:** `RightRailSummaryDto`

```json
{
  "riskScore": 45,
  "regime": "caution",
  "summary": "Günlük max drawdown limitin %62'sine ulaştı; BIST bozuk.",
  "bullets": [
    "ETH Mean Reversion (ETHUSDT) drawdown: -3.1%",
    "BTCUSDT portföyün %42.5'sini oluşturuyor",
    "BIST bozuk"
  ],
  "asOfIso": "2025-12-10T19:54:00.000Z"
}
```

**Test:**
```bash
curl http://localhost:3003/api/right-rail/summary
```

**Durum:** ✅ Deterministik skor hesaplama çalışıyor

**Skor Hesaplama Mantığı:**
- Drawdown riski: 0-30 puan
- Sistem durumu: 0-25 puan
- Evidence Balance: 0-20 puan
- Borsa sağlığı: 0-15 puan
- Haber etkisi: 0-10 puan
- Toplam: 0-100 (düşük = iyi, yüksek = riskli)

**Regime Bantları:**
- 0-39: normal
- 40-59: caution
- 60-79: stress
- 80-100: panic

---

## Sonuç

✅ Tüm endpoint'ler çalışıyor
✅ DTO kontratlarına uyumlu
✅ Mock data ile test edildi
✅ Gerçek veri entegrasyonu için hazır

## Sonraki Adımlar

1. Gerçek metrik kaynaklarına bağlama:
   - `/api/system/status` → Executor + Prometheus/Grafana
   - `/api/portfolio/risk-summary` → Portföy servisi
   - `/api/exchanges/health` → Connector servisleri

2. Copilot entegrasyonu:
   - `GET /api/right-rail/summary` → Copilot agent'ın tek veri kaynağı
   - `RightRailSummaryDto` → Copilot prompt'una sabit

