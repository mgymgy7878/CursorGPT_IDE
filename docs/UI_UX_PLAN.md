# Spark Trading Platform — UI/UX Planı + Figma Parity Talimatı

**Amaç:** Spark UI'ının Figma prototipi ile görsel/etkileşimsel pariteye (≥%95) ulaşması ve ürün standardının (erişilebilirlik, tutarlılık, geri bildirim, veri görselleştirme) kalıcı hale getirilmesi.

## 1) Kapsam ve Tanım
Bu doküman tüm sayfalar için:
- **Figma Parity**: tipografi, spacing, renk/token, layout, ikonografi, component davranışı
- **Erişilebilirlik (WCAG 2.2 AA)**: klavye erişimi, odak halkası, kontrast, aria etiketleri
- **NN/g Heuristics**: sistem durumu görünürlüğü, hata önleme, tutarlılık, kullanıcı kontrolü
- **Veri Görselleştirme**: eksen/legend/birim netliği, tooltip standardı, okunabilir tablolar
- **Performans**: skeleton/loading, render-throttle, virtualization (gerekirse)

## 2) "Golden Master" Kuralları (Figma Parity Çerçevesi)
**Golden Master:** TopStatusBar + 3-panel layout (Sidebar / Main / Copilot) görsel dili referanstır.

### 2.1 Parity Checklist (her sayfa için zorunlu)
- **Tipografi:** varsayılan body metin standardı: `text-[13px] font-medium leading-none` (veya mevcut design token karşılığı)
- **Spacing:** kart iç padding, gap ve pill boyutları design token'lara bağlı olmalı
- **Renkler:** status renkleri (ok/uyarı/hata) tek kaynaktan gelmeli (token)
- **Layout:** 3-section düzen bozulmayacak; overflow taşmaları engellenecek
- **İkonografi:** ikon seti tek kaynak (SparkMark / lucide setinden seçilenler)
- **Interaktivite:** hover/focus/active durumları tutarlı

### 2.2 Kanıt (evidence) üretimi
Her parity düzeltmesi sonrası:
- "Önce/Sonra" ekran görüntüsü (gerekirse)
- Kısa not: hangi fark kapatıldı (3–5 madde)
- (Varsa) ilgili component path'i

## 3) Global UI Standartları (Component Kuralları)
### 3.1 Buton Standardı
- **Primary**: tek bir ana renk + net focus ring
- **Secondary**: nötr ton + hover ayrımı
- **Destructive**: kırmızı ton + onay gerektiren eylemler
- **A11y**: ikon-only butonlarda `aria-label` zorunlu

### 3.2 Form Standardı
- Label + `aria-describedby` zorunlu
- Zorunlu alan `*` ile işaretlenir
- **Inline validasyon** (alanın hemen altında mesaj)
- Submit sırasında: disabled + spinner + geri bildirim
- Hata dili: kısa, yönlendirici, alan bazlı

### 3.3 Toast / Modal Standardı
- Toast: bilgi / başarı / uyarı / hata seviyeleri
- Modal: sadece kritik ve geri dönüşsüz aksiyonlarda
- "Emergency exit": İptal/Geri al her kritik akışta görünür

### 3.4 Tablo Standardı
- `thead > th[scope="col"]` zorunlu
- Zebra satır deseni + hover row
- Sıralama ikonu ve erişilebilir etiketler
- Büyük listelerde: pagination veya virtualization

### 3.5 Grafik Standardı (Backtest/Market)
- Başlık + kısa açıklama
- Eksen etiketleri + birim
- Tooltip: değer + birim + zaman damgası
- Renk semantiği: yeşil(+), kırmızı(-), sarı(uyarı)
- Küçük sparkline'lar: tooltip zorunlu

## 4) Sistem Durumu Görünürlüğü (P0)
Tüm ana sayfalarda:
- **Skeleton / loading state** (en az 1 örnek)
- WS/API/Executor bağlantı durumu üst çubukta görünür
- Veri yenilenince satır/metric "soft highlight" (hafif animasyon) ile anlaşılır

## 5) Sayfa Bazlı İş Listesi (Öncelikli Backlog)
Aşağıdaki maddeler parity + kullanılabilirlik için "minimum set"tir.

### 5.1 Ana Sayfa (Dashboard)
- [ ] Ticker ve strateji panellerinde skeleton loading
- [ ] Sol menü: aktif sayfa highlight + tutarlı ikon/metin
- [ ] Üst çubuk: WS bağlantı durumu (Connected/Degraded/Down)
- [ ] Kartlarda taşma koruması (`overflow-hidden`, uzun metin clamp)
- [ ] Figma ile kart padding/gap/tipografi birebir

### 5.2 Piyasa Verileri (Market Data)
- [ ] Tab/filtre alanları klavye ile gezilebilir
- [ ] Grafik tooltip standardı (birim + zaman)
- [ ] Empty state: "Veri yok / bağlantı yok" + CTA (yenile)
- [ ] Parity: layout ve kart stilleri

### 5.3 Strateji Laboratuvarı (Strategy Lab)
- [ ] Kaydet/Backtest/Optimize: spinner + başarı/toast
- [ ] Kod editör hataları: inline açıklama paneli
- [ ] "Run" sonrası son loglar & status paneli
- [ ] Kısayollar: Ctrl+Enter (backtest), Ctrl+Shift+O (optimize)
- [ ] Param-diff + risk rozetleri (planlanan flow'a hazırlık)

### 5.4 Stratejilerim
- [ ] Sayfalama veya sonsuz kaydırma
- [ ] Sil/Düzenle: onay diyaloğu + geri alma (mümkünse)
- [ ] Boş durum mesajı + "Strateji oluştur" CTA

### 5.5 Çalışan Stratejiler
- [ ] Sparkline boyutu artır + tooltip
- [ ] Pause/Resume: ikon + metin (anlam net)
- [ ] Durum rozeti: running/paused/error
- [ ] Satır güncellemede soft highlight
- [ ] Risk/Exposure mini özetleri (tek satır)

### 5.6 Portföy
- [ ] Tablo header sabit (sticky)
- [ ] Zebra + sıralama ikonları
- [ ] Kontrast kontrol (AA ≥ 4.5:1)
- [ ] Güncellenen satırlarda soft highlight

### 5.7 Uyarılar (Alerts) — Planlanan
- [ ] Empty state: "Henüz alarm yok" + CTA
- [ ] Yeni alarm formu: inline doğrulama + onay
- [ ] Alarm liste: filtre/sıralama

### 5.8 Risk / Koruma
- [ ] Risk limit bar'lar: açıklama + birim
- [ ] Kill switch vb. kritik aksiyon: modal + net geri bildirim
- [ ] Durum kartları parity ve okunabilirlik

### 5.9 Denetim / Loglar
- [ ] Filtre + arama + export
- [ ] Tablo standardı + erişilebilirlik
- [ ] "Son olaylar" görünümü (en kritik 20 kayıt)

### 5.10 Ayarlar
- [ ] Tüm alanlar label + aria-describedby
- [ ] Tema/dil seçimi TAB ile gezilebilir
- [ ] Kaydet sırasında disabled + spinner + toast
- [ ] Hatalı input senaryoları (en az 5) yakalanmalı

## 6) Erişilebilirlik (WCAG 2.2) — Kontrol Listesi
- [ ] Tüm interaktif öğeler TAB ile erişilebilir
- [ ] Focus ring görünür ve tutarlı
- [ ] Kontrast: metin/arkaplan ≥ 4.5:1
- [ ] `aria-label` / `aria-describedby` eksiksiz
- [ ] Motion: yoğun animasyonlar "reduced motion" ile kısılabilir

## 7) Test & Kabul Kriterleri (Definition of Done)
**Her sayfa için:**
- Parity: Figma'ya görsel olarak %95+ (tipografi/spacing/layout)
- A11y: klavye gezilebilirlik + odak görünürlüğü PASS
- Skeleton/empty state: en az 1 örnek PASS
- Form/hata: inline validasyon PASS
- Grafik/tablo: başlık/etiket/birim PASS

## 8) Uygulama Sırası (Önerilen)
1) Dashboard (Ana Sayfa) + Global tokens
2) Strategy Lab
3) Running Strategies
4) Portfolio
5) Settings
6) Alerts + Risk/Protection + Logs

--- 
**Not:** Bu plan, parity rehberi ve UX araştırması çıktılarının "tek kaynak doküman" halidir. Gerektiğinde görevler UX Test Runner'a da işlenebilir.
