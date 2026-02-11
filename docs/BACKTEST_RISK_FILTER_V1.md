# Backtest Risk Filter v1

**Tarih:** 2025-01-15
**Sürüm:** v1.0.0
**Durum:** ✅ Aktif
**Epic:** Epic E

---

## Genel Bakış

Backtest Risk Filter v1, backtest sonuçlarını Risk Architecture Baseline v1'e bağlar. Backtest edilen strateji adayları, canlıdaki Risk Brain + Guardrails ile aynı kurallardan geçer.

**ÖNEMLİ:** Bu epic CANLI EXECUTE ile ilgili DEĞİL. Sadece backtest/strategy tarafında "risk filtresi" ekliyoruz.

---

## Amaç

Strategy idea/param set → Backtest → Metrics → Risk Filter → (Approved / Needs Tuning / Rejected)

Strateji daha canlıya almadan önce, "bu risk profiline sahip bir şeyi normalde kabul eder miyim?" sorusunu aynı beyinle cevaplamış olacağız.

---

## API Endpoint

### POST /api/backtest/risk-evaluate

Backtest sonuçlarını risk değerlendirmesine tabi tutar.

**Request Body:**
```json
{
  "candidate": {
    "id": "strat_candidate_123",
    "name": "Momentum BTC 4h",
    "parameters": {
      "entry_threshold": 0.02,
      "exit_threshold": 0.015,
      "stop_loss": 0.05
    },
    "market": "BTC/USDT",
    "timeframe": "4h",
    "leverage": 5,
    "tags": ["momentum", "btc"],
    "asOfIso": "2025-01-15T12:00:00.000Z"
  },
  "metrics": {
    "pnl": 1250.50,
    "maxDrawdown": 18.5,
    "winRate": 0.65,
    "tradeCount": 45,
    "sharpe": 1.8,
    "sortino": 2.1,
    "volatility": 25.3,
    "asOfIso": "2025-01-15T12:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "candidate": { ... },
  "metrics": { ... },
  "riskScore": 45,
  "regime": "caution",
  "verdict": "approved",
  "reasons": [
    "Risk seviyesi kabul edilebilir (45/100, caution). Canlıda denenebilir (guardrails + onaydan sonra)."
  ],
  "recommendations": null,
  "evaluatedAtIso": "2025-01-15T12:00:00.000Z"
}
```

---

## Verdict Tipleri

### `approved`
Risk seviyesi kabul edilebilir. Canlıda denenebilir (guardrails + onaydan sonra).

**Koşullar:**
- `regime === 'normal'` veya `regime === 'caution'`
- `riskScore < 60`
- `maxDrawdown <= 40%`
- `leverage < 10x` (varsa)

### `needs_tuning`
Parametreleri yumuşat veya risk limitlerini gözden geçir.

**Koşullar:**
- `regime === 'stress'` veya `riskScore >= 60`
- `maxDrawdown > 30%`
- `leverage >= 5x` (varsa)

**Öneriler:**
- Maksimum drawdown limitini düşür
- Kaldıraç seviyesini azalt (3x veya daha düşük)
- Win rate'i artırmak için entry/exit kurallarını gözden geçir
- Volatilite yüksek, pozisyon boyutlarını küçült

### `rejected`
Bu risk profiliyle canlıya yaklaşma.

**Koşullar:**
- `regime === 'panic'` veya `riskScore >= 80`
- `maxDrawdown > 50%`
- `winRate < 0.3`

---

## Risk Skoru Hesaplama

Risk skoru 0-100 arası hesaplanır (yüksek = riskli):

1. **Drawdown faktörü (0-40 puan):**
   - `maxDrawdown > 50%` → 40 puan
   - `maxDrawdown > 30%` → 25 puan
   - `maxDrawdown > 20%` → 15 puan
   - `maxDrawdown > 10%` → 8 puan

2. **Win rate faktörü (0-20 puan):**
   - `winRate < 0.3` → 20 puan
   - `winRate < 0.4` → 12 puan
   - `winRate < 0.5` → 6 puan

3. **Kaldıraç faktörü (0-20 puan):**
   - `leverage >= 10x` → 20 puan
   - `leverage >= 5x` → 12 puan
   - `leverage >= 3x` → 6 puan

4. **Volatilite faktörü (0-10 puan):**
   - `volatility > 50%` → 10 puan
   - `volatility > 30%` → 6 puan
   - `volatility > 20%` → 3 puan

5. **Ardışık kayıplar faktörü (0-10 puan):**
   - `maxConsecutiveLosses >= 10` → 10 puan
   - `maxConsecutiveLosses >= 7` → 6 puan
   - `maxConsecutiveLosses >= 5` → 3 puan

---

## Risk Rejimi Bantları

Risk Architecture Baseline v1 ile aynı bantlar kullanılır:

- **normal:** `riskScore < 40`
- **caution:** `40 <= riskScore < 60`
- **stress:** `60 <= riskScore < 80`
- **panic:** `riskScore >= 80`

---

## DTO'lar

### StrategyCandidateDto
```typescript
interface StrategyCandidateDto {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  market: string;
  timeframe: string;
  leverage?: number;
  tags?: string[];
  description?: string;
  asOfIso: string;
}
```

### BacktestMetricsDto
```typescript
interface BacktestMetricsDto {
  pnl: number;
  maxDrawdown: number;
  winRate: number;
  tradeCount: number;
  sharpe?: number;
  sortino?: number;
  avgTradeDuration?: number;
  maxConsecutiveLosses?: number;
  volatility?: number;
  asOfIso: string;
}
```

### BacktestRiskEvaluationDto
```typescript
interface BacktestRiskEvaluationDto {
  candidate: StrategyCandidateDto;
  metrics: BacktestMetricsDto;
  riskScore: number;
  regime: Regime;
  verdict: 'approved' | 'needs_tuning' | 'rejected';
  reasons: string[];
  recommendations?: string[];
  evaluatedAtIso: string;
}
```

---

## Risk Architecture Baseline v1 ile Uyumluluk

Backtest Risk Filter v1, Risk Architecture Baseline v1'deki policy kurallarıyla uyumludur:

- ✅ Aynı risk rejimi bantları kullanılır
- ✅ Aynı risk skoru mantığı (0-100)
- ✅ Aynı guardrail yaklaşımı (verdict = allowed/blocked benzeri)

**Fark:**
- Canlı risk: Gerçek telemetri verilerine dayanır
- Backtest risk: Backtest metriklerine dayanır
- Her ikisi de aynı "risk anayasası"na göre çalışır

---

## Bilinen Sınırlamalar

1. **Canlı Telemetri Bağlantısı Yok:** Backtest risk değerlendirmesi, canlı telemetri verilerine bağlı değildir. Sadece backtest metriklerine dayanır.

2. **Gerçek Execute Yok:** Bu epic CANLI EXECUTE ile ilgili DEĞİL. Sadece backtest/strategy tarafında "risk filtresi" ekliyoruz.

3. **`totalReturn` Semantiği:**
   - Backend'den gelen `totalReturn` değerinin yüzde (%) mi yoksa mutlak USD değeri mi olduğu netleştirilmeli
   - Şu anda `BacktestRunner` içinde `totalReturn` direkt `pnl` olarak kullanılıyor
   - **TODO:** API response formatına göre dönüşüm mantığı eklenmeli (eğer % ise USD'ye çevirme)
   - Risk scoring tarafında "% vs USD" ayrımı için yer bırakılmalı

---

## Gelecek Geliştirmeler

1. **Canlı Telemetri Entegrasyonu:** Backtest risk değerlendirmesi, canlı telemetri verilerini de hesaba katabilir.

2. **UI Entegrasyonu:** ✅ **TAMAMLANDI** - Backtest ekranında (`BacktestRunner`) risk verdict bloğu (`BacktestRiskPanel`) tam entegre edildi.

3. **Historical Tracking:** Backtest risk değerlendirmelerinin geçmişini takip etmek.

4. **Backtest → Risk Evidence Eşleşmesi:**
   - Tipik senaryolar için ("çok iyi", "orta", "berbat") backtest raporları üretilmeli
   - `/api/backtest/risk-evaluate` çıktıları `evidence/backtest-risk/` altına eklenmeli
   - Bu, ileride policy tuning yaparken altın değerinde olacak
   - **TODO:** Evidence set'i genişletmek için sprint planlanmalı

---

## İlgili Dosyalar

- `packages/@spark/types/src/backtest-risk.ts` - Tip tanımları
- `apps/web-next/src/lib/backtest-risk/policy.ts` - Risk policy logic'i
- `apps/web-next/src/app/api/backtest/risk-evaluate/route.ts` - API endpoint
- `apps/web-next/src/hooks/useBacktestRiskEvaluation.ts` - React hook
- `apps/web-next/src/components/backtest/BacktestRiskPanel.tsx` - UI bileşeni
- `apps/web-next/src/components/studio/BacktestRunner.tsx` - Backtest runner (entegre edildi)
- `docs/BACKTEST_RISK_FILTER_V1.md` - Bu dokümantasyon
- `docs/COPILOT_RISK_BRAIN_V1.md` - Risk Brain dokümantasyonu
- `docs/GUARDRAILS_RISK_ACTIONS_V1.md` - Guardrails dokümantasyonu

---

## Güvenlik Notları

- **Asla Otomatik Execute:** Backtest risk filtresi sadece değerlendirme yapar, otomatik execute yapmaz
- **Sadece Öneri:** Verdict sadece öneridir, gerçek canlıya alma kararı ayrı onay gerektirir
- **Risk Anayasası:** Risk Architecture Baseline v1'deki policy kuralları değişmez, sadece backtest tarafına uygulanır

