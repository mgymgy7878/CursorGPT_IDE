# Execution Guardrails v1

**Tarih:** 2025-01-15
**Sürüm:** v1.0.0
**Durum:** ✅ Aktif

---

## Genel Bakış

Execution Guardrails v1, RiskActionPlan → ExecutionRequest → Guardrail değerlendirmesi → Dry-run execute hattını tasarlar.

**KRİTİK KURAL:** Bu epikte gerçek trade YOK. Sadece guardrail değerlendirmesi + simülasyon vardır.

**Amaç:**
"Bu plan bir gün gerçekten uygulanacaksa, hangi şartlarda 'olur' diyeceğiz?" sorusuna cevap veren katmanı kurmak.

---

## Temel Prensipler

### 1. Gerçek Execute Henüz Yok
- Bu epikte gerçek trade/threshold değişimi yok
- Tüm execute çağrıları `dryRun: true` olarak çalışır
- Sadece guardrail değerlendirmesi + simülasyon üretilir

### 2. Guardrail Değerlendirmesi
- Her execution request önce guardrail engine'den geçer
- `allowed: true/false` + `reasons[]` + `requiredApprovals[]` döner
- Bloklanan execution'lar simüle edilir ama "bloklandı" mesajı ile

### 3. Onay Modeli (Taslak)
- Gelecekte gerçek execute için onay mekanizması tasarlanmış
- `requiredApprovals` listesi döner ama henüz onay akışı yok
- Gerçek execute için ayrı epic gereklidir

---

## API Endpoints

### POST /api/risk-actions/execute

Execution request'i alır, guardrail değerlendirmesi yapar, dry-run simülasyon üretir.

**Request Body:**
```json
{
  "executionRequest": {
    "planId": "plan_123",
    "selectedActionIds": ["exec_1", "exec_2"],
    "environment": "sim",
    "confirmRequired": true,
    "requestedBy": "user_123",
    "requestedAtIso": "2025-01-15T12:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "executionId": "dryrun_123",
  "type": "reduce_leverage",
  "dryRun": true,
  "simulatedCommands": [
    {
      "command": "reduce_leverage",
      "target": "strategy_1",
      "params": {
        "currentLeverage": 5,
        "targetLeverage": 3,
        "reason": "..."
      }
    }
  ],
  "estimatedImpact": {
    "affectedStrategies": 2,
    "affectedPositions": 5,
    "leverageChange": -2
  },
  "message": "2 aksiyon simüle edildi: 2 komut üretildi.",
  "guardrailResult": {
    "allowed": true,
    "reasons": [],
    "requiredApprovals": ["risk_officer", "owner:strategy_1"],
    "evaluatedAtIso": "2025-01-15T12:00:00.000Z"
  },
  "asOfIso": "2025-01-15T12:00:00.000Z"
}
```

**Bloklanan Execution Örneği:**
```json
{
  "executionId": "dryrun_123",
  "dryRun": true,
  "simulatedCommands": [],
  "estimatedImpact": { ... },
  "message": "Simülasyon tamamlandı, fakat guardrails bu aksiyonları blokluyor. ",
  "guardrailResult": {
    "allowed": false,
    "reasons": [
      {
        "code": "PANIC_REGIME",
        "message": "Panik rejimi aktif. Execution bloklandı.",
        "severity": "error"
      }
    ],
    "requiredApprovals": [],
    "evaluatedAtIso": "..."
  }
}
```

---

## Guardrail Kuralları (v1)

### 1. Risk Score ve Regime Kontrolü

**Kural:**
- `regime === 'panic'` veya `riskScore >= 80` → `allowed = false`
- `environment === 'prod'` ve `riskScore >= 60` → `allowed = false`

**Kod:**
```typescript
if (regime === 'panic' || riskScore >= 80) {
  allowed = false;
  reasons.push({
    code: regime === 'panic' ? 'PANIC_REGIME' : 'RISK_SCORE_TOO_HIGH',
    message: '...',
    severity: 'error',
  });
}
```

---

### 2. Exchange Health Kontrolü

**Kural:**
- Hedeflenen pozisyonların bağlı olduğu borsada `status !== 'up'` → `allowed = false`

**Kod:**
```typescript
const degradedExchanges = exchangeHealth.exchanges?.filter(
  (e: any) => e.status !== 'up'
) || [];

if (degradedExchanges.length > 0 && affectedExchanges.size > 0) {
  allowed = false;
  reasons.push({
    code: 'EXCHANGE_DEGRADED',
    message: `${degradedExchanges.length} borsa sorunlu: ...`,
    severity: 'error',
  });
}
```

---

### 3. Batch Size Kontrolü

**Kural:**
- `close_positions` aksiyonu için: `affectedPositions > 200` → `allowed = false`

**Kod:**
```typescript
if (action.type === 'close_positions') {
  const positionCount = action.estimatedImpact?.affectedPositions || 0;
  if (positionCount > MAX_POSITIONS_BATCH_CLOSE) {
    allowed = false;
    reasons.push({
      code: 'BATCH_SIZE_TOO_LARGE',
      message: `Kapatılacak pozisyon sayısı çok yüksek (${positionCount})...`,
      severity: 'error',
    });
  }
}
```

---

## Onay Gereksinimleri

### Required Approvals Listesi

**Her Durumda:**
- `risk_officer` - Risk yöneticisi onayı

**Prod Ortamında:**
- `portfolio_manager` - Portföy yöneticisi onayı

**Yüksek Risk Skoru (>= 50):**
- `risk_manager` - Risk müdürü onayı

**Strateji Sahipleri:**
- `owner:strategy_123` - Her etkilenen strateji için sahip onayı

**Örnek:**
```json
{
  "requiredApprovals": [
    "risk_officer",
    "portfolio_manager",
    "risk_manager",
    "owner:strategy_1",
    "owner:strategy_2"
  ]
}
```

---

## Guardrail Reason Kodları

| Kod | Açıklama | Severity |
|-----|----------|----------|
| `PANIC_REGIME` | Panik rejimi aktif | error |
| `RISK_SCORE_TOO_HIGH` | Risk skoru çok yüksek (>= 80) | error |
| `RISK_SCORE_TOO_HIGH_PROD` | Prod ortamında risk skoru çok yüksek (>= 60) | error |
| `EXCHANGE_DEGRADED` | Hedef borsa sorunlu | error |
| `EXCHANGE_HEALTH_UNKNOWN` | Exchange health bilgisi alınamadı | warning |
| `BATCH_SIZE_TOO_LARGE` | Batch size limiti aşıldı | error |
| `EXECUTION_BLOCKED` | Execution guardrails tarafından bloklandı | error |
| `EXECUTION_ERROR` | Execution hatası | error |

---

## Bilinen Sınırlamalar

1. **Gerçek Trade Yok:** Bu epikte gerçek trade/threshold değişimi yok. Sadece guardrail değerlendirmesi + simülasyon.

2. **Onay Akışı Yok:** `requiredApprovals` listesi döner ama henüz onay akışı implementasyonu yok. Gerçek execute için ayrı epic gereklidir.

3. **Sabit Config:** Guardrail kuralları şu an sabit config'de. İleride config dosyasına/DB'ye taşınabilir.

4. **Exchange Mapping:** Pozisyon ID'lerinden exchange bilgisi henüz tam entegre değil.

---

## Gelecek Geliştirmeler

1. **Gerçek Execute:** Onay akışı + gerçek trade implementasyonu
2. **Config Management:** Guardrail kurallarını config dosyasına/DB'ye taşımak
3. **Onay Akışı:** `requiredApprovals` listesini kullanarak onay akışı implementasyonu
4. **Historical Tracking:** Guardrail değerlendirmelerinin geçmişini takip etmek

---

## İlgili Dosyalar

- `apps/web-next/src/lib/risk-actions/guardrails.ts` - Guardrail engine
- `apps/web-next/src/app/api/risk-actions/execute/route.ts` - Execute endpoint (güncellendi)
- `packages/@spark/types/src/right-rail.ts` - Tip tanımları
- `docs/GUARDRAILS_RISK_ACTIONS_V1.md` - Guardrails + Aksiyon Yüzeyi dokümantasyonu

---

## Güvenlik Notları

- **Asla Otomatik Execute:** Guardrail engine sadece değerlendirme yapar, otomatik execute yapmaz
- **Her Zaman Dry-run:** Bu epikte tüm execute işlemleri dry-run modunda çalışır
- **Onay Zorunlu:** Gerçek execute için mutlaka onay mekanizması gereklidir
- **Bloklanan Execution'lar:** Bloklanan execution'lar simüle edilir ama "bloklandı" mesajı ile döner

