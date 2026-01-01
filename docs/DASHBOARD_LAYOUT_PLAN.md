# Spark Trading Platform — Anasayfa Yerleşim Planı ve Özellik Listesi

**Versiyon:** v1.0
**Tarih:** 2025-01-20
**Durum:** 🟢 Aktif Geliştirme

---

## 📐 Yerleşim Mimarisi

### Genel Yapı

```
┌─────────────────────────────────────────────────────────────┐
│ StatusBar (48px)                                           │
├─────────────────────────────────────────────────────────────┤
│ KpiStrip (sticky, ~36px)                                   │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│ SOL KOLON        │ SAĞ KOLON (Rail)                        │
│ (flex-1)         │ (min-w-[360px])                         │
│                  │                                          │
│ ┌──────────────┐│ ┌──────────────┐                        │
│ │ LiveNews     ││ │ QuickPrompt  │                        │
│ │ (max-h: 50%) ││ │ (h: 32%)     │                        │
│ └──────────────┘│ └──────────────┘                        │
│                  │                                          │
│ ┌──────────────┐│ ┌──────────────┐                        │
│ │ PortfolioPnL ││ │ StrategiesPnL │                        │
│ │ (h: 38%)     ││ │ (h: 32%)     │                        │
│ └──────────────┘│ └──────────────┘                        │
│                  │                                          │
│                  │ ┌──────────────┐                        │
│                  │ │ MarketQuick   │                        │
│                  │ │ (flex-1)      │                        │
│                  │ └──────────────┘                        │
└──────────────────┴──────────────────────────────────────────┘
```

### Responsive Breakpoints

- **Mobile (< 768px):** Tek kolon, dikey stack
- **Tablet (768px - 1024px):** 2 kolon, sağ rail sabit 320px
- **Desktop (≥ 1024px):** 2 kolon, sağ rail 360-420px

---

## 🎯 Anasayfada Olması Gereken Özellikler

### ✅ Mevcut Özellikler (Tamamlanmış)

#### 1. **KpiStrip** (Üst Şerit)
- ✅ API durumu (EB %98,0)
- ✅ WebSocket durumu (Bağlı/Bağlı değil)
- ✅ Executor durumu
- ✅ P95 latency metrikleri
- ✅ Anlık gecikme göstergesi (≤1sn)
- ✅ Error Budget (EB %100)
- ✅ Koruma Doğrulama rozeti
- ✅ Son güncelleme zamanı
- ✅ Veri sağlayıcı bilgisi (BTCTurk/Binance)

**Kabul Kriterleri:**
- Sticky positioning (kaydırma sırasında üstte kalır)
- Tek satır, çipler kaymıyor
- ≥44×44 CSS px hedef boyutu
- WCAG 2.2 uyumlu odak halkaları

#### 2. **LiveNews** (Sol Üst)
- ✅ Canlı haber akışı
- ✅ KAP/Kripto filtreleri
- ✅ Kaynak etiketleme (CoinDesk, CryptoNews, KAP)
- ✅ Zaman damgası (12dk, 23dk, vb.)
- ✅ Hover tooltip ile özet
- ✅ localStorage ile filtre kalıcılığı

**Kabul Kriterleri:**
- Max-height: viewport'un %50'si
- İç scroll (overflow-y-auto)
- Filtre butonları ≥44×44
- aria-pressed durumları

#### 3. **PortfolioPnL** (Sol Alt)
- ✅ Toplam bakiye gösterimi
- ✅ Günlük/Aylık P&L toggle
- ✅ Sparkline grafik (PortfolioSpark)
- ✅ Pozitif/negatif renk kodlaması
- ✅ Tabular-nums sayısal düzen

**Kabul Kriterleri:**
- Sabit yükseklik (viewport'un %38'i, min 208px)
- Responsive sparkline
- Erişilebilir range toggle (Gün/Hafta)

#### 4. **QuickPrompt** (Sağ Üst)
- ✅ Hızlı komut girişi
- ✅ "Paneli Aç/Kapat" disclosure butonu
- ✅ Enter/Shift+Enter desteği
- ✅ Copilot dock entegrasyonu
- ✅ aria-expanded/aria-controls

**Kabul Kriterleri:**
- Sabit yükseklik (viewport'un %32'si, min 208px)
- WCAG disclosure pattern uyumu
- Klavye erişilebilirliği (Enter/Space)

#### 5. **StrategiesPnL** (Sağ Orta)
- ✅ Açık P&L toplamı
- ✅ Aktif strateji sayısı
- ✅ Top-3 strateji listesi
- ✅ Yüzdelik değişim göstergesi
- ✅ Pozitif/negatif renk kodlaması

**Kabul Kriterleri:**
- Sabit yükseklik (viewport'un %32'si, min 208px)
- Real-time güncelleme (SWR)
- Erişilebilir P&L gösterimi

#### 6. **MarketQuick** (Sağ Alt)
- ✅ Piyasa tablosu (BTC, ETH, vb.)
- ✅ Akıllı chip'ler (En Çok Yükselen, En Çok Düşen, En Yüksek Hacim)
- ✅ Tek tıkla sıralama
- ✅ İlk 3 satır highlight
- ✅ 24 saatlik değişim ve hacim

**Kabul Kriterleri:**
- Flex-1 (kalan alanı doldurur)
- Responsive tablo
- Erişilebilir sıralama butonları
- aria-sort durumları

---

### 🔄 Planlanan Özellikler (Backlog)

#### 7. **Risk Dashboard** (Yeni Modül)
- [ ] Risk metrikleri (VaR, CVaR)
- [ ] Pozisyon yoğunlaşması grafiği
- [ ] Koruma durumu göstergesi
- [ ] Risk limiti uyarıları

**Öncelik:** P2
**Tahmini Süre:** 2-3 sprint

#### 8. **Alert Center** (Yeni Modül)
- [ ] Aktif alarmlar widget'ı
- [ ] Kritik alarmlar öncelik sıralaması
- [ ] Hızlı alarm yönetimi (Mute/Dismiss)
- [ ] Alarm geçmişi linki

**Öncelik:** P3
**Tahmini Süre:** 1-2 sprint

#### 9. **Performance Overview** (Yeni Modül)
- [ ] Son 24 saat performans grafiği
- [ ] Strateji bazlı karşılaştırma
- [ ] Benchmark karşılaştırması (BTC/ETH)
- [ ] Detaylı analiz linki

**Öncelik:** P3
**Tahmini Süre:** 2 sprint

#### 10. **Quick Actions** (Yeni Modül)
- [ ] Hızlı pozisyon açma/kapama
- [ ] Kill switch toggle
- [ ] Strateji duraklat/devam ettir
- [ ] Acil durum butonları

**Öncelik:** P2
**Tahmini Süre:** 1 sprint

---

## 📏 Ölçeklendirme Planı

### Grid Sistemi

```css
/* Desktop (≥1024px) */
grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
gap: 1.5rem (24px);

/* Tablet (768px-1023px) */
grid-template-columns: minmax(0, 1fr) 320px;
gap: 1rem (16px);

/* Mobile (<768px) */
grid-template-columns: 1fr;
gap: 1rem (16px);
```

### Yükseklik Hesaplamaları

```javascript
// Viewport yüksekliği hesabı
const fold = 'calc(100vh - 48px - 36px)'; // StatusBar + KpiStrip

// Modül yükseklikleri (desktop)
LiveNews: max-height: calc(fold * 0.50)
PortfolioPnL: height: calc(fold * 0.38), min-height: 208px
QuickPrompt: height: calc(fold * 0.32), min-height: 208px
StrategiesPnL: height: calc(fold * 0.32), min-height: 208px
MarketQuick: flex-1 (kalan alan)
```

### Minimum Boyutlar (WCAG 2.2)

- **Tıklanabilir öğeler:** ≥44×44 CSS px
- **Metin:** ≥16px base font-size
- **Odak halkası:** 2px kalınlık, 3:1 kontrast
- **Spacing:** 8px grid sistemi

---

## 🎨 Görsel Hiyerarşi

### Renk Sistemi

```css
/* Durum Renkleri */
--success: #10B981 (emerald-500)
--warn: #F59E0B (amber-500)
--error: #EF4444 (red-500)
--info: #3B82F6 (blue-500)

/* P&L Renkleri */
pozitif: text-emerald-400
negatif: text-red-400
nötr: text-zinc-400

/* Arka Plan */
--bg-page: #0b0f14 (en koyu)
--bg-card: #0f141b (elevated +1)
--bg-elev: #131924 (elevated +2)
```

### Tipografi

```css
/* Başlıklar */
h1: text-2xl font-bold (24px)
h2: text-xl font-semibold (20px)
h3: text-lg font-semibold (18px)

/* Gövde Metni */
body: text-sm (14px)
small: text-xs (12px)

/* Sayısal Değerler */
tabular-nums: font-variant-numeric: tabular-nums;
mono: font-mono (kod ve sayılar için)
```

---

## 🔄 Güncelleme Stratejisi

### Real-time Güncellemeler

1. **KpiStrip:** Her 1 saniyede (WebSocket)
2. **LiveNews:** Her 30 saniyede (API polling)
3. **PortfolioPnL:** Her 5 saniyede (WebSocket)
4. **StrategiesPnL:** Her 3 saniyede (SWR)
5. **MarketQuick:** Her 2 saniyede (WebSocket)

### Optimizasyon

- **SWR** ile otomatik cache ve revalidation
- **React.memo** ile gereksiz render'ları önleme
- **Virtual scrolling** uzun listeler için (LiveNews, MarketQuick)
- **Debounce** kullanıcı etkileşimlerinde

---

## ✅ Kabul Kriterleri (Definition of Done)

### Fonksiyonel

- [x] Tüm modüller görünür ve çalışır durumda
- [x] Responsive tasarım (mobile/tablet/desktop)
- [x] Real-time güncellemeler çalışıyor
- [ ] Tüm filtreler ve toggle'lar çalışıyor
- [ ] Klavye navigasyonu tam uyumlu

### Erişilebilirlik (WCAG 2.2 AA)

- [x] Tüm tıklanabilir öğeler ≥44×44 px
- [x] Odak halkaları görünür (3:1 kontrast)
- [x] ARIA etiketleri doğru kullanılmış
- [x] Ekran okuyucu desteği (role, aria-label)
- [ ] Axe testleri geçiyor (0 serious/critical)

### Performans

- [ ] Lighthouse Performance ≥90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Bundle size <200KB (gzipped)

### Test

- [ ] Unit testler (%70+ coverage)
- [ ] E2E testler (Playwright)
- [ ] Manuel QA geçti
- [ ] Cross-browser test (Chrome, Firefox, Safari)

---

## 📝 Notlar

### Teknik Borçlar

1. **LiveNews:** Virtual scrolling eklenmeli (uzun listeler için)
2. **MarketQuick:** Infinite scroll eklenebilir
3. **PortfolioPnL:** Sparkline animasyonları optimize edilmeli
4. **StrategiesPnL:** Real-time WebSocket entegrasyonu

### Gelecek İyileştirmeler

1. **Drag & Drop:** Modüllerin sırasını kullanıcı değiştirebilmeli
2. **Özelleştirme:** Kullanıcı widget'ları gizleyebilmeli/gösterebilmeli
3. **Dark/Light Tema:** Tema toggle eklenecek
4. **Density Toggle:** Kompakt/Rahat görünüm seçenekleri

---

**Son Güncelleme:** 2025-01-20
**Sahip:** UI/UX Team
**İlgili Dokümanlar:**
- [UI/UX Plan](docs/UI_UX_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)

