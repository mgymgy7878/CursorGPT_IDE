# Spark Trading Platform — UI/UX Talimat + Plan (NN/g + WCAG 2.2 AA)
**Tarih:** 2025-12-27  
**Kapsam:** web-next (App Router) + ortak UI bileşenleri  
**Amaç:** Spark arayüzünü erişilebilir, tutarlı, yoğunluğu (density) kontrol edilebilir ve "sistem durumu görünür" hale getirmek.

---

## 0) Tasarım İlkeleri (kısa)
1) **Sistem durumu her zaman görünür:** WS/API/Executor + "son veri zamanı" + yükleme/işlem durumları.  
2) **Tutarlılık:** Terminoloji (TR), renk/ikon anlamları, buton hiyerarşisi, tablo/grafik düzeni.  
3) **Yoğunluk kontrollü (density):** aynı ekran 1080p'de daha fazla bilgi gösterebilir; fakat okunabilirlik (14px+) korunur.  
4) **Hata önleme:** inline validasyon, zorunlu alan işareti, güvenli varsayılanlar.  
5) **Klavye erişilebilirlik:** her etkileşim TAB ile; focus ring görünür; aria-* eksiksiz.

---

## 1) Bilgi Mimarisi (IA) — hedef yapı
**Ana menü (6):**
- `/dashboard` — Anasayfa  
- `/market-data` — Piyasa Verileri  
- `/running` — Çalışan Stratejiler  
- `/strategies` — Stratejilerim (tab: Liste/Lab)  
- `/control` — Operasyon Merkezi (tab: Risk/Uyarı/Denetim/Release Gate)  
- `/settings` — Ayarlar  

**Kural:** Menüde **aktif sayfa vurgusu** zorunlu.  
**Opsiyon:** Breadcrumb (özellikle tab'li sayfalarda).

---

## 2) Density Standardı (kritik)
### 2.1 Density Modları
- **Comfortable:** daha geniş boşluklar (demo/sunum).  
- **Compact (default hedef):** trading/operasyon ekranı yoğun.  
- **Ultra-Compact (opsiyonel):** tablo ağırlıklı power-user modu (sadece kısayol ile).

### 2.2 Token/Ölçü Kuralları
- **Header row:** 36px  
- **Table row:** 44px (hedef) / 48px (fallback)  
- **Kart padding:** default `p-4`, büyük/kritik kart `p-6`  
- **Sayısal metin:** tabular/mono sınıfları (hizalama için)  
- **Bir satır metin:** "label + value" tek satırda; taşma durumunda ellipsis + tooltip.

### 2.3 "Sıkışıklık" emniyetleri
- Kartlar `overflow-hidden`.
- Uzun metinler: ellipsis + title tooltip.
- Grid: daralınca 3→2→1 otomatik düşmeli (auto-fit/minmax).

---

## 3) Zorunlu UI Pattern'ları
### 3.1 Skeleton & Loading
**Her sayfada** en az 1 skeleton örneği:
- Dashboard kartları
- Strategy Lab aksiyonları (Generate/Backtest/Optimize)
- Tablo satırları (MarketData, Strategies, Running)

**Spinner kuralı:** 700ms üzeri işte spinner + durum metni.

### 3.2 Empty State (Boş durum)
Boş liste ise:
- Net mesaj ("Henüz strateji yok")
- 1 CTA (örn. "Strateji Oluştur")
- Mini açıklama ("Strategy Lab'dan oluşturabilirsiniz")

### 3.3 Inline Validasyon (Form UX)
- Zorunlu alan: `*`
- Hata: alanın altında kısa ve net ("Bu alan zorunlu", "Geçersiz anahtar formatı")
- `aria-describedby` ile hata mesajı bağlanmalı.
- Submit: disabled + spinner + "Kaydediliyor…"

### 3.4 Onay Diyalogları (kritik eylemler)
- Silme, kapatma, durdurma, kill-switch: **onay şart**
- Metin: "Geri alınamaz" vurgusu + ikincil "İptal" butonu.

### 3.5 Tooltip & Yardım
- İkon-only aksiyonlar tooltip zorunlu.
- Karmaşık metriklerde "?" yardım.

---

## 4) Erişilebilirlik (WCAG 2.2 AA hedef)
### 4.1 Klavye
- Tüm interaktif öğeler TAB ile ulaşılabilir.
- Focus ring görünür (outline kaybolmayacak).
- Modal açıldığında focus trap + ESC ile kapanma.

### 4.2 Kontrast
- Metin/arka plan kontrastı **AA** hedef (≥4.5:1).
- "Muted" metinler bile okunabilir kalmalı.

### 4.3 ARIA
- Butonlarda `aria-label` (ikon-only ise zorunlu)
- Form alanlarında label/id ilişkisi
- Tab sisteminde `role="tablist/tab"` uyumu

---

## 5) Sayfa Bazlı İş Listesi (Backlog)
Aşağıdaki maddeler "UI PATCH" serileriyle küçük PR'lara bölünerek yapılacak.

### 5.1 Dashboard (Anasayfa)
- [ ] Ticker/strateji kartlarında skeleton  
- [ ] Üst çubukta WS bağlantı durumu + staleness mini badge  
- [ ] Menü aktif sayfa highlight  
- [ ] Kartların padding/typography compact standarda çekilmesi

### 5.2 Market Data
- [ ] Tablo header sabit + zebra pattern  
- [ ] Row height 44px standardı  
- [ ] Mini grafik tooltip + zaman aralığı seçimi daha net  
- [ ] Action ikonlarına tooltip + aria-label

### 5.3 Stratejilerim
- [ ] Sayfalama veya sonsuz kaydırma  
- [ ] Sil/Düzenle için onay modalı  
- [ ] Liste/Lab tab geçişinde state korunması (query param ile)  
- [ ] Filtre bar density iyileştirmesi

### 5.4 Çalışan Stratejiler
- [ ] Pause/Resume butonlarına ikon+metin netliği  
- [ ] Durum rozeti: running/paused/error/degraded tek standard  
- [ ] Sparkline büyüt + tooltip  
- [ ] "Health" sütunu açıklama tooltip'i

### 5.5 Operasyon Merkezi (/control)
- [ ] Kill Switch bloğu: daha net hiyerarşi (kritik kırmızı eylem tek)  
- [ ] Risk kartları: label/value single-line + ölçü birimleri  
- [ ] Denetim tabında: seed log + arama/filtre  
- [ ] Release Gate: PASS/ATTENTION rozetleri + kanıt linkleri

### 5.6 Ayarlar
- [ ] Input label + aria-describedby tamamla  
- [ ] "Test Et" sonucu: inline durum + toast  
- [ ] Kaydet butonunda spinner + disabled  
- [ ] (Opsiyon) tema/dil seçimi klavye ile sorunsuz

### 5.7 Planlanan Sayfalar (ileriye dönük)
- Alerts: Empty state + CTA  
- Market Analysis: Grafiklerde başlık/eksen/birim/legend zorunlu  
- News: içerik hiyerarşisi (başlık/özet/kaynak) net

---

## 6) UI Component Kuralları (tasarım sistemi)
### 6.1 Butonlar
- Primary: tek ana eylem (mavi), Secondary: gri  
- Focus ring zorunlu  
- İkon-only: aria-label + tooltip

### 6.2 Tablolar
- `thead > th[scope]` zorunlu  
- Zebra + hover  
- Sıralama ikonu standardı  
- Sayısal kolonlar sağa hizalı (tabular)

### 6.3 Grafikler
- Başlık + birim + tooltip  
- Renk anlamları tutarlı (yeşil=pozitif, kırmızı=negatif; risk=amber)

---

## 7) Test / Kabul Kriterleri (UI DoD)
- [ ] Kontrast AA hedefini kıran kritik metin yok  
- [ ] Tüm interaktif öğeler klavye ile erişilebilir  
- [ ] Formlarda 5/5 hatalı senaryoda inline hata yakalanır  
- [ ] P95 "ilk içerik" < 3s, skeleton görünür  
- [ ] Empty state her sayfada en az 1 örnek

---

## 8) Evidence (kanıt) standardı
Her UI PATCH sonrası:
- 1 ekran görüntüsü (Before/After) veya kısa GIF  
- `evidence/ui/<patch>_notes.md` (değişiklik + doğrulama adımları)  
- Typecheck + build PASS kaydı

---

## 9) Önerilen PATCH sırası
1) **PATCH UI-1:** Menü active highlight + skeleton altyapısı  
2) **PATCH UI-2:** Tables (zebra + row height + header)  
3) **PATCH UI-3:** Forms (inline validation + aria)  
4) **PATCH UI-4:** Running/Control kritik netlik + tooltips  
5) **PATCH UI-5:** Contrast audit + küçük polish

---

## 10) Kaynaklar (bilgi amaçlı)
- NN/g usability heuristics  
- WCAG 2.2 quick reference  
- Veri görselleştirme best practices
