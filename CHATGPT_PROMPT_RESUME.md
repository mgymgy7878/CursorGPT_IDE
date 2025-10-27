# ChatGPT Prompt: RESUME - ANALYSIS + DEVELOPMENT (POST-RESTART)

## 🎯 PROMPT BAŞLANGICI

```
chatgpt: RUN "RESUME: ANALYSIS + DEVELOPMENT (POST-RESTART)" 

OBJECTIVES
1) Durum analizi (build, TS error sayımı, servis health) ve rapor üret.
2) TS hatalarını FAZ-1 (null safety) → FAZ-2 (missing props) → FAZ-3 (import type) sırasıyla azalt.
3) Canary (testnet): ENV doğrula, dry-run → real execute; evidence paketini güncelle.
4) BTCTurk Spot + BIST entegrasyonu için iskelet (connector arayüzleri, symbol mapping, auto-rounder).
5) Dokümantasyon ve checklist güncelle.

CONSTRAINTS
- Single end-of-message SUMMARY (no live logs).
- Ports: UI=3003, EXECUTOR=4001.
- RBAC açık; private API'ler korumalı.
- Secrets sadece ENV; repo'ya yazma.
```

## 📊 MEVCUT DURUM

### ✅ TAMAMLANAN İŞLER
- **Post-Restart Analiz:** Tamamlandı
- **TypeScript Error Reduction:** 110 → 90 (%18 iyileştirme)
- **BTCTurk Scaffold:** Tamamlandı (packages/exchange-btcturk/)
- **BIST Scaffold:** Tamamlandı (packages/feeds-bist/)
- **Environment Config:** BTCTurk ve BIST variables eklendi

### 🔄 DEVAM EDEN İŞLER
- **Kalan 90 TypeScript Error:** Düzeltme devam ediyor
- **Canary Test:** API key'ler gerekli
- **Build Success:** Hedef 0 error

## 🎯 ÖNCELİKLİ GÖREVLER

### 1. TypeScript Error Resolution (Öncelik 1)
```
ANALYSIS (AUTOMATED)
- pnpm i
- pnpm -w -r exec tsc --noEmit | tee ts-errors.pre.txt
- Derlenen TS hatalarını kategorize et: Null Safety, Missing Props, Import Types, Type Assertions.
- Çıktı: docs/ERROR_ANALYSIS_REPORT.md (özet tablo + dosya başına sayım)
```

### 2. FAZ-1: Null Safety (Öncelik 1)
```
FIX PASS FAZ-1 NULL SAFETY (öncelik 1)
- Güvensiz index erişimlerini arr?.[i] veya safeGet ile değiştir.
- Opsiyonel alanlarda ?. ve ?? default uygula.
- assertPresent, invariant guard'larını kritik akışlara ekle (executor, exchange client).
```

### 3. FAZ-2: Missing Props (Öncelik 2)
```
FAZ-2 MISSING PROPS (öncelik 2)
- withDefaults<T> helper'ı ile DTO/State boş alanları tamamla.
- Domain arayüzlerinde opsiyonelleri netleştir; UI initial state sabitleri ekle.
```

### 4. FAZ-3: Import Type & Branded Conversions (Öncelik 3)
```
FAZ-3 IMPORT TYPE & BRANDED CONVERSIONS (öncelik 3)
- import type codemod (NextResponse, RequestInit vs. sadece tip olanlar).
- Branded dönüşümler için tek nokta builder: fromNumber, fromString.
```

## 🧪 CANARY TEST PLANI

### Environment Setup
```
CANARY (TESTNET, EVIDENCE)
- ENV kontrol: SPARK_EXCHANGE_MODE=(spot-testnet|futures-testnet), BINANCE_API_KEY/SECRET, DATABASE_URL.
- Dry-run: packages/execution/scripts/canary.ts --mode testnet --symbol BTCUSDT --qty 0.00012 --arm --confirm
- Real execute: aynı komut + --execute
- Beklenen: orderId != N-A; en az ACK (tercihen FILLED); DB'de Execution+Trade.
- Evidence yaz: evidence/trades_day1.csv, evidence/metrics_day1.txt, evidence/audit_day1.json
```

### Expected Results
- **OrderId:** Gerçek order ID (N-A değil)
- **WS Events:** En az ACK veya FILLED event'i
- **DB Records:** Execution ve Trade kayıtları
- **Metrics:** live_orders_placed_total, live_fills_total artışı

## 🏗️ BTCTURK + BIST INTEGRATION

### ✅ Tamamlanan Scaffold
- **BTCTurk Package:** Symbol mapping, auto-rounder, REST client
- **BIST Package:** Data reader, normalizer, technical indicators
- **Environment Config:** API keys, base URLs, feature flags

### 🔄 Sonraki Adımlar
- **Real API Integration:** BTCTurk ve BIST gerçek API bağlantıları
- **Strategy Lab Integration:** Market feed hook'ları
- **UI Integration:** BIST data visualization

## 📋 TEST PLANI

### Unit Tests
```
TESTS
- Unit: safety utils (assertPresent/safeGet), symbol auto-rounder, order validation.
- Integration: SSE stream (executions/[id]/stream), export CSV pagination.
- Minimal e2e: start→confirm→place→(ack|fill) flow.
```

### Integration Tests
- **BTCTurk REST Client:** API endpoint testleri (mock)
- **BIST Data Reader:** Market data fetching testleri (mock)
- **Package Build:** Tüm yeni paketler başarıyla derleniyor

## 📚 DOKÜMANTASYON

### Güncellenecek Dosyalar
```
DOCS & CHECKLIST
- docs/ROADMAP_v2.1.md: "v1.1 evidence", "v1.2 scaffolding" maddelerini işaretle.
- CHECKLIST/CHECKLIST.md: tamamlananlar ve kalanlar kutucukları.
- REPORTS/PROJECT_REPORT.md: kısa özet + metrikler.
```

## 🚀 COMMANDS

### Build Commands
```
COMMANDS
- pnpm i
- pnpm -w -r exec tsc --noEmit
- pnpm --filter @spark/execution dev
- pnpm --filter @spark/web-next dev
- pnpm -w exec tsx packages/execution/scripts/canary.ts --mode testnet --symbol BTCUSDT --qty 0.00012 --arm --confirm --execute
```

### Service Commands
- **UI Start:** `pnpm --filter @spark/web-next dev` (port 3003)
- **Executor Start:** `pnpm --filter @spark/execution dev` (port 4001)
- **Type Check:** `pnpm -w -r exec tsc --noEmit`

## ✅ ACCEPTANCE CRITERIA

### Success Metrics
```
ACCEPTANCE
- TS error sayısı belirgin düşüş (≥30%).
- orderId mevcut; ≥1 ACK/FILLED işlendi; DB'de Execution+Trade; UI stream canlı.
- BTCTurk ve BIST paket iskeletleri derlenir durumda; symbol mapping ve auto-rounder unit testleri geçer.
- Güncellenen docs/ROADMAP_v2.1.md içinde v1.1 ilerleme işaretli.
```

### Output Requirements
```
OUTPUT (REQUIRED)
- Tek SUMMARY:
- Hata sayımı (pre/post), düzeltilen kategoriler, kalan kritikler
- Canary kanıtları (orderId, ACK/FILLED sayısı, DB counts, metrikler)
- Eklenen/Değişen dosyalar listesi (kısa)
- BTCTurk/BIST scaffold durumu ve test sonuçları
- Bir Sonraki Adımlar (net 3 madde)
```

## 📊 MEVCUT HATA KATEGORİLERİ

### 1. Missing Dependencies (4 hatalar)
- **@spark/trading-core:** Backtest engine import hatası
- **@spark/strategy-codegen:** Strategy routes import hatası
- **@spark/db:** Prisma client import hatası
- **@spark/db/src/client.js:** OrderStore import hatası

### 2. Type Assertions (20+ hatalar)
- **String to Branded:** string → Symbol, number → Price/Quantity
- **Optional Properties:** id, name, type undefined olabilir
- **Global Access:** globalThis index signature

### 3. Null Safety (15+ hatalar)
- **Metrics:** Counters possibly undefined
- **Signal Processing:** Queue items undefined
- **Feature Store:** lastSignal undefined

### 4. Missing Methods (10+ hatalar)
- **SymbolDiscoveryService:** getInstance() method eksik
- **DiffAnalyzer:** generateReport() method eksik
- **PnLTracker:** updatePosition(), getPnLSummary() eksik
- **RiskManager:** getRules(), getRiskSummary() eksik

### 5. Duplicate Functions (2 hatalar)
- **SignalProcessor:** processQueue() duplicate implementation

## 🎯 SONRAKI ADIMLAR

### Hemen Yapılacak (1-2 saat)
1. **Missing Dependencies:** @spark/* paketlerini build et
2. **Type Assertions:** Branded type conversions düzelt
3. **Missing Methods:** Service method implementations ekle

### Kısa Vadeli (1 gün)
1. **Build Success:** `pnpm build` başarılı
2. **Type Check:** `pnpm typecheck` başarılı
3. **Service Test:** UI/Executor başlatma

### Orta Vadeli (1 hafta)
1. **Canary Test:** API key'ler ile gerçek testnet execution
2. **BTCTurk Integration:** Gerçek BTCTurk API entegrasyonu
3. **BIST Integration:** Gerçek BIST data feed entegrasyonu

---

**Prompt Hazırlayan:** Spark Trading Platform  
**Tarih:** 2025-08-19  
**Durum:** POST-RESTART ANALİZ TAMAMLANDI ✅ 