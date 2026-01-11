# Arayüz Düzenleme Yöntemleri ve Araç Önerileri

**Tarih:** 26.11.2025
**Proje:** Spark Trading Platform
**Hedef:** Dashboard ve diğer sayfalar için hızlı, iteratif arayüz düzenleme süreci

---

## 1. Mevcut Durum Analizi

### 1.1 Teknoloji Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Custom CSS Variables
- **Layout System:** CSS Grid + Flexbox
- **IDE:** Cursor (AI-assisted development)
- **Hedef Çözünürlük:** 1366×768 (scroll'suz overview)

### 1.2 Mevcut Layout Yapısı

**Dashboard Layout:**
```tsx
// 3-kolonlu yapı
<main className="flex h-full">
  <LeftNav />              // ~220px sabit
  <DashboardCenter />      // flex-1 (kalan alan)
  <CopilotDock />         // 340px sabit
</main>
```

**Dashboard Center:**
```tsx
// Flexbox + Grid kombinasyonu
<section className="flex-1 flex flex-col">
  <div className="max-w-6xl mx-auto px-3 py-1.5 flex flex-col gap-2.5">
    {/* Üst: Stratejiler (120-150px) */}
    <RunningStrategiesSummaryCard />

    {/* Alt: Grid (1.45fr : 1fr) */}
    <div className="grid lg:grid-cols-[1.45fr_1fr] gap-2.5">
      <MarketOverviewCard />
      <NewsFeedCard />
    </div>
  </div>
</section>
```

### 1.3 Mevcut Düzenleme Yöntemi
- **Şu an:** Cursor içinde kod yazarak düzenleme
- **Hız:** Orta (her değişiklik için dev server restart gerekebilir)
- **İterasyon:** Kod → Dev server → Tarayıcı → Görsel kontrol → Tekrar kod

---

## 2. Sorularınıza Cevaplar ve Öneriler

### 2.1 Görsel Düzenleme Hızlandırılsın mı?

**Cevap:** Evet, önerilir ama hibrit yaklaşım daha verimli.

**Öneri: Hibrit Yaklaşım**

#### A) Hızlı Prototipleme (Figma/Penpot) - Yeni Sayfalar İçin
- **Ne zaman kullanılmalı:**
  - Yeni sayfa tasarımı (örn: Strategy Lab, Portfolio detay)
  - Büyük layout değişiklikleri
  - Stakeholder onayı gereken tasarımlar

- **Avantajlar:**
  - Görsel iterasyon çok hızlı (drag & drop)
  - Stakeholder feedback'i kolay (link paylaşımı)
  - Responsive breakpoint'leri test etme
  - Design system tutarlılığı (component library)

- **Araç Önerileri:**
  1. **Figma** (ücretli, en yaygın)
     - Auto Layout özelliği → CSS Grid/Flexbox'a yakın
     - Dev Mode → CSS/Tailwind kod önerileri
     - Component variants → React component'lere benzer

  2. **Penpot** (açık kaynak, ücretsiz)
     - Figma'ya benzer özellikler
     - Self-hosted seçeneği
     - Daha hafif

#### B) Cursor İçi Hızlı Düzenleme - Mevcut Sayfalar İçin
- **Ne zaman kullanılmalı:**
  - Mevcut sayfada küçük düzenlemeler (padding, gap, yükseklik)
  - Veri yoğunluğu ayarlamaları
  - Responsive breakpoint ince ayarları

- **Hızlandırma Teknikleri:**

  1. **Hot Reload Optimizasyonu:**
     ```bash
     # Next.js Fast Refresh zaten aktif
     # Ek olarak: Turbopack (deneysel)
     pnpm --filter web-next dev --turbo
     ```

  2. **Browser DevTools + Cursor Sync:**
     - Chrome DevTools'da element seç
     - Computed styles'i kopyala
     - Cursor'da Tailwind class'larına çevir

  3. **Tailwind IntelliSense:**
     - Cursor'da Tailwind class'ları için autocomplete
     - Hover ile computed CSS görüntüleme

  4. **Component Preview (öneri):**
     ```tsx
     // Storybook veya React DevTools kullan
     // Component'leri izole test et
     ```

---

### 2.2 Cursor İçinden Çözüm Öncelikli mi?

**Cevap:** Evet, mevcut workflow için Cursor içi çözüm öncelikli, ama Figma entegrasyonu eklenebilir.

**Öneri: Cursor-First + Figma Backup**

#### A) Cursor İçi Hızlı Düzenleme Şablonları

**1. Layout Değişikliği Şablonu:**
```markdown
# Cursor Prompt Şablonu

"Dashboard layout'u şu şekilde düzenle:
- [Kart adı] yüksekliğini [X]px'den [Y]px'e çıkar
- [Kart adı] ile [Kart adı] arasındaki gap'i [Z]px yap
- [Kart adı] içindeki padding'i [A]px'den [B]px'e düşür
- Responsive: 768px altında [değişiklik] yap
- Test: 1366×768'de scroll olmamalı"
```

**2. Grid Düzenleme Şablonu:**
```markdown
"Dashboard center grid'ini şu şekilde değiştir:
- Üst satır: [Kart1] full-width
- Alt satır: [Kart2] 1.5fr, [Kart3] 1fr
- Gap: 12px
- Max-width: 6xl (1152px)
- Mobile: tek kolon"
```

**3. Component Spacing Şablonu:**
```markdown
"[Component adı] içindeki spacing'leri şu şekilde ayarla:
- Header padding: py-1.5 px-3
- Content padding: py-1.5 px-3
- Item gap: 1.5 (6px)
- Min height: 32px
- Max height: calc(100vh - [header height])"
```

#### B) Figma → Cursor Entegrasyonu (Opsiyonel)

**1. Figma Dev Mode:**
- Figma'da tasarla
- Dev Mode'da CSS/Tailwind kod önerilerini al
- Cursor'a kopyala-yapıştır

**2. Figma Plugin:**
- **Figma to Code** plugin'leri (örn: Anima, Builder.io)
- React component export
- Tailwind class'larına otomatik çeviri

**3. Design Tokens Sync:**
```json
// figma-tokens.json → tailwind.config.js
{
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px"
  }
}
```

---

### 2.3 Tasarım Formatı Beklentisi

**Cevap:** Mevcut sistem zaten grid bazlı, ama daha sistematik hale getirilebilir.

#### A) Mevcut Grid Sistemi

**Dashboard:**
- Ana layout: Flexbox (3 kolon)
- İçerik: CSS Grid (responsive)
- Breakpoints: `lg:` (1024px), `md:` (768px), `sm:` (640px)

**Önerilen İyileştirme: 12-Column Grid System**

```css
/* globals.css'e ekle */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--gap, 12px);
}

/* Kullanım örneği */
.strategies-card { grid-column: span 12; }
.market-card { grid-column: span 7; }  /* 7/12 = ~58% */
.news-card { grid-column: span 5; }    /* 5/12 = ~42% */
```

**Avantajlar:**
- Daha tutarlı oranlar (7:5 = 1.4:1, mevcut 1.45:1'e yakın)
- Responsive'de kolay span değişikliği
- Design system'e uyum

#### B) 1366×768 Hedef Çözünürlük

**Mevcut Yaklaşım:**
```tsx
// Viewport-based height calculation
<div className="min-h-[120px] max-h-[150px]">
  <Card />
</div>
```

**Önerilen İyileştirme: Container Queries**
```css
/* globals.css */
.dashboard-container {
  container-type: inline-size;
  container-name: dashboard;
}

@container dashboard (min-width: 1366px) {
  .strategies-card { max-height: 150px; }
  .market-card { max-height: calc(100vh - 200px); }
}

@container dashboard (max-width: 1365px) {
  .strategies-card { max-height: 120px; }
  .market-card { max-height: calc(100vh - 180px); }
}
```

**Avantajlar:**
- Viewport yerine container bazlı responsive
- Daha tutarlı görünüm
- Scroll'suz overview garantisi

---

### 2.4 Copilot Entegrasyonu

**Cevap:** Copilot şu an context bilgisi gösteriyor, analiz özelliği eklenebilir.

#### A) Mevcut Copilot Özellikleri
- Piyasa sembolleri (BTCUSDT, ETHUSDT)
- Aktif strateji sayısı
- Portföy durumu
- Sayısal özet (Günlük P&L, Açık pozisyon, Max risk)

#### B) Önerilen Analiz Özellikleri

**1. Strateji Pozisyon Analizi:**
```typescript
// Copilot'a sorulabilecek sorular:
"En riskli pozisyon hangisi?"
"Toplam P&L'yi analiz et"
"Hangi strateji en çok kâr ediyor?"
```

**2. Piyasa Sinyal Analizi:**
```typescript
"BTCUSDT için trend analizi yap"
"En yüksek hacimli 3 coin hangisi?"
"Piyasa risk-on mu risk-off mu?"
```

**3. Risk Uyarıları:**
```typescript
// Otomatik uyarılar:
"Risk limiti %80'e yaklaştı"
"3 strateji aynı anda zararda"
"Piyasa volatilitesi arttı"
```

**4. Önerilen Veri Yapısı:**
```typescript
interface CopilotAnalysis {
  strategies: {
    totalPnL: number;
    activeCount: number;
    riskLevel: 'low' | 'medium' | 'high';
    topPerformer: Strategy;
    worstPerformer: Strategy;
  };
  market: {
    breadth: { up: number; down: number };
    totalVolume: number;
    volatility: number;
    regime: 'risk-on' | 'risk-off' | 'neutral';
  };
  portfolio: {
    totalValue: number;
    dailyPnL: number;
    riskUsage: number; // 0-100%
    openPositions: number;
  };
}
```

---

## 3. Önerilen Workflow

### 3.1 Hızlı İterasyon İçin

**Adım 1: Cursor İçi Düzenleme (Günlük)**
1. Cursor'da component dosyasını aç
2. Tailwind class'larını düzenle
3. Dev server'da hot reload ile kontrol et
4. Browser DevTools ile pixel-perfect ayar

**Adım 2: Figma Prototipleme (Yeni Sayfalar)**
1. Figma'da layout tasarla
2. Auto Layout ile responsive test et
3. Dev Mode'dan CSS/Tailwind kod al
4. Cursor'a entegre et

**Adım 3: Design System Sync (Haftalık)**
1. Figma design tokens'ı export et
2. `tailwind.config.js`'e sync et
3. Component'leri güncelle

### 3.2 Cursor Prompt Şablonları

**Layout Düzenleme:**
```markdown
"Dashboard layout'u şu şekilde düzenle:
- [Component] yüksekliğini [X]px'den [Y]px'e çıkar
- [Component] ile [Component] arasındaki gap'i [Z]px yap
- Responsive: 768px altında [değişiklik]
- Test: 1366×768'de scroll olmamalı"
```

**Grid Düzenleme:**
```markdown
"Dashboard center grid'ini şu şekilde değiştir:
- Üst satır: [Kart1] full-width
- Alt satır: [Kart2] 1.5fr, [Kart3] 1fr
- Gap: 12px
- Max-width: 6xl
- Mobile: tek kolon"
```

**Spacing Düzenleme:**
```markdown
"[Component] içindeki spacing'leri şu şekilde ayarla:
- Header padding: py-1.5 px-3
- Content padding: py-1.5 px-3
- Item gap: 1.5
- Min height: 32px"
```

---

## 4. Araç Önerileri

### 4.1 Cursor İçi Araçlar

**1. Tailwind IntelliSense (Zaten aktif olmalı)**
- Autocomplete için
- Hover ile computed CSS

**2. React DevTools**
- Component tree görüntüleme
- Props/state debugging

**3. Browser DevTools**
- Element seçimi
- Computed styles kopyalama
- Responsive mode test

### 4.2 Dış Araçlar (Opsiyonel)

**1. Figma (Ücretli)**
- Yeni sayfa tasarımları
- Stakeholder onayı
- Design system yönetimi

**2. Penpot (Açık Kaynak)**
- Figma alternatifi
- Self-hosted seçeneği

**3. Storybook (Opsiyonel)**
- Component izole test
- Visual regression testing

---

## 5. Sonuç ve Öneriler

### 5.1 Öncelik Sırası

1. **Cursor İçi Düzenleme (Şu an)** ✅
   - Mevcut sayfalar için yeterli
   - Hızlı iterasyon
   - Hot reload ile anında görüntüleme

2. **Figma Entegrasyonu (Gelecek)**
   - Yeni sayfalar için
   - Büyük layout değişiklikleri
   - Stakeholder onayı

3. **Design System Sync (İleri Seviye)**
   - Token-based styling
   - Otomatik sync
   - Tutarlılık garantisi

### 5.2 Hemen Uygulanabilir İyileştirmeler

1. **12-Column Grid System** ekle
2. **Container Queries** kullan (1366×768 garantisi)
3. **Cursor Prompt Şablonları** oluştur
4. **Browser DevTools** ile pixel-perfect ayar

### 5.3 Gelecek Adımlar

1. Figma design system kurulumu (opsiyonel)
2. Storybook entegrasyonu (component test)
3. Copilot analiz özellikleri (strateji/piyasa analizi)

---

**Not:** Bu doküman, mevcut workflow'unuzu optimize etmek için hazırlanmıştır. Herhangi bir değişiklik önerisi veya soru için lütfen iletişime geçin.

