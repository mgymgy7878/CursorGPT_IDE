# Spark Trading Platform — UI/UX Planı ve Uygulama Talimatları

**Amaç:** Spark arayüzünde erişilebilirlik (WCAG 2.2), kullanılabilirlik (NN/g heuristics), tutarlılık ve veri görselleştirme kalitesini "tek standart" altında sabitlemek.

**North-Star:** 1366×768 fold'da kritik durum + piyasa + risk + aksiyon **net**, "boş/şüpheli ekran" yok, kullanıcı her an "sistem çalışıyor mu?" sorusuna 3 sn içinde cevap alır.

---

## 0) Kapsam ve Prensipler

### 0.1 Kapsam
- Mevcut sayfalar: **Anasayfa**, Piyasa Verileri, Çalışan Stratejiler, Stratejilerim, Strateji Lab, Portföy, Ayarlar
- Planlanan: Alerts, Market Analysis, Risk Dashboard/Intel/News

### 0.2 Ürün Prensipleri (sabit)
1. **Durum görünürlüğü:** loading/refresh/error/degraded/stale her zaman görünür.
2. **Tek aktif yüzey:** Overlay drawer açıksa yalnız o yüzey "aktif sınır"dır; handle/ESC/backdrop kuralları tek kaynaktan yönetilir.
3. **Tutarlılık:** TR terminoloji, aynı eylem aynı renk/konum/isim.
4. **Erişilebilirlik:** Klavye ile tam kullanım + fokus görünür + ARIA etiketleri.
5. **Veri dürüstlüğü:** "canlı değil/delay/stale" açık yazılır; belirsiz veriye kesinmiş gibi davranılmaz.

---

## 1) Tasarım Sistemi Kuralları

### 1.1 Butonlar
- Primary: `btn-primary` (mavi, net focus ring)
- Secondary: `btn-secondary` (gri)
- Destructive: kırmızı + **onay** (modal veya typed confirm)
- Tüm ikon-butonda `aria-label` zorunlu.

### 1.2 Formlar
- Zorunlu alan: `*`
- Inline validasyon: alan altında mesaj + `aria-describedby`
- Submit: `disabled + spinner`
- Hata dili: "ne oldu + nasıl düzelir" (kısa, alan bazlı)

### 1.3 Tablo & Liste
- Zebra pattern
- Başlık hücresi: `thead > th[scope="col"]`
- Sıralama: ikon + erişilebilir açıklama
- Güncellenen satır: kısa animasyon vurgusu (abartısız)

### 1.4 Grafikler
- Her grafikte: **başlık + eksen etiketi + birim** (veya caption)
- Tooltip: "değer + birim + zaman" net
- Renk tek başına anlam taşımasın (ikon/etiket/şekil ile destekle)

### 1.5 Kontrast ve Tipografi
- Metin kontrast hedefi: WCAG AA (normal metin için 4.5:1).
- Sayılar: tabular/mono tercih (okunabilirlik).
- 12–14px altına düşme (kritik metinlerde).

---

## 2) Etkileşim Kontratları (UI "kanun"ları)

### 2.1 Sağ Panel (Right Rail) — Dock/Overlay
- Dock açıkken: içerik layout daralır, handle görünür.
- Overlay açıkken: backdrop + ESC yalnız overlay'i kapatır.
- **Tek aktif yüzey kuralı:** Overlay görünürken "shell handle" gizlenir; DOM'da kalsa bile pointer-events kapalı olmalıdır.
- Debug: `data-handle` attribute ile handle kaynağı ayırt edilir.

### 2.2 Komutlar / Kısayollar
- Command Palette: `Ctrl+K`
- Strateji Lab: `Ctrl+Enter` backtest, `Ctrl+Shift+O` optimize (hedef)
- ESC: overlay/popup kapatır, *asla* veri kaybı yapmaz.

### 2.3 Bildirimler
- Başarılı: kısa toast
- Hata: kullanıcı aksiyonu + retry
- Degraded: sebep listesi + "Ops →" CTA

---

## 3) Yükleme, Boş Durum, Hata Durumları

### 3.1 Skeleton Standardı
- Dashboard / liste / tablo / kart: skeleton örneği zorunlu
- "Veri yok" ≠ "yükleniyor" (boş durum ayrı tasarlanır)

### 3.2 Stale / Degraded
- Stale badge: "son güncelleme: X sn önce"
- Degraded kartı: hangi bileşen (API/Feed/Executor/WS) bozuk + önerilen aksiyon

---

## 4) Sayfa Bazlı İş Listesi (Backlog)

> Öncelik: P0 (kırmızı) → P1 → P2

### 4.1 Anasayfa (/dashboard)
**P0**
- [ ] Ticker/strateji panellerinde skeleton loading
- [ ] Sol menüde aktif sayfa vurgusu + breadcrumb
- [ ] Üst çubukta WS durumu + "degraded" açıklama CTA
**P1**
- [ ] Health + Market + Risk kartlarını fold'da netleştir (4 kart düzenine evrim)
- [ ] "Son güncelleme" ve "stale" görselleştirmesi
**P2**
- [ ] Intel/News modülü (kaynak + zaman damgası)

### 4.2 Strategy Lab
**P0**
- [ ] Kaydet/Backtest spinner + başarı toast
- [ ] Kod hatalarında inline açıklama (editörle ilişkili)
- [ ] Run sonrası "son loglar & status" paneli
**P1**
- [ ] Kısayollar (Ctrl+Enter / Ctrl+Shift+O)
- [ ] Parametre diff onayı (AI üretim sonrası)
**P2**
- [ ] Template Store (30–40 hazır şablon)

### 4.3 Stratejilerim
**P0**
- [ ] Silme/Düzenleme onay diyalogları
- [ ] Liste büyüdüğünde sayfalama veya infinite scroll
**P1**
- [ ] Filtre/sıralama (durum, en son çalıştırma, PnL)
**P2**
- [ ] "Klonla / Versiyonla" akışı

### 4.4 Çalışan Stratejiler
**P0**
- [ ] Durum rozeti: running/paused/error
- [ ] Pause/Resume: ikon + metin + tooltip
**P1**
- [ ] Sparkline büyüt + tooltip
- [ ] Risk alarmı: threshold aşımlarında banner
**P2**
- [ ] Strateji bazlı mini "evidence" (son karar özeti)

### 4.5 Portföy
**P0**
- [ ] Tablo header sticky
- [ ] Zebra + kolon başlığı sıralama ikonları
**P1**
- [ ] Güncellenen satır vurgusu
- [ ] "Exposure / Drawdown" mikro kartları
**P2**
- [ ] Portföy performans grafiği (net eksen/birim)

### 4.6 Ayarlar
**P0**
- [ ] Label + aria-describedby
- [ ] Tema/dil seçimi TAB ile gezilebilir
- [ ] Kaydet: disabled + spinner
**P1**
- [ ] Validasyon senaryoları (5/5)
**P2**
- [ ] "Konfig değişti" audit kaydı görünürlüğü

### 4.7 Alerts (Planlanan)
**P0**
- [ ] "Henüz alarm yok" boş durum + CTA
- [ ] Yeni alarm formu validasyon + onay
**P1**
- [ ] Alarm listesinde snooze/disable
**P2**
- [ ] Alarm template'leri

### 4.8 Market Analysis (Planlanan)
**P0**
- [ ] Grid düzeni (fold odaklı)
- [ ] Grafiklerde başlık/açıklama/eksen etiketi zorunlu
- [ ] Tooltip'te değer + birim
**P1**
- [ ] "Neden bu sinyal?" açıklaması
**P2**
- [ ] Karşılaştırmalı senaryo (multi-asset)

---

## 5) Test ve Kabul Kriterleri (Definition of Done — UI)

### 5.1 Erişilebilirlik
- [ ] Tüm interaktif öğeler TAB ile erişilebilir
- [ ] Focus görünür (2.4.7)
- [ ] Keyboard trap yok (2.1.2)
- [ ] Aria-label / aria-describedby doğru

### 5.2 Kontrast
- [ ] Metin kontrastı AA hedefini karşılıyor (normal metin 4.5:1)
- [ ] UI bileşen sınırları/ikonlar okunur

### 5.3 Durum görünürlüğü
- [ ] Loading state: skeleton veya spinner
- [ ] Error state: açıklama + retry
- [ ] Empty state: CTA + kısa açıklama
- [ ] Stale/Degraded: sebep + çözüm yolu

### 5.4 Performans
- [ ] P95 ilk içerik <3s (skeleton ile algısal hız)
- [ ] Dashboard'da ağır chart yok; drill-down sayfasına yönlendirilir

---

## 6) Uygulama Sırası (önerilen)

**Sprint P0 (hemen):**
1) Dashboard skeleton + active nav + WS status
2) Strategy Lab: spinner/toast + inline error
3) Portföy: tablo okunabilirliği

**Sprint P1:**
- Kısayollar, sparklines, risk/health kartlarının net ayrımı

**Sprint P2:**
- Template store, Intel/News, advanced viz

---

## 7) Kaynaklar
- NN/g — 10 Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- WCAG 2.2 QuickRef: https://www.w3.org/WAI/WCAG22/quickref/
- WCAG 2.2 Standard: https://www.w3.org/TR/WCAG22/
- Tableau Visual Best Practices: https://help.tableau.com/current/pro/desktop/en-us/visual_best_practices.htm
