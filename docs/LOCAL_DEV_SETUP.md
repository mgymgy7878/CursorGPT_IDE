# Local Development Setup

**Tarih:** 2025-01-15
**Durum:** ✅ Aktif

---

## Dev Server Port

**Varsayılan Port:** `3003`

- Next.js dev server: `http://localhost:3003`
- Package.json script: `pnpm dev` → `next dev -p 3003`

### ⚠️ Figma Local Link Notu (KRİTİK)

**Figma'daki local link'ler MUTLAKA şu formatta olmalı:**

- ✅ `http://localhost:3003/strategy-studio` (Backtest ekranı için DOĞRU route)
- ✅ `http://localhost:3003/dashboard`
- ✅ `http://localhost:3003/portfolio`
- ❌ `http://localhost:3000/...` (YANLIŞ PORT - sayfa açılmaz!)

**Port Uyuşmazlığı Sorunu:**

- Dev server `3003` portunda çalışıyor
- Eğer Figma link'i `3000` portunu kullanıyorsa → **Sayfa açılmaz** (port çakışması)
- **Çözüm:** Figma dosyasındaki TÜM local link'leri `3000` → `3003` olarak güncelle

**Backtest Ekranı İçin Doğru Route:**

- ✅ `/strategy-studio` → BacktestRunner + BacktestRiskPanel içerir (Figma'daki son tasarım)
- ❌ `/backtest` → `/strategy-lab?tab=backtest`'e redirect (eski route)
- ❌ `/backtest-lab` → Farklı bir backtest arayüzü (Figma tasarımıyla uyuşmaz)
- ❌ `/strategy-lab` → BacktestRunner içermez

---

## Backtest Sayfaları & Route'lar

### Strategy Studio (`/strategy-studio`) ⭐

- **Açıklama:** BacktestRunner bileşenini içeren ana sayfa
- **Bileşen:** `apps/web-next/src/components/studio/BacktestRunner.tsx`
- **Layout:**
  - Sol: Performance metrics (Win Rate, Total Return, Sharpe, Max Drawdown)
  - Sağ: BacktestRiskPanel (verdict, regime, risk score, reasons)
- **Grid:** `grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6`
- **Parity Durumu:** ✅ Figma tasarımıyla uyumlu (küçük ada)
- **Not:** Global shell (Sidebar, TopStatusBar, Dashboard vs.) hâlâ eski v1 tasarımı. Yeni risk UI sadece bu route'ta uygulanmış durumda.

### Strategy Lab (`/strategy-lab`)

- **Açıklama:** Strategy Lab sayfası (BacktestRunner içermez)
- **Tab:** `?tab=backtest` query param ile backtest tab'ı aktif olabilir

### Backtest Lab (`/backtest-lab`)

- **Açıklama:** Backtest Lab sayfası (farklı bir backtest arayüzü)

### Backtest Engine (`/backtest-engine`)

- **Açıklama:** Backtest engine yönetim sayfası

### Backtest Redirect (`/backtest`)

- **Açıklama:** `/strategy-lab?tab=backtest`'e yönlendirir

---

## Navigation (Sidebar)

Sidebar'da (`SidebarNav.tsx`) şu linkler mevcut:

**STRATEJİ & BACKTEST:**

- `/strategies` - Stratejilerim
- `/strategy-studio` - Strategy Studio ⭐ (BacktestRunner içerir)
- `/strategy-lab` - Strategy Lab
- `/backtest-lab` - Backtest Lab

---

## BacktestRiskPanel Entegrasyonu

### Kullanım

```tsx
import { BacktestRiskPanel } from "@/components/backtest/BacktestRiskPanel";
import type {
  StrategyCandidateDto,
  BacktestMetricsDto,
} from "@spark/types/backtest-risk";

// BacktestRunner içinde:
<BacktestRiskPanel candidate={candidate} metrics={metrics} />;
```

### Props

- `candidate: StrategyCandidateDto | null` - Strateji adayı bilgisi
- `metrics: BacktestMetricsDto | null` - Backtest metrikleri

### Davranış

- `metrics` null ise panel görünmez (empty state)
- `candidate` ve `metrics` dolu olduğunda otomatik risk değerlendirmesi yapılır
- Hook: `useBacktestRiskEvaluation` → `/api/backtest/risk-evaluate` çağrısı yapar

---

## Dev Server Başlatma

```bash
# Root dizinden
cd apps/web-next
pnpm dev

# Veya workspace root'tan
pnpm dev --filter web-next
```

**Beklenen çıktı:**

```
▲ Next.js 14.2.13
- Local:        http://localhost:3003
- Ready in X.Xs
```

---

## 🎯 Doğru URL (Figma Güncellemesi İçin)

**Backtest ekranı (Figma'daki son tasarım) için tek doğru URL:**

```
http://localhost:3003/strategy-studio
```

**Figma'da Backtest sayfasına tıklayınca açılacak link bu olmalı.**

---

## ⚠️ Bilinen Sorunlar & Çözümler

### 1. Port Uyuşmazlığı (EN SIK KARŞILAŞILAN SORUN)

**Sorun:** Figma'daki local link `3000` portunu kullanıyorsa, sayfa açılmaz
**Kök Sebep:** Dev server `3003`'te çalışıyor, `3000`'de server yok
**Çözüm:** Figma dosyasındaki tüm local link'leri `3000` → `3003` olarak güncelle

**Örnek Düzeltme:**

```
❌ http://localhost:3000/strategy-studio
✅ http://localhost:3003/strategy-studio
```

### 2. Yanlış Route'a Gitme

**Sorun:** Figma link'i `/backtest-lab` veya `/backtest` gibi eski route'lara işaret ediyor
**Kök Sebep:** Figma'daki son tasarım `/strategy-studio` route'una karşılık geliyor
**Çözüm:** Figma link'ini `/strategy-studio` olarak güncelle

**Route Karşılaştırması:**

- ✅ `/strategy-studio` → BacktestRunner + BacktestRiskPanel (Figma tasarımı) **DOĞRU**
- ❌ `/backtest` → Redirect (eski)
- ❌ `/backtest-lab` → Farklı arayüz (uyuşmaz)
- ❌ `/strategy-lab` → BacktestRunner yok

### 3. Browser Cache / Stale Build

Eğer sayfa açılıyor ama eski görünüm görünüyorsa:

- Hard refresh: `Ctrl+Shift+R` (Windows) veya `Cmd+Shift+R` (Mac)
- Dev server'ı yeniden başlat: `pnpm dev --filter web-next`

### 4. BacktestRiskPanel Görünürlüğü

- Panel sadece `report` ve `metrics` dolu olduğunda görünür
- Backtest çalıştırılmadan önce panel görünmez (beklenen davranış)
- Backtest sonuçları geldiğinde otomatik risk değerlendirmesi yapılır

### 5. Layout Responsive

- Desktop: `lg:grid-cols-[2fr,1fr]` → Sol metrics, sağ risk panel
- Mobile: `grid-cols-1` → Tek sütun, üst üste

---

## ✅ Dev Server Health Check

### 🔴 ERR_CONNECTION_REFUSED Hatası

**Belirti:** Tarayıcıda `ERR_CONNECTION_REFUSED` hatası alıyorsun
**Kök Sebep:** Dev server çalışmıyor veya farklı portta çalışıyor

### Adım 1: Dev Server'ı Başlat

Yeni bir terminal aç ve şu komutu çalıştır:

```bash
cd <spark-monorepo-kök>
pnpm dev --filter web-next
```

**Beklenen çıktı:**

```
▲ Next.js 14.2.13
- Local:        http://localhost:3003
  Ready in X.Xs
```

### Adım 2: Port Kontrolü

**Terminalde hangi port yazıyor?**

- ✅ `Local: http://localhost:3003` → Tarayıcıda `http://localhost:3003/strategy-studio` aç
- ⚠️ `Local: http://localhost:3004` → Port değişmiş, `http://localhost:3004/strategy-studio` aç
- ⚠️ `Local: http://localhost:3000` → Port değişmiş, `http://localhost:3000/strategy-studio` aç

**Önemli:** Tarayıcının portu = Terminalde yazan port olmalı!

### Adım 3: Port Check (Opsiyonel)

PowerShell'de port kontrolü:

```powershell
# 3003 portunda dinleyen process var mı?
netstat -ano | findstr :3003
```

**Çıktı:**

- Hiç satır yok → Port boş, dev server çalışmıyor
- Satır varsa → PID numarasını görürsün (process çalışıyor)

### Adım 4: Olası Hatalar

**"Port 3003 is in use, use 3004 instead?"**

- `y` dediysen → Next artık 3004'te çalışıyor
- Tarayıcıda `http://localhost:3004/strategy-studio` aç

**Terminalde kırmızı hata var:**

- Build hatası olabilir
- Hata mesajını kontrol et ve düzelt

**"Local: ..." satırı hiç gelmiyorsa:**

- Process crash olmuş olabilir
- Terminaldeki hata mesajlarını kontrol et

---

## ✅ Hızlı Sanity Check

### Terminal Kontrolü

```bash
pnpm dev --filter web-next
# Beklenen: Local: http://localhost:3003
# ⚠️ DİKKAT: Terminalde yazan portu kullan!
```

### Browser Kontrolü

1. Terminalde yazan portu kullan (örn: 3003, 3004, 3000)
2. Tarayıcıda aç: `http://localhost:<TERMINALDEKİ_PORT>/strategy-studio`
3. Kontrol et:
   - ✅ Sol: Win Rate / Total Return / Sharpe / Max DD kartları
   - ✅ Sağ: Backtest risk panel (backtest çalıştırdıktan sonra görünür)

### Figma Kontrolü

1. Figma'da Backtest ekranındaki local link'e tıkla
2. Terminalde yazan port ile eşleşiyor mu?
3. Değilse → link'i terminaldeki port + `/strategy-studio` yap

**Bunlar tutuyorsa, parity tamamlanmış demektir.**

---

## İlgili Dosyalar

- `apps/web-next/package.json` - Dev server port config
- `apps/web-next/src/app/strategy-studio/page.tsx` - Strategy Studio sayfası
- `apps/web-next/src/components/studio/BacktestRunner.tsx` - Backtest runner bileşeni
- `apps/web-next/src/components/backtest/BacktestRiskPanel.tsx` - Risk panel bileşeni
- `apps/web-next/src/components/nav/SidebarNav.tsx` - Sidebar navigation
- `apps/web-next/src/hooks/useBacktestRiskEvaluation.ts` - Risk evaluation hook
- `docs/BACKTEST_RISK_FILTER_V1.md` - Backtest risk filter dokümantasyonu
