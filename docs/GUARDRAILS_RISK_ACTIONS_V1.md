# Guardrails + Risk Actions v1

**Tarih:** 2025-01-15
**Sürüm:** v1.0.0
**Durum:** ✅ Aktif

---

## Genel Bakış

Guardrails + Risk Actions v1, Copilot Risk Brain v1'in ürettiği aksiyonları plan ve dry-run seviyesinde işleyen bir aksiyon yüzeyidir.

**KRİTİK KURAL:** Bu epikte gerçek trade YOK. Tüm aksiyonlar sadece plan/simülasyon amaçlıdır.

---

## Temel Prensipler

### 1. Copilot Asla Direkt Trade Tetiklemez
- Copilot Risk Brain'in ürettiği aksiyonlar sadece **öneri** seviyesindedir
- Gerçek trade/threshold değişimi için ayrı onay mekanizması gereklidir
- Bu epikte: execute = her zaman dry-run

### 2. Aksiyon Akışı
```
Policy Engine → Advice → Plan → Review → Onay → (Ayrı Epic) Gerçek Execute
```

Bu epikte sadece **Plan** ve **Dry-run** aşamaları vardır.

### 3. Onay Mekanizması
- Tüm risk aksiyonları: plan → review → onay → (ayrı epikte) gerçek execute
- Bu epikte: execute endpoint'i her zaman `dryRun: true` olarak çalışır
- Gerçek trade için ayrı "Execution Guardrails" epic'i açılacak

---

## API Endpoints

### POST /api/risk-actions/plan

Risk aksiyon planı oluşturur.

**Request Body:**
```json
{
  "advice": {
    "regime": "caution",
    "riskScore": 55,
    "actions": [...],
    "humanSummary": "...",
    "asOfIso": "..."
  }
}
```

**Response:**
```json
{
  "advice": { ... },
  "candidateActions": [
    {
      "id": "exec_123",
      "type": "reduce_leverage",
      "reason": "...",
      "scope": {
        "leverageTarget": 3
      },
      "dryRun": true,
      "estimatedImpact": {
        "affectedStrategies": 2,
        "affectedPositions": 5,
        "leverageChange": -2
      },
      "asOfIso": "..."
    }
  ],
  "summary": "Risk rejimi: CAUTION (skor: 55/100). 1 aksiyon planlandı: Kaldıraç seviyesi 3x'e düşürülecek. (Bu bir plan/simülasyondur, gerçek trade yapılmaz)",
  "warnings": ["..."],
  "asOfIso": "..."
}
```

---

### POST /api/risk-actions/execute

Risk aksiyonunu simüle eder (DRY-RUN ONLY).

**Request Body:**
```json
{
  "execution": {
    "id": "exec_123",
    "type": "reduce_leverage",
    "reason": "...",
    "scope": {
      "leverageTarget": 3
    },
    "dryRun": true,
    "estimatedImpact": { ... },
    "asOfIso": "..."
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
  "message": "Kaldıraçları 3x'e düşürmeyi DENESEYDİK, 2 stratejide kaldıraç azaltılırdı.",
  "asOfIso": "..."
}
```

**ÖNEMLİ:** Bu endpoint her zaman `dryRun: true` olarak çalışır. Gerçek trade yapılmaz.

---

## Aksiyon Tipleri ve Planlama

### block_new_strategies
- **Plan:** Tüm yeni strateji açılışları engellenecek
- **Scope:** `strategyIds` boş (tüm stratejiler)
- **Execute:** Guardrail config flag'i toggle edilir (simülasyon)

### reduce_leverage
- **Plan:** Mevcut kaldıraç seviyelerinden hedef seviyeye düşürme
- **Scope:** `leverageTarget` (ör. 5x → 3x)
- **Execute:** Her strateji için kaldıraç azaltma komutu (simülasyon)

### close_positions
- **Plan:** Yüksek riskli pozisyonların listesi
- **Scope:** `positionIds` (kapatılacak pozisyonlar)
- **Execute:** Her pozisyon için kapatma komutu (simülasyon)

### no_action
- **Plan:** Plan oluşturulmaz
- **Execute:** Komut yok

---

## UI Davranışı

### RightRailCopilotAdvice Component

**Normal Rejim:**
- Sadece "Aksiyon yok" mesajı gösterilir
- Buton görünmez

**Caution/Stress/Panic Rejim:**
- "Aksiyon Planı Oluştur" butonu görünür
- Butona tıklanınca `/api/risk-actions/plan` çağrılır
- Plan özeti gösterilir
- (Opsiyonel) "Dry-run Çalıştır" butonu eklenebilir

---

## Bilinen Sınırlamalar

1. **Gerçek Trade Yok:** Bu epikte gerçek trade/threshold değişimi yok. Sadece plan + dry-run.

2. **Portfolio Verisi:** ✅ Epic C tamamlandı - Artık gerçek portfolio verisi kullanılıyor. Planlar gerçek strateji/pozisyon ID'leri içeriyor. Buna rağmen bu epikte hâlâ sadece dry-run vardır.

3. **Onay Mekanizması:** Gerçek execute için onay mekanizması henüz yok. Ayrı epic'te eklenecek.

4. **Execution Guardrails:** Gerçek trade için ayrı "Execution Guardrails" epic'i açılacak.

---

## Gelecek Geliştirmeler

1. **Gerçek Portfolio Entegrasyonu:** Portfolio service'ten gerçek strateji/pozisyon verilerini almak.

2. **Onay Mekanizması:** Plan → Review → Onay → Execute akışı.

3. **Execution Guardrails:** Gerçek trade için guardrails ve onay mekanizması.

4. **Historical Tracking:** Planların ve simülasyonların geçmişini takip etmek.

---

## İlgili Dosyalar

- `apps/web-next/src/lib/risk-actions/planner.ts` - Plan oluşturma logic'i
- `apps/web-next/src/app/api/risk-actions/plan/route.ts` - Plan endpoint
- `apps/web-next/src/app/api/risk-actions/execute/route.ts` - Execute (dry-run) endpoint
- `apps/web-next/src/components/right-rail/RightRailCopilotAdvice.tsx` - UI component
- `packages/@spark/types/src/right-rail.ts` - Tip tanımları
- `docs/COPILOT_RISK_BRAIN_V1.md` - Risk Brain dokümantasyonu

---

## Güvenlik Notları

- **Asla Otomatik Trade:** Copilot asla otomatik olarak trade tetiklemez
- **Her Zaman Onay:** Gerçek trade için mutlaka kullanıcı onayı gereklidir
- **Dry-run Varsayılan:** Bu epikte tüm execute işlemleri dry-run modunda çalışır
- **Policy Değişmez:** Policy engine'in kararları değişmez, sadece plan/simülasyon üretilir

