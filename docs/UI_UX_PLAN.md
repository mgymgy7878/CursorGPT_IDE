# Spark Trading Platform — UI/UX İyileştirme Planı

> Standart: NN/g Heuristics + WCAG 2.2 (AA)  
> Kapsam: Mevcut ve planlanan sayfalar; bileşen kütüphanesi; kabul kriterleri.

## 🎯 Amaç

Kullanıcı deneyimini ölçülebilir şekilde güçlendirmek; erişilebilir, tutarlı ve hızlı bir arayüz standardı sağlamak.

---

## 1) Stratejik Hedefler (Kısa)

- **Sistem durumu görünürlüğü:** skeleton/loading + boş durumlar
- **Formlarda inline validasyon** ve alan-bazlı hata mesajları
- **Kontrast AA** (≥4.5:1) ve klavye ile tam gezinim
- **Sol menüde aktif sayfa vurgusu** + gerekirse breadcrumb

---

## 2) Sayfa Bazlı İş Listesi (Özet)

### 🏠 Ana Sayfa

- [ ] Ticker/strateji panellerinde skeleton
- [ ] WS bağlantı durumu göstergesi (header)
- [ ] Menüde aktif sayfa highlight

### 🧪 Strategy Lab

- [ ] Kaydet/Backtest: spinner + başarı/toast
- [ ] Monaco hata satırında inline açıklama
- [ ] Kısayollar: `Ctrl+Enter` (backtest), `Ctrl+Shift+O` (optimize)

### 📋 Stratejilerim

- [ ] Sayfalama/sonsuz kaydırma
- [ ] Sil/Düzenle için onay modalı

### 🏃 Çalışan Stratejiler

- [ ] Sparkline boyutu + tooltip
- [ ] Pause/Resume ikon+metin; durum rozeti

### 💼 Portföy

- [ ] Sabit thead, zebra satırlar; sıralama ikonları
- [ ] Periyodik güncelleme satırında kısa vurgu animasyonu

### ⚙️ Ayarlar

- [ ] Tüm inputlara label + aria-describedby
- [ ] Tema/dil seçimi TAB ile gezilebilir; Kaydet altında spinner

---

## 3) Bileşen Kuralları

### Butonlar

- Birincil/ikincil hiyerarşi
- Her zaman anlamlı metin/aria-label
- Belirgin focus halkası (`ring-2 ring-blue-500`)

### Formlar

- Zorunlu alan işareti (`*`)
- Gerçek zamanlı validasyon
- Submit sırasında disabled+spinner

### Tablo & Grafik

- `thead>th[scope]` + zebra
- Grafiklerde başlık, eksen etiketleri ve birim

---

## 4) Test & Kabul Kriterleri

- [ ] **WCAG AA kontrast:** tüm metinler ≥4.5:1
- [ ] **Klavye erişimi:** tüm interaktif öğeler TAB ile ulaşılabilir
- [ ] **Form hataları:** 5/5 senaryo alan altında yakalanır (inline)
- [ ] **Yükleme P95 <3s:** skeleton gösterimi mevcut
- [ ] **Boş durum:** en az 1 örnek/sayfa

---

## 5) Kaynaklar

- [NN/g 10 Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)
- Data viz en iyi pratikler

---

## 6) Sonraki Adım

Bu planın görevleri issue/PR'lara bölünür; her PR kabul kriterlerini referans alır.
