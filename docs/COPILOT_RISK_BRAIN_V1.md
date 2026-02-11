# Copilot Risk Brain v1

**Tarih:** 2025-01-15
**Sürüm:** v1.0.0
**Durum:** ✅ Aktif

---

## Genel Bakış

Copilot Risk Brain v1, RightRail telemetri verilerini analiz ederek deterministik risk tavsiyeleri üreten bir policy engine'dir. LLM katmanı olmadan, sadece policy tablosuna göre çalışır.

**Önemli Not:** Bu endpoint sadece öneri üretir; gerçek trade/threshold değişimi ayrı onay gerektirir.

---

## Girdi

### RightRailSnapshotDto
RightRail aggregator endpoint'inden (`/api/right-rail`) gelen snapshot verisi:
- `topRisks`: Portföy risk özeti
- `systemStatus`: Sistem durumu (API, WS, Executor)
- `exchangeHealth`: Borsa sağlığı (Binance, BTCTurk, BIST)

### RightRailSummaryDto
RightRail summary endpoint'inden (`/api/right-rail/summary`) gelen özet verisi:
- `riskScore`: 0-100 arası risk skoru (yüksek = riskli)
- `regime`: `normal` | `caution` | `stress` | `panic`
- `summary`: Tek paragraf risk özeti
- `bullets`: Madde madde risk noktaları

---

## Çıktı

### CopilotRiskAdviceDto

```typescript
interface CopilotRiskAdviceDto {
  regime: Regime;              // normal | caution | stress | panic
  riskScore: number;           // 0-100 (RightRailSummaryDto'dan)
  actions: RiskAction[];       // Önerilen aksiyonlar (öncelik sırasına göre)
  humanSummary: string;        // İnsan okunabilir özet
  asOfIso: string;             // ISO 8601 timestamp
}

interface RiskAction {
  type: RiskActionType;        // reduce_leverage | block_new_strategies | close_positions | no_action
  reason: string;               // İnsan okunabilir açıklama
}
```

---

## Policy Tablosu

### Normal Rejim (riskScore < 40)
- **Aksiyon:** `no_action`
- **Açıklama:** Sistem normal çalışıyor, risk seviyesi düşük. Guardrails dahil yeni strateji açılabilir.

### Caution Rejim (riskScore 40-60)
- **Aksiyon 1:** `block_new_strategies`
  - Yeni strateji açmayı durdur, özellikle kaldıraçlı pozisyonlar
- **Aksiyon 2:** `reduce_leverage` (opsiyonel)
  - Eğer drawdown limit'in %60'ına ulaştıysa kaldıraçları düşürmeyi düşün

### Stress Rejim (riskScore 60-80)
- **Aksiyon 1:** `reduce_leverage` (zorunlu)
  - Mevcut pozisyonlarda kaldıraçları düşür
- **Aksiyon 2:** `block_new_strategies`
  - Yeni pozisyon açmayı durdur, mevcut pozisyonları gözden geçir

### Panic Rejim (riskScore >= 80)
- **Aksiyon 1:** `close_positions` (yüksek riskli subset için)
  - En riskli strateji drawdown limitine yaklaştıysa pozisyonları kapatmayı düşün
- **Aksiyon 2:** `block_new_strategies` (zorunlu)
  - Tüm yeni strateji açılışlarını durdur
- **Aksiyon 3:** `reduce_leverage` (zorunlu)
  - Tüm pozisyonlarda kaldıraçları acilen düşür

---

## API Endpoint

### GET /api/copilot/risk-advice

**Request:** Yok (GET endpoint)

**Response:**
```json
{
  "regime": "caution",
  "riskScore": 55,
  "actions": [
    {
      "type": "block_new_strategies",
      "reason": "Risk seviyesi artmış durumda. Yeni strateji açmayı durdur, özellikle kaldıraçlı pozisyonlar."
    },
    {
      "type": "reduce_leverage",
      "reason": "Günlük max drawdown limitin %65'sine ulaştı. Kaldıraçları düşürmeyi düşün."
    }
  ],
  "humanSummary": "Risk rejimi: CAUTION (skor: 55/100). Önerilen aksiyonlar: kaldıraçları düşür, yeni strateji açmayı durdur. ⚠️ Günlük max drawdown limitin %65'sine ulaştı.",
  "asOfIso": "2025-01-15T12:00:00.000Z"
}
```

**Degrade Mod:**
Telemetry verisi alınamazsa:
- `regime: 'panic'`
- `riskScore: 100`
- `actions: [{ type: 'block_new_strategies', reason: 'Telemetry unavailable' }]`

---

## Kullanım Senaryoları

### 1. Normal Operasyon
Risk skoru düşük olduğunda, sistem normal çalışır ve yeni stratejiler açılabilir.

### 2. Risk Artışı
Drawdown limit'e yaklaştığında veya sistem durumu bozulduğunda, yeni strateji açılışları engellenir.

### 3. Yüksek Risk
Stres veya panik rejiminde, mevcut pozisyonlarda kaldıraç azaltılır ve yüksek riskli pozisyonlar kapatılır.

### 4. Telemetry Hatası
Telemetry verisi alınamazsa, temkinli bir yaklaşım benimsenir ve tüm yeni strateji açılışları engellenir.

---

## LLM Enrichment

### GET /api/copilot/risk-advice/llm

Deterministik policy çıktısını bozmadan, LLM ile daha zengin açıklama ve senaryo üretir.

**ÖNEMLİ:** Policy engine'in kararları değişmez, LLM sadece "anlatıcı" rolündedir.

**Request:** Yok (GET endpoint)

**Response:**
```json
{
  "advice": {
    "regime": "caution",
    "riskScore": 55,
    "actions": [...],
    "humanSummary": "...",
    "asOfIso": "..."
  },
  "llmSummary": "Risk seviyesi artmış durumda. Dikkatli olmanız ve mevcut pozisyonlarınızı gözden geçirmeniz önerilir...",
  "scenarios": [
    "Eğer risk iştahınız düşükse, kaldıraçları azaltmayı önceliklendirin.",
    "Eğer mevcut pozisyonlarınız karlıysa, pozisyonları korumayı düşünebilirsiniz.",
    "Eğer piyasa volatilitesi artarsa, tüm yeni pozisyon açılışlarını durdurun."
  ],
  "asOfIso": "2025-01-15T12:00:00.000Z"
}
```

**LLM Prompt Guardrails:**
1. Aksiyon tiplerini (reduce_leverage, block_new_strategies, close_positions, no_action) **ASLA** değiştirme veya yenisini ekleme
2. RiskScore ve regime değerlerini **AYNEN** koru, değiştirme
3. Sadece açıklama ve senaryo metinleri üret, karar mantığını değiştirme
4. Policy engine'in kararları değişmez, LLM sadece "anlatıcı" rolündedir

**LLM Provider Configuration:**

Environment variable'ları:
- `LLM_PROVIDER`: `openai` | `anthropic` | `custom` (varsayılan: `openai`)
- `LLM_API_URL`: LLM API endpoint URL'i
- `LLM_API_KEY`: LLM API anahtarı
- `LLM_MODEL`: Model adı (varsayılan: OpenAI için `gpt-4o-mini`, Anthropic için `claude-3-haiku-20240307`)
- `LLM_TIMEOUT_MS`: Timeout süresi (ms, varsayılan: 10000)
- `LLM_MAX_TOKENS`: Maksimum token sayısı (varsayılan: 500)
- `LLM_TEMPERATURE`: Temperature değeri (varsayılan: 0.7)

**Desteklenen LLM Provider'lar:**
- **OpenAI**: `https://api.openai.com/v1/chat/completions`
- **Anthropic**: `https://api.anthropic.com/v1/messages`
- **Custom**: Özel LLM servisi (generic HTTP endpoint)

**Degrade Mod:**
- LLM servisi yapılandırılmamışsa (`LLM_API_URL` veya `LLM_API_KEY` yok), mock LLM response kullanılır
- LLM API çağrısı başarısız olursa (timeout, hata), mock LLM response kullanılır
- Deterministik `advice` her zaman döner, LLM sadece enrichment sağlar
- Policy engine'in kararları **hiçbir durumda** değişmez

---

## Bilinen Sınırlamalar

1. **LLM Entegrasyonu:** LLM servisi yapılandırılmamışsa mock response kullanılır. Gerçek LLM API çağrısı için environment variable'lar yapılandırılmalı (`.env.local` dosyasına bakın).

2. **Sadece Öneri:** Bu endpoint sadece öneri üretir; gerçek trade/threshold değişimi ayrı onay gerektirir.

3. **Telemetry Bağımlılığı:** RightRail telemetri verilerine bağımlı. Telemetry alınamazsa temkinli default döner.

4. **Portfolio Mapping:** Portfolio service entegrasyonu henüz tam değil, bazı risk analizleri mock veri üzerinden çalışıyor.

---

## Gelecek Geliştirmeler

1. **LLM Entegrasyonu:** ✅ Tamamlandı - OpenAI, Anthropic ve custom provider desteği eklendi. Environment variable'lar yapılandırıldığında gerçek LLM API çağrısı yapılır.

2. **Otomatik Aksiyon:** Onay mekanizması ile belirli aksiyonlar otomatik olarak uygulanabilir.

3. **Historical Analysis:** Geçmiş risk rejimleri ve aksiyonların etkinliği analiz edilebilir.

4. **Custom Policies:** Kullanıcılar kendi risk policy'lerini tanımlayabilir.

---

## İlgili Dosyalar

- `apps/web-next/src/lib/risk-policy/engine.ts` - Policy engine implementasyonu
- `apps/web-next/src/app/api/copilot/risk-advice/route.ts` - Deterministik API endpoint
- `apps/web-next/src/app/api/copilot/risk-advice/llm/route.ts` - LLM enrichment endpoint
- `packages/@spark/types/src/right-rail.ts` - Tip tanımları
- `apps/web-next/src/app/api/right-rail/route.ts` - RightRail aggregator
- `apps/web-next/src/app/api/right-rail/summary/route.ts` - RightRail summary
