# 📊 SCROLLBAR AUDIT RAPORU - Detaylı Analiz

**Tarih:** 2025-01-15
**Sprint:** Scrollbar Polish & Single-Scroll Contract
**Durum:** ✅ Control sayfası tamamlandı, diğer sayfalar için audit gerekli

---

## 🎯 MEVCUT DURUM ANALİZİ

### ✅ Control Sayfası (/control) - BAŞARILI

**Durum:** Scrollbar savaşları büyük ölçüde bitti ✅

#### Risk / Alerts / Audit Tab'ları
- ✅ Empty state'ler tek ekrana sığıyor
- ✅ Gereksiz yükseklik ve "içten içe" scroll yok
- ✅ `scrollbar-gutter: auto` kullanılıyor (premium terminal hissi)

#### Release Gate (Canary) Tab
- ✅ Checklist 2 kolon layout (kart yüksekliği yarıya düşmüş)
- ✅ Nested scroll yok
- ✅ `overflow-visible` ile iç scroll önlendi

**Kod Referansları:**
```575:577:apps/web-next/src/app/(shell)/control/page.tsx
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col"
        style={{ scrollbarGutter: 'auto' } as React.CSSProperties}
```

---

### ⚠️ İYİLEŞTİRME FIRSATLARI

#### 1. Dinamik İçerikte Layout Shift Testi

**Sorun:** `scrollbar-gutter: auto` bazen "bir satır taşıp scrollbar çıkınca" içerikte 1–2px kayma hissettirebilir.

**Etkilenen Sayfalar:**
- MarketData (yüksek frekanslı değişen tablo)
- Running (canlı strateji güncellemeleri)
- Strategies (filtreleme sonrası dinamik içerik)

**Çözüm Önerisi:**
- Yalnız yüksek frekanslı değişen sayfalarda `scrollbar-gutter: stable` opsiyonu
- Ya da "stable + koyu arkaplanla kamufle" yaklaşımı

**Mevcut Durum:**
```286:297:apps/web-next/src/components/layout/AppFrame.tsx
            className={cn(
              "h-[calc(100dvh-var(--app-topbar-h,48px))] min-h-0 overflow-hidden flex flex-col scroll-gutter-stable",
              isMarketFullscreen && "overflow-hidden p-0"
            )}
            style={isMarketFullscreen ? {} : {
              paddingLeft: 'var(--page-px, 12px)',
              paddingRight: 'var(--page-px, 12px)',
              paddingTop: 'var(--page-pt, 10px)',
              // PATCH W.5b: Bottom padding - density mode'a göre dinamik + safe-area desteği
              paddingBottom: 'calc(var(--page-pb, 32px) + env(safe-area-inset-bottom, 0px))',
              overflowY: 'auto', // PATCH U: İç container scroll alır, body scroll yok
              scrollbarGutter: 'stable', // PATCH HARDENING: Prevent layout jitter
            } as React.CSSProperties}
```

**Not:** AppFrame'de zaten `scrollbarGutter: 'stable'` kullanılıyor, ancak sayfa bazında kontrol edilmeli.

---

#### 2. Settings Sayfası (Uzun Form)

**Sorun:** Uzun form içeriği için scroll olması normal, ama kritik olan: içeride ikinci bir `overflow-y-auto` daha varsa onu öldürmek.

**Mevcut Durum:**
```108:684:apps/web-next/src/app/(shell)/settings/page.tsx
  return (
    <div className="space-y-4">
      {/* UI-1: H1 sr-only (tab bar yeter, breadcrumb StatusBar'da) */}
      <PageHeader
        title="Ayarlar"
        subtitle="API anahtarları ve bağlantı ayarları"
        className="sr-only"
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800">
        ...
      </div>

      {/* Tab Content */}
      <div className="mt-3">
        {activeTab === 'exchange' && (
          <div className="space-y-4">
              <BinanceApiForm ... />
              <ApiForm ... />
              <BistBrokerForm ... />
            </div>
        )}
        ...
      </div>
    </div>
  );
```

**Kontrol Edilmesi Gerekenler:**
- Form kartlarının içinde `overflow-y-auto` var mı?
- Sayfa scroll'u yerine kart içi scroll kullanılıyor mu?
- Sadece tablo/listeler gerekiyorsa ayrı scroll olmalı

**Öneri:** Settings sayfasında form kartları içinde scroll olmamalı, sayfa scroll'u kullanılmalı.

---

#### 3. Strategies / Running Sayfalarında "Alt Boşluk" Hissi

**Sorun:** Görsel olarak büyük siyah boşluk kalıyor. Bu bir bug değil ama "desktop trading app" hissinde daha sıkı durması için:

**Mevcut Durum:**
```90:137:apps/web-next/src/components/strategies/MyStrategiesPage.tsx
  return (
    <PageContainer size="wide">
      <div className="space-y-3">
        {/* UI-1: H1 sr-only (özet satırı + filtre barı zaten başlık gibi) */}
        <CompactPageHeader
          title="Stratejilerim"
          className="sr-only"
        />

        {/* PATCH R: Metric Ribbon - tek satır, wrap yok, yatay scroll */}
        <div className="mb-3 overflow-x-auto" style={{ height: 'var(--summary-strip-py, 10px) * 2 + 20px' }}>
          <MetricRibbon items={MOCK_METRICS} className="whitespace-nowrap" />
        </div>

        {/* PATCH R: Filter Bar - height token */}
        <div className="mb-3" style={{ height: 'var(--filters-h, 36px)' }}>
          <FilterBar
            chips={filterChips}
            searchPlaceholder="Strateji ara..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </div>

        {/* Dense Table */}
        <DenseStrategiesTable
          columns={[...]}
          data={filteredStrategies}
          variant="my-strategies"
          ...
        />
      </div>
    </PageContainer>
  );
```

**Öneriler:**
1. Tablo container'ını biraz daha aşağı uzatmak (ör. footer/pagination placeholder)
2. Üstteki özet bar yüksekliğini 1 tık azaltmak
3. Bottom padding'i kontrol etmek (PageContainer'da)

---

## 📋 SINGLE-SCROLL KONTRAKTI AUDIT CHECKLIST

### MarketData Sayfası (/market-data)

**Kontrol Edilmesi Gerekenler:**
- [ ] Ana container `overflow-y-auto` kullanıyor mu?
- [ ] İç tablo container'ında nested scroll var mı?
- [ ] Workspace view'da chart container'ı scroll yapıyor mu?
- [ ] Fullscreen modda scroll davranışı doğru mu?

**Mevcut Kod:**
```185:190:apps/web-next/src/app/(shell)/market-data/page.tsx
  return (
    <div className={cn("h-full", viewMode === 'full' ? "overflow-hidden h-screen w-screen" : "overflow-y-auto w-full")}>
      <div className={cn(
        viewMode === 'full' ? "h-full w-full p-0" :
        viewMode === 'list' ? "w-full max-w-none px-4 py-3" : // PATCH W.3: Full width, no max-w constraint
        "container mx-auto px-4 py-3"
      )}>
```

**Sorun:** List view'da `overflow-y-auto` kullanılıyor, ancak AppFrame'in main container'ı zaten scroll yapıyor. Bu çift scroll yaratabilir.

---

### Strategies Sayfası (/strategies)

**Kontrol Edilmesi Gerekenler:**
- [ ] PageContainer içinde scroll var mı?
- [ ] DenseStrategiesTable içinde scroll var mı?
- [ ] MetricRibbon yatay scroll yapıyor mu? (Bu normal)

**Mevcut Kod:**
```90:137:apps/web-next/src/components/strategies/MyStrategiesPage.tsx
  return (
    <PageContainer size="wide">
      <div className="space-y-3">
        ...
      </div>
    </PageContainer>
  );
```

**Not:** PageContainer'ın iç yapısını kontrol etmek gerekiyor.

---

### Running Sayfası (/running)

**Kontrol Edilmesi Gerekenler:**
- [ ] PageContainer içinde scroll var mı?
- [ ] DenseStrategiesTable içinde scroll var mı?
- [ ] MetricRibbon yatay scroll yapıyor mu? (Bu normal)

**Mevcut Kod:**
```94:128:apps/web-next/src/components/strategies/RunningStrategiesPage.tsx
  return (
    <PageContainer size="wide">
      <div className="space-y-3">
        ...
      </div>
    </PageContainer>
  );
```

---

## 🔧 ÖNERİLEN DÜZELTMELER

### 1. MarketData: Scroll Kontratı Düzeltmesi

**Sorun:** List view'da `overflow-y-auto` kullanılıyor, AppFrame'in main container'ı zaten scroll yapıyor.

**Çözüm:** List view'da `overflow-y-auto` kaldırılmalı, AppFrame'in scroll'una güvenilmeli.

---

### 2. Settings: Form Kartları İçi Scroll Kontrolü

**Kontrol:** Form kartlarının içinde `overflow-y-auto` var mı?

**Çözüm:** Eğer varsa, sayfa scroll'una taşınmalı.

---

### 3. Strategies/Running: Alt Boşluk Düzeltmesi

**Çözüm:**
- Bottom padding kontrolü
- Tablo container'ına min-height eklenebilir
- Özet bar yüksekliği optimize edilebilir

---

### 4. Dinamik İçerik: Layout Shift Önleme

**Çözüm:** MarketData ve Running sayfalarında `scrollbar-gutter: stable` kullanılabilir (opsiyonel, performans testi sonrası).

---

## 📊 SONUÇ

### ✅ Başarılı Alanlar
- Control sayfası scrollbar savaşlarını kazandı
- Empty state'ler tek ekrana sığıyor
- Release Gate 2 kolon layout ile optimize edildi

### ⚠️ İyileştirme Gereken Alanlar
- MarketData: Çift scroll riski
- Settings: Form kartları içi scroll kontrolü
- Strategies/Running: Alt boşluk hissi
- Dinamik içerik: Layout shift testi

---

## 🎯 SONRAKI ADIMLAR

1. MarketData sayfasında scroll kontratını düzelt
2. Settings sayfasında form kartları içi scroll kontrolü yap
3. Strategies/Running sayfalarında alt boşluk düzeltmesi
4. Dinamik içerik için layout shift testi (opsiyonel)

