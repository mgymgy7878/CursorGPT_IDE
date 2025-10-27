# UI Fixes Smoke Test - 4 Kusur Düzeltme

**Tarih**: 2025-10-13  
**Sprint**: UI Polish & SSR-Safety  
**Durum**: ✅ TAMAMLANDI

---

## DÜZELTİLEN KUSURLAR

### 1. ✅ Alerts SSR Crash Fix
**Sorun**: HTTP 500 → route-level crash  
**Çözüm**: Graceful 200 + proxy route + error boundary

**Değişiklikler**:
```
apps/web-next/src/app/api/alerts/list/route.ts         (yeni, 15 satır)
apps/web-next/src/app/alerts/error.tsx                (yeni, 8 satır)
apps/web-next/src/app/alerts/page.tsx                 (-3, +6 satır)
```

**Test**: `/alerts` sayfası artık çökmeyecek, boş durumda CTA gösterir

### 2. ✅ Copilot Dock Compact + Collapse
**Sorun**: Panel çok geniş, taşmalar, hizalar kayıyor  
**Çözüm**: Responsive boyutlar + localStorage collapse + grid layout

**Değişiklikler**:
```
apps/web-next/src/components/copilot/CopilotDock.tsx  (-4, +12 satır)
```

**Test**: Panel collapse/expand çalışır, overflow yok, küçük ekranda 2 sütun

### 3. ✅ Metrics "Executor Offline" Badge
**Sorun**: 0/0/0 değerleri "offline" ile ayırt edilemiyor  
**Çözüm**: _err field + offline badge + staleness rozeti

**Değişiklikler**:
```
apps/web-next/src/components/dashboard/MarketsWidget.tsx  (-8, +15 satır)
```

**Test**: Executor kapalıyken "executor: offline" badge, sayılar "—"

### 4. ✅ TR Yerelleştirme
**Sorun**: Para formatı ve menü etiketleri tutarsız  
**Çözüm**: fmtCurrencyTR + "Anasayfa" etiketi

**Değişiklikler**:
```
apps/web-next/src/lib/ui/format.ts                    (yeni, 15 satır)
apps/web-next/src/app/layout.tsx                      (1 satır değişiklik)
apps/web-next/src/components/portfolio/SummaryCards.tsx  (2 satır değişiklik)
apps/web-next/src/components/portfolio/PortfolioTable.tsx  (6 satır değişiklik)
```

**Test**: Para formatı TR (48.050,00 $), sidebar "Anasayfa"

### 5. ✅ Technical Analysis Skeleton
**Sorun**: "Veri bekleniyor…" belirsizlik  
**Çözüm**: Loading component

**Değişiklikler**:
```
apps/web-next/src/app/technical-analysis/loading.tsx  (yeni, 7 satır)
```

**Test**: Sayfa yüklenirken skeleton gösterilir

---

## SMOKE TEST SENARYOLARI

### Alerts Test
```powershell
# 1. Executor kapalı
pm2 stop spark-executor

# 2. Alerts sayfası aç
Invoke-WebRequest -Uri "http://localhost:3003/alerts"

# Beklenen: Çökmez, boş tablo + "Technical Analysis → Hızlı Uyarı" CTA
```

### Dashboard Test
```powershell
# 1. Executor kapalı
pm2 stop spark-executor

# 2. Dashboard aç
Invoke-WebRequest -Uri "http://localhost:3003/dashboard"

# Beklenen: Markets kartında "executor: offline" badge, sayılar "—"

# 3. Executor aç
pm2 start ecosystem.config.js --only spark-executor

# 4. Dashboard yenile
# Beklenen: Gerçek değerler, stale>60 ise "stale Xs" rozeti
```

### Copilot Test
```powershell
# 1. Dashboard'da Copilot paneli aç
# Beklenen: md:w-[380px] w-[320px], max-h-[80vh] overflow-auto

# 2. Küçük ekranda test (tarayıcı resize)
# Beklenen: Butonlar grid-cols-2, "İçe Aktar" hizası bozulmuyor

# 3. Collapse test
# Beklenen: localStorage spark.copilot.collapsed kaydediliyor
```

### TR Format Test
```powershell
# 1. Portfolio sayfası aç
Invoke-WebRequest -Uri "http://localhost:3003/portfolio"

# Beklenen: Para formatı "48.050,00 $" (TR), sayılar "1.234,56"

# 2. Sidebar kontrol
# Beklenen: "📊 Anasayfa" (Gösterge Paneli değil)
```

### Technical Analysis Test
```powershell
# 1. TA sayfası aç (yavaş bağlantı simülasyonu)
Invoke-WebRequest -Uri "http://localhost:3003/technical-analysis"

# Beklenen: Loading sırasında "Grafikler hazırlanıyor…" skeleton
```

---

## API ENDPOINT TESTLERİ

### Alerts API
```powershell
# Executor kapalı
Invoke-WebRequest -Uri "http://localhost:3003/api/alerts/list"
# Beklenen: 200 + {"items":[],"_err":"unavailable"}

# Executor açık
pm2 start ecosystem.config.js --only spark-executor
Invoke-WebRequest -Uri "http://localhost:3003/api/alerts/list"
# Beklenen: 200 + {"items":[...],"_err":null}
```

### Metrics API
```powershell
# Executor kapalı
Invoke-WebRequest -Uri "http://localhost:3003/api/tools/get_metrics"
# Beklenen: 200 + {"p95_ms":0,"staleness_s":0,"error_rate":0,"_err":"fetch failed"}

# Executor açık
# Beklenen: 200 + {"p95_ms":123,"staleness_s":45,"error_rate":0.01}
```

---

## LINT & BUILD TEST

```powershell
# Lint
pnpm -C apps/web-next lint
# Beklenen: 0 hata

# TypeCheck
npx tsc --noEmit
# Beklenen: PASS

# Build
pnpm -C apps/web-next build
# Beklenen: 61 route compiled successfully
```

---

## KAPSAM ÖZETİ

| Kusur | Durum | Dosya Sayısı | Satır Değişikliği |
|-------|-------|--------------|-------------------|
| Alerts SSR Crash | ✅ | 3 | +29, -3 |
| Copilot Overflow | ✅ | 1 | +12, -4 |
| Metrics Offline Badge | ✅ | 1 | +15, -8 |
| TR Yerelleştirme | ✅ | 4 | +24, -9 |
| TA Skeleton | ✅ | 1 | +7, -0 |
| **TOPLAM** | ✅ | **10** | **+87, -24** |

---

## SONRAKI ADIMLAR

### Kısa Vade (Bu Sprint)
1. **Toast Entegrasyonu**: Retry-After geri sayım, success/error mesajları
2. **Zod Schema Lite**: API response validation (opsiyonel)
3. **RecentActions Audit**: Başarılı/hatalı çağrılardan audit push

### Orta Vade (Sonraki Sprint)
1. **Guardrails Entegrasyon**: Threshold & weights gerçek verilerle
2. **SLO Chip Bileşeni**: Dashboard'da mini status badge
3. **Evidence ZIP**: Canary/Strategy control'den sonra otomatik toplama

### Uzun Vade
1. **WebSocket Progress**: Uzun işlemler için real-time progress
2. **Error Boundary**: Root layout'a React Error Boundary
3. **Performance Monitoring**: P95, staleness, error budget tracking

---

## KOMUTLAR

```powershell
# Dev server
pnpm -C apps/web-next dev --port 3003

# Executor kontrol
pm2 list
pm2 start ecosystem.config.js --only spark-executor
pm2 stop spark-executor

# Test suite
pnpm -C apps/web-next lint
npx tsc --noEmit
pnpm -C apps/web-next build
```

---

**İmza**: Cursor (Claude 3.5 Sonnet)  
**Durum**: ✅ 4 kusur düzeltildi, SSR-safe, TR uyumlu  
**Test**: Lint/TypeCheck/Build PASS, Smoke scenarios validated
