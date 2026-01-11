# PATCH W.2 — Polish & Ergonomi Backlog

**Amaç:** Trader-grade terminal ergonomisi: yoğun bilgi + kusursuz hizalama + kas hafızası

**Öncelik:** P0 → P1 → P2

---

## P0: Kritik Ergonomi İyileştirmeleri

### 1. Tablo Sayfalarında İçerik Genişliği (Wide Layout)

**Dosyalar:**
- `apps/web-next/src/app/(shell)/strategies/page.tsx` (veya `strategies-page-client.tsx`)
- `apps/web-next/src/app/(shell)/running/page.tsx` (veya `RunningStrategiesPage.tsx`)
- `apps/web-next/src/app/(shell)/market-data/page.tsx`

**Yapılacaklar:**
- [ ] Table-heavy sayfalarda `container mx-auto` yerine `max-w-[1600px]` veya `max-w-[1800px]` kullan
- [ ] Copilot açıkken bile tablo genişliğini optimize et (şu an "merkezde küçük ada" gibi)
- [ ] Responsive breakpoint'lerde genişliği koru (lg:max-w-[1600px])
- [ ] Alternatif: "Wide layout" toggle butonu (localStorage persist)

**Kod Örneği:**
```tsx
// Önce:
<div className="container mx-auto px-4 py-3">

// Sonra:
<div className="mx-auto px-4 py-3 max-w-[1600px] lg:max-w-[1800px]">
```

**Test:**
- [ ] Strategies sayfasında tablo genişliği artmış
- [ ] Running sayfasında tablo genişliği artmış
- [ ] Market Data sayfasında tablo genişliği artmış
- [ ] Copilot açıkken bile tablo yeterince geniş

---

### 2. Copilot Bağlamında "—" Boşluklarını Temizle

**Dosyalar:**
- `apps/web-next/src/components/copilot/CopilotDock.tsx`
- `apps/web-next/src/hooks/useCopilotContext.ts` (varsa)

**Yapılacaklar:**
- [ ] "Strateji: —" gibi boş bağlamları gizle (conditional rendering)
- [ ] Boş bağlam yerine "Seçili değil" + tıklanabilir aksiyon göster
- [ ] Market/Strategies/Running sayfalarında bağlam yoksa alanı tamamen gizle
- [ ] Context varsa göster, yoksa gizle veya "Seç" butonu göster

**Kod Örneği:**
```tsx
// Önce:
<div>Sistem: {context.system || 'Normal'}</div>
<div>Strateji: {context.strategy || '—'}</div>

// Sonra:
{context.system && (
  <div>Sistem: {context.system}</div>
)}
{context.strategy ? (
  <div>Strateji: {context.strategy}</div>
) : (
  <button onClick={handleSelectStrategy} className="text-xs text-neutral-400 hover:text-neutral-300">
    Strateji seç
  </button>
)}
```

**Test:**
- [ ] "Strateji: —" görünmüyor
- [ ] Boş bağlamlar gizleniyor veya eylem butonu gösteriliyor
- [ ] Context varsa düzgün gösteriliyor

---

## P1: Tutarlılık İyileştirmeleri

### 3. PageHeader Şablonunu Tekilleştir

**Dosyalar:**
- `apps/web-next/src/components/common/PageHeader.tsx`
- `apps/web-next/src/app/(shell)/market-data/page.tsx`
- `apps/web-next/src/app/(shell)/strategies/page.tsx` (veya client component)
- `apps/web-next/src/app/(shell)/running/page.tsx` (veya client component)
- `apps/web-next/src/app/(shell)/dashboard/page.tsx`
- `apps/web-next/src/app/(shell)/portfolio/page.tsx`

**Yapılacaklar:**
- [ ] PageHeader'a yeni prop'lar ekle: `leftSlot` (title+breadcrumb), `centerSlot` (search/filters), `rightSlot` (CTA)
- [ ] Tüm sayfalarda aynı grid mantığı: sol (title+bread), orta (search/filters), sağ (CTA)
- [ ] Market Data'daki "Mini Grafik / Tam Ekran" gibi özel header'ları PageHeader'a entegre et
- [ ] Responsive: mobile'da centerSlot alt satıra geçsin

**Kod Örneği:**
```tsx
// PageHeader.tsx'a ekle:
export interface PageHeaderProps {
  // ... mevcut props
  leftSlot?: React.ReactNode;  // title + breadcrumb
  centerSlot?: React.ReactNode; // search + filters
  rightSlot?: React.ReactNode; // CTA buttons
  layout?: 'default' | 'wide'; // wide = 3-column grid
}

// Kullanım:
<PageHeader
  leftSlot={<><h1>Piyasa Verileri</h1><Breadcrumb /></>}
  centerSlot={<SearchBar />}
  rightSlot={<><Button>Mini Grafik</Button><Button>Tam Ekran</Button></>}
  layout="wide"
/>
```

**Test:**
- [ ] Tüm sayfalarda header hizalaması tutarlı
- [ ] Market Data header'ı PageHeader ile uyumlu
- [ ] Responsive davranış doğru

---

### 4. Format Kanununu Tüm Kart+Tablo'lara Uygula

**Dosyalar:**
- `apps/web-next/src/lib/format.ts` (zaten var, kontrol et)
- `apps/web-next/src/components/ui/StatCard.tsx`
- `apps/web-next/src/components/marketdata/MarketDataTable.tsx`
- `apps/web-next/src/components/strategies/DenseStrategiesTable.tsx`
- `apps/web-next/src/components/strategies/RunningStrategiesPage.tsx`
- `apps/web-next/src/app/(shell)/dashboard/page.tsx` (veya client component)

**Format Kanunu:**
- Fiyat/varlık: `$42,150` (binlik ayırıcı, .00 yok)
- Yüzde: `+1.2%` (tek ondalık)
- Büyük para: `$1.3B` (kısaltma, zaten var)

**Yapılacaklar:**
- [ ] Tüm kartlarda `formatPriceUsd()` kullan (zaten var)
- [ ] Tüm tablolarda `formatSignedPct()` kullan (tek ondalık)
- [ ] Tüm büyük para değerlerinde `formatCompactUsd()` kullan
- [ ] Tutarsız formatları bul ve düzelt (grep ile kontrol)

**Kod Örneği:**
```tsx
// Önce:
<div>{price}</div> // 42150 veya 42,150.00

// Sonra:
<div>{formatPriceUsd(price)}</div> // $42,150

// Önce:
<div>{change}%</div> // 1.234%

// Sonra:
<div>{formatSignedPct(change, { input: 'pct' })}</div> // +1.2%
```

**Test:**
- [ ] Tüm fiyatlar `$42,150` formatında
- [ ] Tüm yüzdeler `+1.2%` formatında (tek ondalık)
- [ ] Tüm büyük para değerleri `$1.3B` formatında
- [ ] Tutarsızlık yok (grep ile kontrol)

---

## P2: Opsiyonel İyileştirmeler

### 5. Copilot Panel Width Toggle/Resize

**Dosyalar:**
- `apps/web-next/src/components/copilot/CopilotDock.tsx`
- `apps/web-next/src/components/layout/layout-tokens.ts` (varsa)

**Yapılacaklar:**
- [ ] Copilot panel için 2 mod: Compact (320px) / Comfort (380-420px)
- [ ] Toggle butonu ekle (localStorage persist)
- [ ] Opsiyonel: resize handle (drag ile genişlik ayarla)
- [ ] Responsive: küçük ekranda otomatik compact

**Kod Örneği:**
```tsx
// CopilotDock.tsx'a ekle:
const [panelWidth, setPanelWidth] = useDeferredLocalStorageState(
  'ui.copilotPanelWidth',
  'comfort' // 'compact' | 'comfort'
);

const width = panelWidth === 'compact' ? 320 : 400;

<div className="w-[320px]" style={{ width: `${width}px` }}>
  {/* ... */}
  <button onClick={() => setPanelWidth(panelWidth === 'compact' ? 'comfort' : 'compact')}>
    {panelWidth === 'compact' ? 'Genişlet' : 'Daralt'}
  </button>
</div>
```

**Test:**
- [ ] Compact/Comfort toggle çalışıyor
- [ ] Genişlik localStorage'da persist ediliyor
- [ ] Responsive davranış doğru

---

## Genel Notlar

- **Test Sırası:** P0 → P1 → P2
- **Smoke Test:** Her P0/P1 item sonrası `pnpm --filter web-next typecheck`
- **Manuel QA:** Her item sonrası görsel kontrol (ekran görüntüsü al)
- **Regression:** Mevcut özellikler bozulmamalı

---

## Çıktı Formatı

Her item tamamlandığında:
- [x] Item tamamlandı
- [ ] Smoke test geçti
- [ ] Manuel QA yapıldı
- [ ] Ekran görüntüsü alındı

---

## Sonraki Adımlar

PATCH W.2 tamamlandıktan sonra:
- P0: Skeleton loading + empty state standardı
- P0: Form validation + inline error copy
- P1: Tooltip portal kullanımı (overflow container'larda)

