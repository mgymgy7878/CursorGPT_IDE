# Spark Trading - Layout ve Sayfa Analiz Özeti

**Tarih:** 2025-01-20
**Hedef:** Figma Golden Master UI referansı için mevcut layout yapısının analizi

---

## 1. Ana Layout Dosyaları

### 1.1 Root Layout (`apps/web-next/src/app/layout.tsx`)

- **Durum:** ✅ Aktif
- **Yapı:** Next.js App Router root layout
- **Bileşenler:**
  - `StatusBar` (üst durum çubuğu - 44px yükseklik)
  - `AppFrame` (koşullu wrapper - dashboard için bypass)
  - `CopilotDockRight` (dashboard dışı sayfalar için)
  - `CommandPalette`, `Toaster`, `FloatingActions`

### 1.2 AppFrame (`apps/web-next/src/components/layout/AppFrame.tsx`)

- **Durum:** ✅ Aktif ama minimal
- **Görev:** Dashboard sayfasını bypass eder, diğer sayfalar için wrapper
- **Not:** Dashboard kendi layout'unu yönetir

### 1.3 PageShell (`apps/web-next/src/components/layout/PageShell.tsx`)

- **Durum:** ✅ Aktif - Dashboard dışı sayfalar için
- **Yapı:** 3-kolon grid (LeftNav | Content | CopilotDock)
- **Kullanım:** Strategy Lab, Strategies, Running, Portfolio, Alerts, Audit, Guardrails, Settings

### 1.4 LeftNav (`apps/web-next/src/components/left-nav.tsx`)

- **Durum:** ✅ Aktif
- **Genişlik:** `clamp(190px, 13vw, 220px)` (CSS'de tanımlı)
- **Özellikler:**
  - Primary/Secondary route grupları
  - DensityToggle (alt kısımda)
  - BackButton (üst kısımda)
  - Scroll yok (sabit yükseklik)

### 1.5 StatusBar (`apps/web-next/src/components/status-bar.tsx`)

- **Durum:** ✅ Aktif
- **Yükseklik:** 44px (`--app-topbar: 44px`)
- **İçerik:**
  - Sol: API/WS/Executor durumları
  - Orta: P95, Staleness, Error Budget
  - Sağ: ThemeToggle, TopBarActions, Notifications, UserMenu

### 1.6 Deprecated Layout'lar

- `AppShell.tsx` - ⚠️ Deprecated (yorum satırında belirtilmiş)
- `Shell.tsx` - ⚠️ Deprecated (yorum satırında belirtilmiş)

---

## 2. Sayfa Component'leri ve Scroll Durumu

### 2.1 Dashboard (`/dashboard`)

- **Component:** `apps/web-next/src/app/dashboard/page.tsx`
- **Layout:** Özel 3-kolon layout (LeftNav | Dashboard-Center | CopilotDock)
- **Page Scroll:** ✅ **TAMAMEN KAPALI**
  - `[data-dashboard-root="1"]` ile `overflow: clip` uygulanıyor
  - `html:has([data-dashboard-root="1"])` ve `body:has([data-dashboard-root="1"])` ile sayfa scroll engelleniyor
  - CSS: `globals.css` satır 150-156, 727-733, 828-832, 955-959
- **İç Scroll:** ✅ Sadece kartların içinde (`overflow-y: auto` kart içeriklerinde)
- **Yapı:**
  - SystemHealthStrip (üst)
  - RiskLimitBar (üst)
  - RunningStrategiesDenseTable (üst, `min-h-[130px] max-h-[160px]`)
  - Grid: PortfolioCard + OpportunitiesAlertsCard
  - Grid: QuickActionsCard + MarketOverviewDense + NewsFeedDense
  - CopilotDock (sağda sticky, `h-[calc(100vh-6rem)]`)

### 2.2 Market Data (`/market-data`)

- **Component:** `apps/web-next/src/app/market-data/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Durum:** Minimal placeholder içerik

### 2.3 Strategy Lab (`/strategy-lab`)

- **Component:** `apps/web-next/src/app/strategy-lab/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** Tab'ler (Generate, Backtest, Optimize, Deploy)

### 2.4 Strategies (`/strategies`)

- **Component:** `apps/web-next/src/app/strategies/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** StrategyList, CreateStrategyModal, StrategyDetailPanel

### 2.5 Running (`/running`)

- **Component:** `apps/web-next/src/app/running/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** Grid kartlar (running strategies)

### 2.6 Portfolio (`/portfolio`)

- **Component:** `apps/web-next/src/app/portfolio/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** ExchangeStatus, LivePnL, OptimisticPositionsTable

### 2.7 Alerts (`/alerts`)

- **Component:** `apps/web-next/src/app/alerts/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** AlertsControl, tablo, history modal

### 2.8 Audit Logs (`/audit`)

- **Component:** `apps/web-next/src/app/audit/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** AuditFilters, AuditTable

### 2.9 Guardrails (`/guardrails`)

- **Component:** `apps/web-next/src/app/guardrails/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** Empty state + template CTAs

### 2.10 Settings (`/settings`)

- **Component:** `apps/web-next/src/app/settings/page.tsx`
- **Layout:** PageShell kullanıyor
- **Page Scroll:** ⚠️ **AÇIK** (PageShell `.page-center` içinde `overflow-y: auto`)
- **Yapı:** Tabs (Exchange API, AI/Copilot), ApiForm'lar

### 2.11 DecisionLog

- **Durum:** ❌ Bulunamadı (component yok)

---

## 3. Layout Kuralları (CSS'den)

### 3.1 Dashboard Özel Kurallar

- **Sayfa scroll:** `overflow: clip` (html, body, dashboard-shell)
- **Grid yapısı:** Flex layout (LeftNav | Dashboard-Center | CopilotDock)
- **Gap:** `--gap: 12px`
- **Top gap:** `--top-gap: 2px` (StatusBar altı)
- **Sidebar genişlik:** `clamp(190px, 13vw, 220px)`
- **Copilot genişlik:** `clamp(320px, 28vw, 380px)`

### 3.2 PageShell Kuralları (Dashboard Dışı)

- **Grid yapısı:** 3-kolon (LeftNav | Page-Center | CopilotDock)
- **Page-Center padding:** `clamp(16px, 2vh, 24px)`
- **Page-Center scroll:** `overflow-y: auto` (sayfa scroll burada)
- **Min-height:** `calc(100dvh - var(--app-topbar) - var(--top-gap))`

### 3.3 Global Content Padding

- **Dashboard:** Padding yok (kartlar grid içinde)
- **PageShell:** `.page-center` içinde `clamp(16px, 2vh, 24px)`
- **Kart gap:** `--gap: 12px` (dashboard için)

---

## 4. Özet ve Durum

### 4.1 Hangi Sayfa Hangi Component'ten Sorumlu?

| Sayfa           | Component               | Layout       | Scroll Durumu             |
| --------------- | ----------------------- | ------------ | ------------------------- |
| `/dashboard`    | `dashboard/page.tsx`    | Özel 3-kolon | ✅ **Page scroll KAPALI** |
| `/market-data`  | `market-data/page.tsx`  | PageShell    | ⚠️ Page scroll AÇIK       |
| `/strategy-lab` | `strategy-lab/page.tsx` | PageShell    | ⚠️ Page scroll AÇIK       |
| `/strategies`   | `strategies/page.tsx`   | PageShell    | ⚠️ Page scroll AÇIK       |
| `/running`      | `running/page.tsx`      | PageShell    | ⚠️ Page scroll AÇIK       |
| `/portfolio`    | `portfolio/page.tsx`    | PageShell    | ⚠️ Page scroll AÇIK       |
| `/alerts`       | `alerts/page.tsx`       | PageShell    | ⚠️ Page scroll AÇIK       |
| `/audit`        | `audit/page.tsx`        | PageShell    | ⚠️ Page scroll AÇIK       |
| `/guardrails`   | `guardrails/page.tsx`   | PageShell    | ⚠️ Page scroll AÇIK       |
| `/settings`     | `settings/page.tsx`     | PageShell    | ⚠️ Page scroll AÇIK       |

### 4.2 Hangi Sayfalarda Page Scroll Tamamen Kaldırılmış?

✅ **Sadece Dashboard (`/dashboard`)**

- `[data-dashboard-root="1"]` attribute'u ile özel CSS kuralları
- `html:has([data-dashboard-root="1"])` ve `body:has([data-dashboard-root="1"])` ile sayfa scroll engelleniyor
- Sadece kart içeriklerinde scroll var

### 4.3 Hangi Sayfalar İnce Ayar Gerektiriyor?

#### 🔴 Yüksek Öncelik (Page Scroll Kapatılmalı)

1. **Strategy Lab** (`/strategy-lab`)
   - Tab içerikleri uzun olabilir
   - Öneri: Tab içeriklerinde scroll, sayfa scroll kapalı

2. **Strategies** (`/strategies`)
   - StrategyList uzun liste olabilir
   - Öneri: Liste içinde scroll, sayfa scroll kapalı

3. **Running** (`/running`)
   - Grid kartlar, sayfa scroll gereksiz
   - Öneri: Grid içinde scroll, sayfa scroll kapalı

4. **Portfolio** (`/portfolio`)
   - OptimisticPositionsTable uzun olabilir
   - Öneri: Tablo içinde scroll, sayfa scroll kapalı

#### 🟡 Orta Öncelik (İnce Ayar)

5. **Alerts** (`/alerts`)
   - Tablo uzun olabilir
   - Öneri: Tablo içinde scroll, sayfa scroll kapalı

6. **Audit Logs** (`/audit`)
   - Tablo uzun olabilir
   - Öneri: Tablo içinde scroll, sayfa scroll kapalı

7. **Market Data** (`/market-data`)
   - Henüz minimal içerik
   - Öneri: İçerik geliştirildikçe scroll stratejisi belirlenmeli

#### 🟢 Düşük Öncelik (Mevcut Durum Kabul Edilebilir)

8. **Guardrails** (`/guardrails`)
   - Empty state + template CTAs
   - Sayfa scroll kabul edilebilir (içerik kısa)

9. **Settings** (`/settings`)
   - Form içerikleri, sayfa scroll kabul edilebilir
   - Öneri: Form bölümlerinde scroll, sayfa scroll kapalı olabilir

---

## 5. Figma Entegrasyonu İçin Öneriler

### 5.1 Layout Ölçümleri

- **Sidebar genişlik:** Figma'dan `260-280px` → Mevcut: `clamp(190px, 13vw, 220px)` ✅ Uyumlu
- **Topbar yükseklik:** Figma'dan `56-64px` → Mevcut: `44px` ⚠️ Fark var (StatusBar)
- **StatusBar yükseklik:** Mevcut `44px` → Figma'da yok (yeni ekleme)
- **Content padding:** Figma'dan `px-6 py-3` → Mevcut PageShell: `clamp(16px, 2vh, 24px)` ✅ Uyumlu

### 5.2 Scroll Stratejisi

- **Dashboard:** ✅ Tamamlandı (page scroll kapalı)
- **Diğer sayfalar:** ⚠️ PageShell `.page-center` içinde scroll var
- **Öneri:** Figma'daki "scroll-free dashboard" kuralına uygun olarak, diğer sayfalarda da page scroll kapatılmalı, sadece liste/tablo içinde scroll olmalı

### 5.3 Kart Gap ve Padding

- **Kart gap:** Mevcut `--gap: 12px` → Figma'dan kontrol edilmeli
- **Kart padding:** Mevcut kartlarda `16px` minimum → Figma'dan kontrol edilmeli

---

## 6. Sonraki Adımlar

1. **Figma ölçümleri:** Figma dosyasından exact değerleri al (sidebar, topbar, gap, padding)
2. **PageShell scroll kapatma:** Dashboard pattern'ini diğer sayfalara uygula
3. **İç scroll stratejisi:** Liste/tablo component'lerinde `overflow-y: auto` ekle
4. **İnce ayar:** Icon boyutları, alt boşluklar, kart hizaları için Figma referansı kullan

---

**Not:** Bu analiz, mevcut kod tabanının durumunu yansıtır. Figma Golden Master UI ile karşılaştırma yapıldığında, gerekli değişiklikler bu dokümana eklenebilir.

---

## 7. Figma Golden Master UI Gözlemleri (2025-01-20)

### 7.1 Tasarım Yapısı (Ekran Görüntüsünden)

**Layout:**
- ✅ 3-kolon layout: **Sidebar (sol) | Main Content (orta) | Copilot (sağ)**
- ✅ Top header bar: "AI Trading App" başlığı, Copy/Share butonları
- ✅ Scroll: Main content ve Copilot paneli bağımsız scroll ediyor

**Sidebar (Sol):**
- Menü öğeleri (Türkçe):
  - Ana Sayfa (Home icon, aktif)
  - Piyasa Verileri
  - Strateji Laboratuvarı
  - Stratejilerim
  - Çalışan Stratejiler
  - Portföy
  - Uyarılar
  - Denetim / Loglar
  - Risk / Koruma
  - UX Test Runner
- Sidebar scroll yok (sabit yükseklik)

**Top Status Bar:**
- Sol: "Spark Trading" + "Canary" tag
- Orta: Sistem durumları (API, WS, Executor, DEV), metrikler (P95, RT Delay, OrderBus)
- Sağ: İşlem istatistikleri (İşlem: 42, Hacim: 1.2M$, Uyarılar: 1/3), ikonlar

**Main Content (Orta):**
- Portföy Özeti kartı:
  - Toplam Varlık: $124,592.00 (+2.4%)
  - Günlük PnL: +$1,240.50
  - Margin Level: 1,240% (orange)
- Piyasa Durumu kartı (kısmen görünüyor)
- Scroll: Merkez panel scroll ediyor

**Copilot Panel (Sağ):**
- Başlık: "SPARK COPILOT" + "Canlı" tag
- Alt başlık: "Ana AI Trader · Global Yönetici"
- Model: "ChatGPT 5.1 · Trader"
- Sistem detayları: "Sistem: Normal", "Strateji: BTCUSDT · Trend Follower v1", "Risk modu: Shadow"
- Aksiyon butonları:
  - "Portföy riskini analiz et"
  - "Çalışan stratejileri özetle"
  - "Bugün için işlem önerisi"
- Input alanı: Placeholder örnek metin
- Scroll: Copilot paneli bağımsız scroll ediyor

### 7.2 Ölçüm Gereksinimleri

Figma'dan alınması gereken exact değerler:

1. **Sidebar genişlik:** px cinsinden
2. **Top header bar yüksekliği:** px cinsinden
3. **Content padding:** px-6 py-3 → exact px değerleri
4. **Kart gap:** Kartlar arası boşluk (px)
5. **Kart padding:** Kart içi padding (px)
6. **Copilot panel genişlik:** px cinsinden
7. **Font boyutları:** h1, h2, body, caption (px)
8. **Renk kodları:** Hex değerleri
9. **Border radius:** Kart köşe yuvarlaklığı (px)
10. **Icon boyutları:** Menü ikonları, buton ikonları (px)

### 7.3 Sonraki Adımlar

1. **Figma Dev Mode:** Normal Figma dosyasında Dev Mode açıp ölçümleri almak
2. **Manuel ölçüm:** Figma'dan Code panelinden değerleri kopyalamak
3. **Export:** Figma'dan Design Tokens (JSON) export almak
