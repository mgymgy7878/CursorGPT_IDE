# PageShell Scroll Stratejisi Patch Önerisi

**Versiyon:** v1.2
**Tarih:** 2025-01-20
**Durum:** ✅ Tamamlandı
**Hedef:** Figma Golden Master prensibi: "Sayfa scroll yok, iç scroll var"

---

## Problem

Mevcut durumda PageShell kullanan tüm sayfalarda (Strategy Lab, Strategies, Running, Portfolio, Alerts, Audit, Guardrails, Settings) sayfa scroll açık. Figma Golden Master tasarımında ise sayfa scroll yok, sadece içerik (liste/tablo/kart) scroll ediyor.

**Mevcut Kod:**

```css
/* apps/web-next/src/app/globals.css */
.page-center {
  padding: var(--container-pad, clamp(16px, 2vh, 24px));
  overflow-y: auto; /* ❌ Sayfa scroll açık */
  overflow-x: hidden;
  min-height: 0;
  max-width: 100%;
}
```

---

## Çözüm: Dashboard Pattern'ini PageShell'e Uygula

Dashboard'da başarıyla uygulanan "sayfa scroll yok, iç scroll var" pattern'ini PageShell'e uygulayalım.

### 1. CSS Değişiklikleri

**Dosya:** `apps/web-next/src/app/globals.css`

**Değişiklik:**

```css
/* ========== PageShell: Figma Golden Master Scroll Stratejisi ========== */

/* PageShell: Sayfa scroll kapat */
.page-shell {
  display: grid;
  grid-template-columns: var(--sidebar, clamp(260px, 18vw, 280px)) 1fr var(
      --copilot-w,
      clamp(320px, 28vw, 380px)
    );
  column-gap: var(--gap, 12px);
  margin-top: var(--top-gap, 2px);
  min-height: calc(100dvh - var(--app-topbar, 44px) - var(--top-gap, 2px));
  overflow: clip; /* ✅ Sayfa scroll yok */
  background: var(--bg, #000000);
  align-items: start;
  height: calc(100dvh - var(--app-topbar, 44px) - var(--top-gap, 2px));
}

/* Page center: Sayfa scroll yok, flex container */
.page-center {
  padding: 12px 24px; /* Figma: px-6 py-3 → 24px yatay, 12px dikey */
  overflow: visible; /* ✅ Sayfa scroll yok */
  min-height: 0;
  max-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* İçerik scroll sadece liste/tablo/kart içinde */
.page-center > [data-scroll-container] {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
}

/* Sayfa scroll engelleme (html/body) */
html:has(.page-shell),
body:has(.page-shell) {
  overflow: clip;
  padding-top: 0 !important;
}
```

### 2. Component Değişiklikleri

**Dosya:** `apps/web-next/src/components/layout/PageShell.tsx`

**Mevcut Kod:**

```tsx
function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <main
      id="main-content"
      role="main"
      aria-busy="false"
      className={`page-shell ${className}`}
    >
      <div className="left-nav" aria-label="Ana menü">
        <LeftNav />
      </div>

      <section className="page-center">{children}</section>

      <div className="copilot-dock" aria-label="Copilot sohbet">
        <CopilotDock />
      </div>
    </main>
  );
}
```

**Değişiklik:** Component'te değişiklik yok, sadece CSS yeterli. Ancak içerik scroll container'ı eklemek için:

```tsx
// Örnek: StrategyList için
<section className="page-center">
  <div data-scroll-container>{children}</div>
</section>
```

**Not:** Her sayfa kendi scroll container'ını yönetebilir. Örneğin:

- StrategyList → `data-scroll-container`
- AuditTable → `data-scroll-container`
- Portfolio grid → `data-scroll-container`

---

## 3. Sayfa Bazlı Uygulama

### 3.1 Strategy Lab (`/strategy-lab`)

**Component:** `apps/web-next/src/app/strategy-lab/page.tsx`

**Değişiklik:**

```tsx
// Tab içeriklerini scroll container'a al
<div className="max-w-4xl">
  <div data-scroll-container className="h-full">
    {activeTab === "generate" && <GenerateTab />}
    {activeTab === "backtest" && <BacktestTab />}
    {activeTab === "optimize" && <OptimizeTab />}
    {activeTab === "deploy" && <DeployTab />}
  </div>
</div>
```

### 3.2 Strategies (`/strategies`)

**Component:** `apps/web-next/src/app/strategies/page.tsx`

**Değişiklik:**

```tsx
<div className="space-y-6">
  <StrategyControls ... />
  <div data-scroll-container className="flex-1 min-h-0">
    <StrategyList ... />
  </div>
</div>
```

### 3.3 Running (`/running`)

**Component:** `apps/web-next/src/app/running/page.tsx`

**Değişiklik:**

```tsx
<div data-scroll-container className="flex-1 min-h-0">
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {running.map((s) => (
      <div key={s.id} className="...">
        ...
      </div>
    ))}
  </div>
</div>
```

### 3.4 Portfolio (`/portfolio`)

**Component:** `apps/web-next/src/app/portfolio/page.tsx`

**Değişiklik:**

```tsx
<div data-scroll-container className="flex-1 min-h-0">
  <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
    ...
    <Card title="Açık Pozisyonlar" className="sm:col-span-2 xl:col-span-3">
      <div className="overflow-y-auto max-h-[600px]">
        <OptimisticPositionsTable />
      </div>
    </Card>
  </div>
</div>
```

### 3.5 Alerts (`/alerts`)

**Component:** `apps/web-next/src/app/alerts/page.tsx`

**Değişiklik:**

```tsx
<div data-scroll-container className="flex-1 min-h-0">
  <div className="overflow-x-auto border border-neutral-800 rounded-xl">
    <table className="w-full text-sm">...</table>
  </div>
</div>
```

### 3.6 Audit (`/audit`)

**Component:** `apps/web-next/src/app/audit/page.tsx`

**Değişiklik:**

```tsx
<div className="space-y-3">
  <AuditFilters ... />
  <div data-scroll-container className="flex-1 min-h-0">
    {loading ? (
      <TableSkeleton ... />
    ) : (
      <AuditTable rows={items} />
    )}
  </div>
</div>
```

---

## 4. Test Senaryoları

### 4.1 Sayfa Scroll Testi

1. Her sayfayı aç
2. Sayfa scroll'unun olmadığını doğrula (scrollbar görünmemeli)
3. İçerik scroll'unun çalıştığını doğrula (liste/tablo scroll edebilmeli)

### 4.2 Responsive Testi

1. Farklı ekran boyutlarında test et (1366×768, 1920×1080, 1440×900)
2. Sidebar ve Copilot panel'in doğru genişlikte olduğunu doğrula
3. Mobilde sidebar ve copilot'un gizlendiğini doğrula

### 4.3 İçerik Scroll Testi

1. Uzun liste/tablo içeren sayfalarda scroll'un çalıştığını doğrula
2. Scroll container'ın doğru yükseklikte olduğunu doğrula
3. Scroll'un sadece içerikte olduğunu, sayfa scroll'unun olmadığını doğrula

---

## 5. Rollout Planı

### Faz 1: CSS Patch (Global)

1. `globals.css`'e PageShell scroll stratejisi CSS'ini ekle
2. Test: Tüm sayfalarda sayfa scroll'un kapalı olduğunu doğrula

### Faz 2: Sayfa Bazlı Scroll Container'lar

1. Her sayfaya `data-scroll-container` ekle
2. İçerik scroll'unun çalıştığını doğrula
3. Sayfa sayfa test et

### Faz 3: İnce Ayar

1. Figma'dan exact spacing/gap değerlerini uygula
2. Font boyutları ve renkleri hizala
3. Final test

---

## 6. Notlar

- Dashboard zaten bu pattern'i kullanıyor (`[data-dashboard-root="1"]`), referans olarak kullanılabilir
- `data-scroll-container` attribute'u ile içerik scroll'u kontrol edilir
- Her sayfa kendi scroll container'ını yönetebilir (esneklik)
- Responsive davranış korunmalı (mobilde sidebar/copilot gizli)

---

## 7. Health Check Listesi (Test Senaryoları)

### 7.1 Genel (PageShell)

**Herhangi bir PageShell sayfasında test et:**

- [ ] Fareyi body üzerinde kaydırınca sayfa komple kaymamalı
- [ ] Scroll sadece `data-scroll-container` içindeyken çalışmalı
- [ ] Sidebar genişliği: yaklaşık 260–280px arasında, dashboard ve diğer sayfalarda tutarlı
- [ ] Copilot paneli sayfa ile birlikte sabit yükseklikte kalıyor

**Test sayfaları:**

- `/strategy-lab`
- `/strategies`
- `/portfolio`
- `/running`
- `/alerts`
- `/audit`
- `/settings`
- `/guardrails`

### 7.2 /portfolio Özel Testleri

**Layout:**

- [ ] Üst kartlar (ExchangeStatus, LivePnL, Hesap Özeti) hiç kıpırdamıyor
- [ ] Sadece "Açık Pozisyonlar" alanı scroll ediyor
- [ ] Açık pozisyonlar tablosunda çok satır olduğunda scroll bar görünüyor
- [ ] Card yapısı: `CardHeader` + `CardTitle` + `CardContent` hiyerarşisi bozulmadan render oluyor

**Responsive:**

- [ ] Mobil / dar genişlikte grid tek kolona düşerken scroll davranışı aynı kalıyor

### 7.3 /running Özel Testleri

**Layout:**

- [ ] Üstteki filtre/özet bar'ı hep görünür
- [ ] Sadece kart grid'i kayıyor
- [ ] Card sayısı azsa scroll çubuğu çıkmasa bile layout bozulmamalı
- [ ] Empty state'te de scroll container içi düzgün ortalanmış görünmeli

### 7.4 Overlay / Modallar Testi

**`.page-shell` → `html/body overflow: clip` yaptığımız için kontrol et:**

- [ ] Komut paleti (`Ctrl+K`) tam ekranın içinde kalıyor mu?
- [ ] Büyük modal'lar (Strategy delete, API key vs.) altta kaybolan kısım var mı?
- [ ] Dropdown menüler tam ekranın içinde kalıyor mu?

**Not:** Eğer bir modal yüksekliği `100vh`'ye yakınsa, gerektiğinde o component'e lokal `overflow-y-auto` ekleyerek çözülebilir.

---

## 8. Sonraki Adımlar: Kalan Sayfalara Scroll Pattern'i Yaymak

### 8.1 Pattern Özeti

**Mantık hep aynı:**

1. `PageShell` içindeki en dış wrapper: `flex flex-col h-full gap-4`
2. Üst blok(lar) → sabit alan (filtreler, özetler, header'lar)
3. Alt ana içerik → `data-scroll-container className="flex-1 min-h-0"`
4. İçeride uzun liste/tablo → `overflow-y-auto` ile kendi içinde scroll

### 8.2 Kalan Sayfalar

**Sırayla uygulanacak:**

1. **`/strategy-lab`** - Tab içerikleri scroll container'a alınacak
2. **`/strategies`** - StrategyList scroll container'a alınacak
3. **`/alerts`** - Alerts tablosu scroll container'a alınacak
4. **`/audit`** - AuditTable scroll container'a alınacak
5. **`/settings`** - Form container scroll container'a alınacak
6. **`/guardrails`** - Template CTAs scroll container'a alınacak (gerekirse)

### 8.3 Her Sayfa İçin Standart Yapı

```tsx
return (
  <PageShell>
    <div className="flex flex-col gap-4 h-full">
      {/* ÜST SABİT BLOK */}
      <div>
        <PageHeader ... />
        {/* Filtreler, özetler, kontroller */}
      </div>

      {/* ALT SCROLL BLOK */}
      <div data-scroll-container className="flex-1 min-h-0">
        {/* Uzun içerik: liste, tablo, form */}
      </div>
    </div>
  </PageShell>
);
```

---

## 9. Figma İnce Ayar Sprinti (Sonraki Faz)

Scroll işi oturduktan sonra yapılacaklar:

### 9.1 Kart Spacing Standardizasyonu

- [ ] Figma'dan **kart padding** net px değerlerini çek
- [ ] Card'ların `p-4 / p-5` benzeri spacing'lerini standardize et
- [ ] **Kart gap** değerlerini Figma'dan al ve uygula
- [ ] **Border radius** değerlerini standardize et

### 9.2 Font Scale Hizalama

- [ ] **H1/H2/body** font boyutlarını Figma'dakiyle birebir eşitle
- [ ] Font weight'leri (regular, medium, semibold, bold) kontrol et
- [ ] Line height değerlerini Figma'dan al

### 9.3 Renk Token Mapping

- [ ] Arka plan renkleri (bg, bg-2, bg-3) Figma'dan al
- [ ] Border renkleri (border, border-strong, border-muted) kontrol et
- [ ] Accent renkleri (primary, success, error, warning) eşitle
- [ ] Tailwind theme'e map et

### 9.4 Icon Boyutları

- [ ] Menü ikonları boyutunu standardize et
- [ ] Buton ikonları boyutunu kontrol et
- [ ] Status badge ikonları boyutunu eşitle

---

## 10. UI Geliştirme İşlem Hattı (Pipeline)

### 10.1 Standart 3 Adımlı Süreç

Her UI ticket'i için aşağıdaki 3 adım standardı uygulanır:

#### Adım 1: Kod Patch'i

- Gerekli dosyalarda değişiklikler yapılır
- Linter hataları kontrol edilir
- TypeScript tip hataları düzeltilir

#### Adım 2: Dev Server Başlatma

```bash
cd apps/web-next
pnpm dev
```

- Server `http://localhost:3003` adresinde çalışır
- Hot reload aktif olmalı

#### Adım 3: Cursor İçinden Görsel Kontrol

- Cursor browser tool'u ile `http://localhost:3003/[route]` sayfaları açılır
- Aşağıdaki checklist hızlıca geçilir:

**UI Checklist:**

- [ ] **Sidebar genişliği:** 260-280px bandında mı?
- [ ] **Üst sabit blok:** Header/filters/tabs sabit kalıyor mu?
- [ ] **data-scroll-container:** İçerik scroll ediyor mu, sayfa scroll yok mu?
- [ ] **Copilot dock konumu:** Sağda sabit yükseklikte mi?
- [ ] **Layout yapısı:** `flex flex-col h-full gap-4` pattern'i uygulanmış mı?

### 10.2 Empty State Yanılgısı

**Önemli Not:** Çoğu sayfa şu an boş/az içerikli; scroll görünmemesi normaldir.

**Uzun içerik testi için:**

- `/strategies` için fake 30+ strateji
- `/portfolio` için 30+ pozisyon
- `/alerts` / `/audit` için 50+ satırlık seed data

Gerekirse faker seed patch'i eklenebilir.

### 10.3 Yeni Çalışma Protokolü

#### ChatGPT → Cursor İletişim Formatı

**ChatGPT tarafı:**

```
PATCH (kod ve stil)
NOTES (hangi sayfa, hangi figma maddesi kapandı)
SMOKE TEST (hangi route'lar açılıp nasıl kontrol edilecek)
```

**Cursor tarafı:**

1. Kod değişikliklerini uygula
2. `pnpm dev` ile server'ı başlat
3. `http://localhost:3003/...` sayfalarını aç
4. Tek bir **FINAL SUMMARY** ile hem test hem görsel gözlemi raporla

### 10.4 Figma Golden Master ↔ Canlı UI Döngüsü

**Operational Pipeline:**

```
Figma Golden Master
    ↓
Kod Patch (globals.css + sayfa component'leri)
    ↓
pnpm dev (localhost:3003)
    ↓
Cursor Browser Tool (görsel kontrol)
    ↓
FINAL SUMMARY (test + görsel gözlem raporu)
    ↓
İteratif düzeltme (gerekirse)
```

**Sonuç:** Artık Spark'ın UI'ını sadece koda bakarak değil, Cursor içinden gerçek uygulamayı görerek iteratif düzeltebiliyoruz. "Figma Golden Master ↔ canlı UI" döngüsü resmen operational.

---

**Sonraki Adım:** Global patch + pilot sayfalar tamamlandı. Şimdi health check yapıp, kalan sayfalara scroll pattern'i yayma zamanı.
