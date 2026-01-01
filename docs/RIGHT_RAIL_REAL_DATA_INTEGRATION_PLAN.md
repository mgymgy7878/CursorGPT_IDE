# RightRail Real Data Integration Plan

**Tarih:** 2025-01-15
**Sürüm:** Epic C - Gerçek Portföy/Connector Entegrasyonu
**Durum:** ✅ Tamamlandı

---

## Genel Bakış

Epic C, RiskActionPlanDto içindeki planları gerçek portföy ve connector verisiyle doldurmayı hedefler. Artık aksiyon planları hayali değil, canlı strateji/pozisyon ve borsa health verisine referans verir.

**ÖNEMLİ:** Bu epikte hâlâ sadece plan + dry-run vardır. Gerçek trade yapılmaz.

---

## Veri Kaynakları ve Mapping

### RiskActionExecutionDto.scope Alanları

| Alan | Backend Kaynağı | Endpoint | Açıklama |
|------|----------------|----------|----------|
| `strategyIds` | `/api/strategies/active` | `Strategy.id` | Etkilenen strateji ID'leri |
| `positionIds` | `/api/tools/get_positions` | `Position.id` | Kapatılacak pozisyon ID'leri |
| `leverageTarget` | `/api/strategies/active` | `Strategy.leverage` | Hedef kaldıraç seviyesi |

### RiskActionPlanDto.estimatedImpact Alanları

| Alan | Backend Kaynağı | Hesaplama |
|------|----------------|-----------|
| `affectedStrategies` | `/api/strategies/active` | Etkilenen strateji sayısı |
| `affectedPositions` | `/api/tools/get_positions` | Etkilenen pozisyon sayısı |
| `leverageChange` | `/api/strategies/active` | Ortalama kaldıraç - hedef kaldıraç |

### RiskActionPlanDto.warnings

| Uyarı Tipi | Backend Kaynağı | Endpoint |
|------------|----------------|----------|
| Exchange degraded | `/api/exchanges/health` | `ExchangeHealthDto.exchanges[].status !== 'up'` |
| Exchange high latency | `/api/exchanges/health` | `ExchangeHealthDto.exchanges[].latencyMs > 1000` |
| Exchange high rate limit | `/api/exchanges/health` | `ExchangeHealthDto.exchanges[].rateLimitUsedPct > 80` |

---

## Aksiyon Tipi Bazında Gerçek Veri Kullanımı

### block_new_strategies

**Gerçek Veri:**
- `scope.strategyIds`: Tüm aktif stratejiler (`/api/strategies/active`)
- `estimatedImpact.affectedStrategies`: Aktif strateji sayısı

**Örnek:**
```json
{
  "type": "block_new_strategies",
  "scope": {
    "strategyIds": ["strat_1", "strat_2", "strat_3"]
  },
  "estimatedImpact": {
    "affectedStrategies": 3,
    "affectedPositions": 0
  }
}
```

---

### reduce_leverage

**Gerçek Veri:**
- `scope.strategyIds`: Yüksek kaldıraçlı stratejiler (3x ve üzeri)
- `scope.leverageTarget`: Ortalama kaldıraç - 2x
- `estimatedImpact.affectedStrategies`: Yüksek kaldıraçlı strateji sayısı
- `estimatedImpact.affectedPositions`: Bu stratejilerdeki pozisyon sayısı
- `estimatedImpact.leverageChange`: Ortalama kaldıraç - hedef kaldıraç

**Örnek:**
```json
{
  "type": "reduce_leverage",
  "scope": {
    "strategyIds": ["strat_1", "strat_2"],
    "leverageTarget": 3
  },
  "estimatedImpact": {
    "affectedStrategies": 2,
    "affectedPositions": 5,
    "leverageChange": -2
  }
}
```

---

### close_positions

**Gerçek Veri:**
- `scope.positionIds`: En riskli pozisyonlar (negatif PnL'e göre sıralı, ilk 5)
- `scope.strategyIds`: Bu pozisyonların ait olduğu stratejiler
- `estimatedImpact.affectedStrategies`: Etkilenen strateji sayısı
- `estimatedImpact.affectedPositions`: Kapatılacak pozisyon sayısı

**Örnek:**
```json
{
  "type": "close_positions",
  "scope": {
    "positionIds": ["pos_1", "pos_2", "pos_3"],
    "strategyIds": ["strat_1"]
  },
  "estimatedImpact": {
    "affectedStrategies": 1,
    "affectedPositions": 3
  }
}
```

---

## Exchange Health Entegrasyonu

Exchange health verisi plan uyarılarına eklenir:

- **Degraded Exchanges:** `status !== 'up'` olan borsalar
- **High Latency:** `latencyMs > 1000` olan borsalar
- **High Rate Limit:** `rateLimitUsedPct > 80` olan borsalar

**Örnek Uyarılar:**
```json
{
  "warnings": [
    "1 borsa sorunlu: BTCTurk",
    "1 borsada yüksek gecikme: BTCTurk (1500ms)",
    "1 borsada rate limit yüksek: BIST (%85)"
  ]
}
```

---

## Portfolio Client Helper

`apps/web-next/src/lib/risk-actions/portfolio-client.ts` dosyası gerçek veri çekme işlemlerini yönetir:

- `fetchOpenPositions()`: Açık pozisyonları getirir
- `fetchActiveStrategies()`: Aktif stratejileri getirir
- `fetchRiskiestPositions(limit)`: En riskli pozisyonları getirir
- `fetchHighLeverageStrategies(threshold)`: Yüksek kaldıraçlı stratejileri getirir

---

## Degrade Mod

Portföy verisi alınamazsa:
- Plan mock veriyle oluşturulur
- `warnings` içine "Portföy verisi alınamadı" uyarısı eklenir
- Plan yine de döner, ancak gerçek ID'ler yerine boş array'ler kullanılır

---

## Bilinen Sınırlamalar

1. **Gerçek Trade Yok:** Bu epikte hâlâ sadece plan + dry-run vardır. Gerçek trade yapılmaz.

2. **Portfolio Service Entegrasyonu:** Bazı alanlar (örn. `leverage`) henüz tam entegre değil, fallback değerler kullanılıyor.

3. **Position PnL:** Pozisyon PnL verisi endpoint'ten gelmiyorsa, risk hesaplaması yapılamaz.

---

## İlgili Dosyalar

- `apps/web-next/src/lib/risk-actions/portfolio-client.ts` - Portfolio client helper
- `apps/web-next/src/lib/risk-actions/planner.ts` - Plan oluşturma logic'i (güncellendi)
- `apps/web-next/src/app/api/risk-actions/plan/route.ts` - Plan endpoint (güncellendi)
- `apps/web-next/src/app/api/strategies/active/route.ts` - Strateji endpoint
- `apps/web-next/src/app/api/tools/get_positions/route.ts` - Pozisyon endpoint
- `apps/web-next/src/app/api/exchanges/health/route.ts` - Exchange health endpoint
- `docs/GUARDRAILS_RISK_ACTIONS_V1.md` - Guardrails dokümantasyonu

---

## Sonraki Adımlar

1. **Execution Guardrails:** Gerçek trade için onay mekanizması
2. **Portfolio Service Tam Entegrasyonu:** Tüm alanların gerçek veriyle doldurulması
3. **Historical Tracking:** Planların ve simülasyonların geçmişini takip etmek
