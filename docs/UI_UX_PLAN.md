# Spark Trading Platform — UI/UX Planı ve Uygulama Talimatları

> Bu doküman, Spark'ın dashboard + strategy lab + market data + portföy + copilot deneyimini **tek bir tasarım standardına** bağlamak için hazırlanmıştır.
> Odak: NN/g heuristics + WCAG 2.2 AA erişilebilirlik + veri görselleştirme pratikleri.

---

## 1) Tasarım İlkeleri (kısa, uygulanabilir)

### 1.1 Sistem Durumu Görünürlüğü (P0)
- **Her veri paneli**: `loading | ready | stale | error | empty` durumlarından birini göstermeli.
- **Realtime akış**: üst şeritte ve ilgili kartta "Connected / Stale / Paused" net olmalı.
- Uzun süren işlemler: *spinner + ilerleme metni + (varsa) tahmini süre*.

### 1.2 Tutarlılık (P0)
- Dil: Menü + başlıklar + butonlar **tek dil** (TR). İngilizce terimler yalnızca teknik isimlerde.
- Aksiyon hiyerarşisi: aynı eylem her sayfada aynı ad/ikon/konum.

### 1.3 Kullanıcı Kontrolü (P0)
- Kritik aksiyonlar (sil, deploy, canlı mod, risk artışı): **onay diyaloğu** + geri dönüş yolu.
- "Pause/Resume" her yerde aynı semantik.

### 1.4 Hata Önleme + Hata Mesajı Kalitesi (P0)
- Formlarda **inline validasyon** (alan altı) + üstte kısa özet.
- Hata metni: "Ne oldu / Neden / Ne yapmalıyım?" formatı.

---

## 2) Erişilebilirlik Standardı (WCAG 2.2 AA hedefi)

### 2.1 Klavye ile Tam Kullanım (P0)
- Tüm interaktif öğeler TAB ile erişilebilir.
- Focus ring görünür (özellikle dark theme).
- Modal açılınca focus modal içine "trap", kapanınca eski yere geri.

### 2.2 Kontrast ve Tipografi (P0)
- Metin/arka plan kontrastı AA seviyesinde hedeflenir.
- Sayısal metriklerde `tabular-nums` kullanılır (zıplama engeli).

### 2.3 Semantik HTML (P0)
- Tablolar: `thead > th[scope="col"]`, satır başlıkları gerekiyorsa `scope="row"`.
- Icon-only butonlar: `aria-label` zorunlu.

---

## 3) UI Bileşen Standardı (Design System Kuralları)

### 3.1 Butonlar
- Primary: tek ana eylem (örn. "Strateji Oluştur")
- Secondary: ikincil eylemler
- Destructive: kırmızı, her zaman onay ister (silme gibi)
- Disabled: hem görsel hem erişilebilir (`aria-disabled`)

### 3.2 Formlar
- Label zorunlu, `aria-describedby` ile yardım/hata metni bağlanır.
- Zorunlu alan: `*` + kısa açıklama (örn. "Risk % zorunlu").
- Submit anında: buton disable + spinner.

### 3.3 Kartlar (StatCard, PanelCard)
- Kartlar "kompakt mod" destekler:
  - Padding küçülür, metrikler taşmaz, overflow güvenli.
- Delta işareti: değer zaten `+/-` içeriyorsa tekrar eklenmez.

### 3.4 Tablo ve Liste
- 20+ satırda: zebra + hover highlight.
- Büyük listelerde: sayfalama veya sanallaştırma (virtualization) P1.

### 3.5 Grafikler
- Her grafikte: Başlık + birim + tooltip.
- Tooltip: değer + birim + (varsa) yüzde/ratio ayrımı net.

---

## 4) Sayfa Bazlı Backlog (P0/P1)

### 4.1 Ana Sayfa (Dashboard)
**P0**
- Skeleton loading (Portföy özeti, piyasa durumu, risk durumu).
- Sol menüde aktif sayfa vurgusu.
- Üst şeritte WS bağlantı durumu (Connected/Paused/Stale).
**P1**
- Kartlarda "last updated" + kısa stale nedeni.

### 4.2 Strategy Lab
**P0**
- Kaydet/Backtest için spinner + toast (başarılı/başarısız).
- Editör hataları: kod alanına yakın, anlaşılır açıklama.
- Run sonrası "son loglar" paneli.
**P1**
- Kısayollar: Ctrl+Enter Backtest, Ctrl+Shift+O Optimize.

### 4.3 Stratejilerim
**P0**
- Silme/Düzenle için onay modalı.
**P1**
- Sayfalama veya sonsuz kaydırma.

### 4.4 Çalışan Stratejiler
**P0**
- Pause/Resume net ikon + metin + durum rozeti.
**P1**
- Sparkline büyütme + tooltip.

### 4.5 Portföy
**P0**
- Tablo header fix (sticky) + zebra desen.
**P1**
- Kolon sıralama + güncellenen satır animasyon vurgusu.

### 4.6 Ayarlar
**P0**
- Label + aria-describedby + inline validasyon.
- Tema/dil seçimi TAB ile gezilebilir.
- Kaydet sırasında spinner.

### 4.7 Alerts (Planlanan)
**P0**
- "Boş durum" ekranı + CTA (Yeni alarm oluştur).
- Yeni alarm formu: doğrulama + onay.

### 4.8 Market Analysis / Market Data
**P0**
- Dashboard grid düzeni responsive (dar ekranda kırılma temiz).
- Grafiklerde başlık/açıklama/eksen etiketleri zorunlu.
**P1**
- Karmaşıklık kontrolü: aynı ekranda aşırı grafik yok.

---

## 5) Durum Modeli (UI State Contract)

Her panel/kart şu state'lerden birine bağlanmalı:

- `loading`: skeleton
- `ready`: veri render
- `stale`: veri var ama güncel değil (staleness badge + "yeniden bağlanıyor…")
- `paused`: kullanıcı pause etmiş (ikon + "Paused")
- `error`: hata mesajı + retry CTA
- `empty`: boş durum + "nasıl doldururum" açıklaması

---

## 6) Kabul Kriterleri (DoD)

**Erişilebilirlik**
- Kontrast: AA hedefi
- Klavye: tüm interaktif öğeler TAB ile erişilebilir
- Focus ring: görünür ve tutarlı

**UX**
- Form validasyonları: en az 5 hatalı senaryo yakalanır
- Her sayfada en az 1 skeleton veya empty state örneği bulunur

**Performans**
- P95 algılanan yükleme < 3s (skeleton ile)
- Büyük listelerde re-render kontrolü (memo/rafBatch)

---

## 7) QA Checklist (kopyala-yapıştır)

- [ ] Dashboard: WS Connected/Paused/Stale net görünüyor
- [ ] Dashboard: kartlarda skeleton state var
- [ ] Strategy Lab: Run sırasında spinner + toast var
- [ ] Strategy Lab: hata mesajı editöre yakın
- [ ] Stratejilerim: silme onaylı
- [ ] Çalışan Stratejiler: durum rozeti doğru (running/paused/error)
- [ ] Portföy: zebra + sticky header
- [ ] Ayarlar: label + inline validation + keyboard erişimi
- [ ] Icon-only butonlar aria-label içeriyor
- [ ] Tab ile gezince focus kaybolmuyor / görünür

---

## 8) Notlar (Uygulama Rehberi)

- CSS: dark modda scrollbar/focus/kontrast regress olmasın.
- Grid: `auto-fit/minmax` yaklaşımı dar ekranlarda 2→1 kolona düşmeli.
- StatCard: overflow güvenliği + delta sign "double sign" koruması zorunlu.

---

## 9) Kaynaklar
- NN/g Heuristics, WCAG 2.2 QuickRef, Tableau Data Viz best practices
- Spark iç dokümanları: `docs/FEATURES.md`, `docs/ROADMAP.md`
