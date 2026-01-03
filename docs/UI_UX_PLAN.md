# Spark Trading Platform — UI/UX Planı ve Uygulama Talimatları

## Amaç
Spark platformunda mevcut ve planlanan sayfalar için erişilebilirlik, kullanıcı deneyimi ve veri görselleştirme açısından standart bir UI/UX çizgisi oluşturmak. Hedef: NN/g heuristics + WCAG 2.2 AA uyumu ve "sistem durumu görünürlüğü" yüksek, profesyonel trading uygulaması hissi.

## Stratejik Hedefler
1. **Sistem durumu görünürlüğü**
   - Skeleton/loading state, "bağlantı var/yok", veri güncellendi, hata ve retry durumları.
2. **Form UX + hata önleme**
   - Inline validasyon, alan bazlı hata mesajları, submit sırasında disabled + spinner.
3. **Erişilebilirlik (WCAG 2.2 AA)**
   - Kontrast ≥ 4.5:1, klavye ile tam gezilebilirlik, odak (focus) görünürlüğü.
4. **Gezinim netliği**
   - Sol menü aktif sayfa vurgusu, breadcrumb, sayfa başlık hiyerarşisi.
5. **Veri görselleştirme standardı**
   - Grafiklerde başlık, eksen etiketleri, birim; tooltip'lerde değer + birim; tablo başlıkları/okunabilirlik.

---

## Sayfa Bazlı İş Listesi (D1–D3 Sonrası)

### Ana Sayfa (Dashboard)
- [ ] Ticker ve strateji panellerinde **skeleton loading**
- [ ] Sol menüde **aktif sayfa highlight**
- [ ] Üst çubukta **WS bağlantı durumu** (örn: WS: Connected / Degraded / Down)
- [ ] "Son güncelleme" ve "staleness" göstergesi (kısa, tek satır)

### Strategy Lab
- [ ] Kaydet/Backtest/Optimize için **spinner + başarı/toast**
- [ ] Kod editörü hataları için **inline** açıklama (editör altı panel veya satır içi marker)
- [ ] "Run" sonrası **son log'lar + status paneli**
- [ ] Klavye kısayolları:
  - Ctrl+Enter: backtest
  - Ctrl+Shift+O: optimize

### Stratejilerim
- [ ] Sayfalama veya sonsuz kaydırma
- [ ] Silme/Düzenle için onay diyalogu (modal)

### Çalışan Stratejiler
- [ ] Sparkline boyutu artır + tooltip ekle
- [ ] Pause/Resume butonları: ikon + metin + tooltip
- [ ] Durum rozeti: running / paused / error

### Portföy
- [ ] Tablo header sabitleme (sticky)
- [ ] Zebra desen + kolon başlığı sıralama ikonları
- [ ] Periyodik güncellenen satırlarda "update pulse" (hafif animasyon)

### Ayarlar
- [ ] Form alanları: label + aria-describedby
- [ ] Tema/dil seçimi TAB ile gezilebilir
- [ ] Kaydet butonu: disabled + spinner

### Alerts (Planlanan)
- [ ] Boş durum: "Henüz bir alarmınız yok" + CTA
- [ ] Yeni alarm formu: doğrulama + onay

### Market Analysis (Planlanan)
- [ ] Dashboard grid düzeni (okunabilirlik) optimize
- [ ] Grafiklerde başlık/açıklama/eksen etiketleri zorunlu
- [ ] Tooltip: renkli değer + birim

---

## UI Component Kuralları

### Butonlar
- Primary: `btn-primary` (tutarlı renk, belirgin focus ring)
- Secondary: `btn-secondary`
- Tüm ikon-butonda `aria-label` zorunlu
- Loading state: spinner + disabled

### Formlar
- Zorunlu alanlarda `*` ve inline validasyon
- Hata mesajları alanın hemen altında, net ve kısa
- Submit sırasında form kilitlenir; işlem bitince başarı/başarısızlık geri bildirimi

### Tablo & Grafikler
- Tablo: `thead > th[scope="col"]`, zebra pattern, numerik sütunlarda tabular/mono font
- Grafik: başlık + eksen label + birim + tooltip (değer + birim)
- Renk tek başına anlam taşımasın; ikon/etiket ile destekle

---

## Test ve Kabul Kriterleri
- **WCAG AA Kontrast:** Metin kontrastı ≥ 4.5:1
- **Klavye Erişilebilirlik:** Tüm interaktif öğelere TAB ile erişim; görünür focus
- **Form Validasyonları:** 5/5 hatalı form senaryosu yakalanmalı
- **Yükleme Süresi (P95):** < 3s; yükleme sırasında skeleton görünmeli
- **Skeleton & Boş Durum:** Her kritik sayfada en az 1 örnek (loading + empty state)

---

## Kaynaklar
- NN/g Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- WCAG 2.2 Quick Ref: https://www.w3.org/WAI/WCAG22/quickref/
- Tableau Data Viz Best Practices: https://www.tableau.com/learn/articles/data-visualization-best-practices

---

## Sonraki Adım
- Bu dokümanı referans alarak UI PR'larında "UI/UX Checklist" uygulanacak.
- README'ye link: `Docs/UI & UX Planı (docs/UI_UX_PLAN.md)`
