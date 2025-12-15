# Spark Trading Platform — UI/UX Planı ve Uygulama Talimatları

## 0) Amaç
Spark platformunda mevcut ve planlanan sayfalar için; erişilebilirlik (WCAG 2.2 AA), kullanılabilirlik (NN/g heuristics), tutarlı tasarım sistemi ve veri görselleştirme standartlarını tanımlamak.

Bu doküman "tasarım niyeti + uygulama talimatı + test/kabul kriteri" olarak kullanılmalıdır.

## 0.1) Kapsam / Öncelik Matrisi (P0-P1-P2)

| Sayfa | Öncelik | Durum | Kritik Özellikler |
|-------|---------|-------|-------------------|
| **Ana Sayfa (Dashboard)** | P0 | Mevcut | Skeleton loading, aktif menü vurgusu, WS durumu |
| **Strategy Lab** | P0 | Mevcut | Spinner/toast, inline hata açıklama, kısayollar |
| **Çalışan Stratejiler** | P0 | Mevcut | Sparkline tooltip, durum rozeti, pause/resume |
| **Portföy** | P1 | Mevcut | Sticky header, zebra pattern, sıralama |
| **Stratejilerim** | P1 | Mevcut | Sayfalama, onay modalı, boş durum |
| **Ayarlar** | P1 | Mevcut | Form erişilebilirlik, tema/dil seçimi |
| **Alerts** | P2 | Planlanan | Boş durum, yeni alarm formu |
| **Market Analysis** | P2 | Planlanan | Grafik standartları, tooltip standardı |

**Öncelik Açıklaması:**
- **P0 (Kritik):** Core functionality, kullanıcı akışının temel sayfaları
- **P1 (Yüksek):** Önemli özellikler, kullanıcı deneyimini önemli ölçüde iyileştiren
- **P2 (Orta):** Planlanan özellikler, gelecek iterasyonlar için

## 1) Tasarım İlkeleri (Kısa)
### 1.1 Sistem Durumu Görünürlüğü (NN/g)
- Yükleme, hata, boş durum, güncellendi/yenileniyor, bağlantı koptu gibi durumlar *her zaman* görünür olmalı.
- "Sessiz bekleme" yok: skeleton/spinner/toast/inline status zorunlu.

### 1.2 Erişilebilirlik (WCAG 2.2 AA)
- Kontrast: metin/arka plan ≥ 4.5:1
- Klavye ile tam gezilebilirlik (TAB/Shift+TAB/Enter/Escape)
- Focus halkası net, asla "outline: none" ile kör edilmez
- Form alanlarında label + aria-describedby + hata mesajı ilişkisi

### 1.3 Tutarlılık ve Dil
- UI'da TR/EN karışımı minimize edilir: menü ve temel sayfa başlıkları tek dil standardına bağlanır.
- Terminoloji sözlüğü (ileride docs/GLOSSARY.md) ile aynı kelimeler aynı anlamda kullanılır.

### 1.4 Veri Görselleştirme
- Grafiklerde: başlık + açıklama + eksen etiketleri + birim zorunlu
- Tooltip'te değer + birim + bağlam (örn. "24s değişim", "USD", "%")
- Tablo: zebra pattern, thead>th[scope], sıralama ikonları, sabit header (gerekli yerlerde)

## 2) Global UI Standartları (Uygulama Kuralları)

### 2.1 Yükleme / Skeleton / Empty State
- Her kritik panel için:
  - loading → skeleton
  - error → açıklayıcı hata + "Tekrar dene"
  - empty → "Henüz veri yok" + net CTA (örn. "Strateji Oluştur")

### 2.2 Bildirimler (Toast) ve Inline Geri Bildirim
- Kısa işlemler: toast (başarılı/uyarı/hata)
- Form hataları: *inline* (alana yakın), genel toast tek başına yeterli sayılmaz
- Uzun işlemler (backtest/optimize): progress / status panel + son log satırları

### 2.3 Butonlar
- Primary / Secondary / Destructive ayrımı sabit
- Icon-only butonlarda aria-label zorunlu
- Disabled durumda: tooltip ile "neden disabled" açıklaması önerilir

### 2.4 Formlar
- Zorunlu alanlar yıldız (*) ile
- Submit sırasında: disabled + spinner
- Hata mesajı dili: "Ne yanlış + nasıl düzeltilir"
- Alan bazlı validasyon: realtime (blur/change) + submit guard

### 2.5 Tablo & Grafik
- Tablo: zebra + sticky header + numeric kolonlar tabular-nums
- Kolon başlıklarında sıralama göstergesi
- Grafik: başlık, eksen, birim, tooltip standardı

### 2.6 Klavye ve Focus
- Modal açılınca focus modal içine kilitlenir, ESC ile kapanır
- Menü / dropdown: ok tuşları + Enter ile seçim
- Focus ring: görünür ve kontrastlı

## 3) Sayfa Bazlı İş Listesi (D1–D3 Sonrası)

### 3.1 Ana Sayfa (Dashboard)
- [ ] Ticker ve strateji panellerinde skeleton loading
- [ ] Sol menüde aktif sayfa vurgusu + (opsiyon) breadcrumb
- [ ] Üst çubukta WS bağlantı durumu (connected/paused/reconnecting + staleness)

### 3.2 Strategy Lab
- [ ] Kaydet/Backtest/Optimize için spinner + toast
- [ ] Kod editör hataları için inline açıklama paneli (hata → öneri)
- [ ] "Run" sonrası son log'lar & status paneli (son 10 satır)
- [ ] Kısayollar:
  - Ctrl+Enter: Backtest
  - Ctrl+Shift+O: Optimize
  - Esc: Modal/Panel kapat

### 3.3 Stratejilerim
- [ ] Sayfalama veya sonsuz kaydırma
- [ ] Silme/Düzenle için onay diyaloğu (destructive confirm)
- [ ] Boş durum: "Henüz stratejin yok" + CTA

### 3.4 Çalışan Stratejiler
- [ ] Sparkline daha büyük + tooltip (PnL, DD, winrate gibi temel özet)
- [ ] Pause/Resume butonları net ikon + metin
- [ ] Durum rozeti: running/paused/error + son olay zamanı

### 3.5 Portföy
- [ ] Tablo header sabitleme
- [ ] Zebra desen + sıralama ikonları
- [ ] Periyodik güncellenen satırda animasyon vurgusu (soft highlight)

### 3.6 Ayarlar
- [ ] Form alanları: label + aria-describedby
- [ ] Tema/dil seçimi TAB ile gezilebilir
- [ ] Kaydet butonu altında spinner + başarı/uyarı durumu

### 3.7 Alerts (Planlanan)
- [ ] Boş durum + CTA
- [ ] Yeni alarm formu: inline doğrulama + onay

### 3.8 Market Analysis (Planlanan)
- [ ] Dashboard grid düzeni sadeleştirme
- [ ] Grafiklerde başlık/açıklama/eksen/birim zorunlu
- [ ] Tooltip standardı (renkli değer + birim)

## 4) Test ve Kabul Kriterleri (Definition of Done)

### 4.1 Erişilebilirlik
- WCAG AA kontrast: ≥ 4.5:1
- Klavye erişilebilirlik: tüm interaktif öğelere TAB ile erişim
- Modal/focus yönetimi: ESC kapanır, focus trap çalışır

### 4.2 Form Validasyon
- 5/5 hatalı senaryo yakalanmalı (zorunlu alan, format, limit, vb.)
- Hata mesajları alanın yanında görünür olmalı

### 4.3 Performans & Algılanan Hız
- P95 içerik görünümü < 3s (skeleton ile belirsizlik yok)
- Ağ/WS kopma senaryosunda kullanıcı "ne oldu?" sorusuna 1 sn içinde cevap almalı (status bar + mesaj)

### 4.4 Veri Görselleştirme
- Grafik: başlık + eksen + birim + tooltip zorunlu
- Tablo: thead/th scope + zebra + numeric kolon format standardı

## 5) Uygulama Notları (Kod Tarafı İçin Pratik Kurallar)
- "Sistem durumu" bileşenleri tek yerden: StatusBadge/TopStatusBar üzerinden yönet
- Loading/empty/error durumları için ortak UI helper'ları (ileride: `ui/states.ts`)
- Metrik formatlama tek helper'dan (yüzde/para/ratio) — dağınık toFixed yok

## 6) Kaynaklar (Referans)
- NN/g Usability Heuristics (genel prensip)
- WCAG 2.2 Quick Reference (AA kriterleri)
- Data visualization best practices (grafik etiketleme/birim/okunabilirlik)

## 7) Bileşen Envanteri

Bu bölüm, platformda kullanılan veya kullanılması planlanan UI bileşenlerinin envanterini ve standartlarını içerir.

### 7.1 StatusBadge
**Kullanım:** Sistem durumu göstergeleri (connected/paused/reconnecting/error)

**Standartlar:**
- Renk kodlaması: green (connected), yellow (paused), orange (reconnecting), red (error)
- Icon + metin kombinasyonu
- aria-label ile ekran okuyucu desteği
- Tooltip ile detaylı durum açıklaması (opsiyonel)

**Örnek Kullanım:**
- Üst çubukta WS bağlantı durumu
- Çalışan stratejiler sayfasında durum rozeti

### 7.2 Skeleton
**Kullanım:** Yükleme durumunda içerik placeholder'ı

**Standartlar:**
- Gerçek içerik yapısını yansıtmalı (layout preservation)
- Animasyon: pulse veya shimmer efekti
- Erişilebilirlik: `aria-busy="true"` + `aria-label="Yükleniyor..."`

**Örnek Kullanım:**
- Ana sayfa ticker/strateji panelleri
- Portföy tablosu yüklenirken

### 7.3 EmptyState
**Kullanım:** Veri olmadığında boş durum gösterimi

**Standartlar:**
- Net mesaj: "Henüz [özellik] yok"
- CTA butonu: "İlk [özellik] Oluştur" veya benzeri
- Icon veya görsel (opsiyonel)
- aria-live="polite" ile ekran okuyucu bildirimi

**Örnek Kullanım:**
- Stratejilerim sayfası (henüz strateji yok)
- Alerts sayfası (henüz alarm yok)

### 7.4 Toast
**Kullanım:** Kısa süreli bildirimler (başarı/uyarı/hata)

**Standartlar:**
- Süre: 3-5 saniye (kritik hatalar için manuel kapatma)
- Pozisyon: sağ üst veya alt (tutarlı)
- Icon + mesaj kombinasyonu
- aria-live="assertive" (hata için) veya "polite" (başarı için)
- Klavye: ESC ile kapatma

**Örnek Kullanım:**
- Strategy Lab: Kaydet/Backtest/Optimize sonrası
- Ayarlar: Kaydet sonrası

### 7.5 Modal
**Kullanım:** Onay diyalogları, form modal'ları

**Standartlar:**
- Focus trap: modal açılınca focus modal içine kilitlenir
- ESC ile kapatma
- Backdrop: semi-transparent overlay
- aria-modal="true" + aria-labelledby (başlık)
- Klavye: TAB/Shift+TAB ile gezinim, Enter ile onay

**Örnek Kullanım:**
- Stratejilerim: Silme onayı (destructive confirm)
- Strategy Lab: Optimize parametreleri formu

### 7.6 Table
**Kullanım:** Veri tabloları (portföy, strateji listesi)

**Standartlar:**
- `thead>th[scope]` ile erişilebilirlik
- Zebra pattern (alternating row colors)
- Sticky header (scroll edilebilir tablolarda)
- Numeric kolonlar: `tabular-nums` font feature
- Sıralama: kolon başlığında icon + aria-sort attribute
- Klavye: ok tuşları ile hücre gezinimi (opsiyonel)

**Örnek Kullanım:**
- Portföy sayfası
- Çalışan stratejiler listesi

### 7.7 ChartTooltip
**Kullanım:** Grafik tooltip'leri (sparkline, line chart, vb.)

**Standartlar:**
- Değer + birim + bağlam (örn. "PnL: +$1,234.56", "Winrate: 65.2%")
- Renk kodlaması: pozitif (green), negatif (red), nötr (gray)
- Eksen değerleri: x ve y eksen bilgisi
- aria-label ile ekran okuyucu desteği (opsiyonel)

**Örnek Kullanım:**
- Çalışan stratejiler: Sparkline tooltip (PnL, DD, winrate)
- Market Analysis: Grafik tooltip'leri

### 7.8 Bileşen Durum Matrisi

| Bileşen | Durum | Lokasyon | Notlar |
|---------|-------|----------|--------|
| StatusBadge | Planlanan | `ui/components/StatusBadge.tsx` | WS durumu için |
| Skeleton | Planlanan | `ui/components/Skeleton.tsx` | Loading state için |
| EmptyState | Planlanan | `ui/components/EmptyState.tsx` | Boş durum için |
| Toast | Mevcut | (Mevcut toast sistemi) | Standartlaştırılmalı |
| Modal | Mevcut | (Mevcut modal sistemi) | Focus trap kontrolü |
| Table | Kısmen | (Mevcut tablo bileşenleri) | Zebra + sticky header eklenmeli |
| ChartTooltip | Kısmen | (Mevcut chart kütüphanesi) | Standart format uygulanmalı |

**Not:** "Planlanan" bileşenler için `ui/components/` altında yeni dosyalar oluşturulacak. "Mevcut" bileşenler standartlaştırılacak veya wrapper ile sarmalanacak.
