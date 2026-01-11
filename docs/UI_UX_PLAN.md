# Spark Trading Platform — UI/UX Planı ve Uygulama Talimatları
> Hedef: Spark'ın mevcut + planlanan sayfalarında **erişilebilir**, **tutarlı**, **ölçülebilir** ve **kanıtlanabilir** bir UI standardı kurmak.  
> Referans çerçeve: **NN/g kullanılabilirlik sezgileri** + **WCAG 2.2 (AA)** + iyi veri görselleştirme pratikleri.

---

## 0) Kapsam ve Tanımlar

### Kapsamda
- Dashboard / Ana Sayfa
- Piyasa Verileri (Liste + Workspace/Chart + Fullscreen)
- Strategy Lab (editör + çalıştırma akışı)
- Stratejilerim (liste)
- Çalışan Stratejiler (runtime kontrol)
- Portföy
- Ayarlar
- Operasyon Merkezi
- Alerts (planlanan)
- Market Analysis / Risk Dashboard (planlanan)

### Kapsam dışı (bu doküman sadece UI/UX standardı)
- Strateji motoru doğruluğu, backtest matematiği, executor üretim geçişi
- Canlı trade onayı / risk eşiği değişimi (bunlar ayrı "guardrails" prosedürü)

---

## 1) Tasarım İlkeleri (Non-negotiables)

### 1.1 Sistem Durumu Görünürlüğü (Visibility of System Status)
- Her kritik akışta kullanıcı "Şu an ne oluyor?" sorusuna 1 saniyede cevap almalı.
- Zorunlu durum yüzeyleri:
  - Üst çubuk: API / WS / Executor / Canary / ENV (var) + P95 + RT delay (varsa)
  - Sayfa içi: yükleme/skeleton, "son güncelleme", hata/yeniden dene

### 1.2 Tutarlılık (Consistency)
- Terminoloji: TR/EN karışmayacak. (Örn: "Strategy Lab" -> "Strateji Lab" veya tersine; tek karar.)
- CTA (ana eylem) yerleşimi sayfalar arası aynı mantıkta:
  - Sağ üst: ana CTA
  - İkincil CTA: ana CTA'nın yanında
  - "Tehlikeli" eylemler: onay modalı + geri alınabilirlik

### 1.3 Kullanıcı Kontrolü (User Control & Freedom)
- Pause/Resume gibi aksiyonlar:
  - açık etiket (ikon + metin)
  - geri alma / iptal rotası
  - durum rozeti (running/paused/error)

### 1.4 Hata Önleme ve Hata Mesajı Kalitesi
- Formlarda inline validasyon + alan bazlı hata.
- Hata mesajı formatı:
  - **Ne oldu?** (kısa)
  - **Neden olabilir?** (1 cümle)
  - **Ne yapabilirim?** (1 adım, "Tekrar dene", "Ayarları aç", vb.)

---

## 2) Erişilebilirlik Standardı (WCAG 2.2 AA)

### 2.1 Kontrast
- Metin kontrastı **≥ 4.5:1** (AA).
- "Sadece renk" ile anlam verme yok: kırmızı/yeşil yanında ikon/etiket şart.

### 2.2 Klavye Erişimi
- Tüm interaktif öğeler TAB ile erişilebilir.
- Focus ring görünür ve tutarlı:
  - `:focus-visible` ile belirgin halo
- Esc ile modal kapanır; Enter ana aksiyonu tetikler (uygun yerde).

### 2.3 ARIA ve Semantik
- Butonlar: `aria-label` (ikon-only ise zorunlu)
- Form alanları: `label` + `aria-describedby` (helper/error)
- Tablolar: `th scope="col"` + satır aksiyonları erişilebilir isimle.

### 2.4 Hareket / Animasyon
- Animasyonlar düşük yoğunlukta.
- "Reduce motion" tercihine saygı (varsa).

---

## 3) UI Bileşen Kuralları (Design System)

### 3.1 Butonlar
- Varyantlar:
  - Primary: ana eylem
  - Secondary: ikincil eylem
  - Ghost: toolbar / düşük öncelik
  - Destructive: sil/iptal gibi riskli
- Boyutlar:
  - sm (toolbar), md (default), lg (sayfa CTA)

### 3.2 Formlar
- Zorunlu alan `*`
- Inline validasyon: kullanıcı yazdıkça (blur + submit'te kesin)
- Submit sırasında:
  - buton disabled
  - spinner
  - tamamlanınca toast + sayfa içi "başarılı" sinyali (gerekirse)

### 3.3 Tablo & Liste
- Zebra pattern + hover highlight
- Header sticky (uzun listelerde)
- Satır aksiyonları: "…" menü veya sabit ikonlar ama erişilebilir isimle

### 3.4 Grafikler (Chart UX)
- Zorunlu: başlık + birim + tooltip'te birim
- Eksen label'ları (özellikle backtest/analiz grafikleri)
- Renk semantiği tutarlı:
  - Up/positive: yeşil
  - Down/negative: kırmızı
  - Nötr: gri/mavi
- RSI gibi osilatörlerde threshold çizgileri etiketli (30/70)

### 3.5 Loading / Empty / Error State
- Loading: skeleton (tablo satırı, kart, chart placeholder)
- Empty: açıklama + 1 net CTA (örn: "İlk alarmını oluştur")
- Error: "yeniden dene" + gerekiyorsa "logları aç" (developer mod)

---

## 4) Sayfa Bazlı Backlog (Öncelikli)

> Öncelik: P0 (kritik) / P1 (önemli) / P2 (iyileştirme)

### 4.1 Ana Sayfa / Dashboard
- P0: Skeleton loading (ticker/strateji panelleri)
- P0: Üst çubukta WS bağlantı durumu + staleness badge
- P1: Aktif menü vurgusu + breadcrumb
- P2: "Son güncelleme" mikro metni (ör. 3sn önce)

**Kabul kriteri**
- Boş beyaz/karanlık "bekleme" yok; her yüklemede skeleton görülür.
- WS kopunca 2 sn içinde görünür uyarı.

---

### 4.2 Piyasa Verileri — Liste
- P0: Arama input'u erişilebilir (label/aria)
- P0: Mini grafik seçimi (24s/7g/1ay) klavye ile kontrol
- P1: Tablo header fix + yatay scroll ergonomisi (kolonlar taşarsa)
- P2: Satır aksiyonlarına tooltip + kısayol ipucu

**Kabul kriteri**
- Tablo satır aksiyonları TAB ile erişilir.
- Kontrast AA.

---

### 4.3 Piyasa Verileri — Workspace/Chart
- P0: LIVE badge + gecikme (RT delay) görünür (varsa)
- P0: Sağ panel (TP/Entry) taşma/overflow güvenliği
- P1: Timeframe seçimi + state senkronizasyonu (URL query ile uyum)
- P2: Chart toolbars (Pro/Araçlar/Replay) ikon+metin tutarlılığı

**Kabul kriteri**
- Tam ekran / workspace geçişi state kaybetmez (symbol/tf).
- Chart alanında yatay taşma yok.

---

### 4.4 Strategy Lab
- P0: Kaydet/Backtest/Optimize işleminde spinner + durum kartı
- P0: Editör hataları inline (kodla ilişkili yerde)
- P1: Klavye kısayolları (Ctrl+Enter backtest, Ctrl+Shift+O optimize)
- P2: Son log'lar paneli + "kopyala" aksiyonu

**Kabul kriteri**
- Kullanıcı backtest başlatınca 250ms içinde "çalışıyor" state'i görür.
- Hata mesajı ilgili alanın altında görünür.

---

### 4.5 Stratejilerim (Liste)
- P0: Sil/Düzenle onay modalı
- P1: Sayfalama veya sonsuz kaydırma
- P2: Filtre/sıralama

---

### 4.6 Çalışan Stratejiler
- P0: Pause/Resume butonu ikon + metin + durum rozeti
- P1: Sparkline büyüt + tooltip
- P2: Son sinyal/son işlem mini log

---

### 4.7 Portföy
- P0: Tablo header + zebra + kolon sıralama ikonları
- P1: Güncellenen satır animasyon vurgusu (çok hafif)
- P2: Risk metrik kartları (DD, exposure, cash)

---

### 4.8 Ayarlar
- P0: Tüm alanlarda label + aria-describedby
- P0: Kaydet sırasında disabled + spinner
- P1: Tema/dil seçimi klavye ile tam kontrol
- P2: Ayar değişikliği "diff" özet satırı

---

### 4.9 Alerts (Planlanan)
- P0: Empty state + CTA ("Alarm oluştur")
- P0: Yeni alarm formu inline validasyon
- P1: Alarm listesinde durum rozetleri + enable/disable
- P2: Template kütüphanesi

---

### 4.10 Market Analysis / Risk Dashboard (Planlanan)
- P0: Grafiklerde başlık + eksen label + birim zorunlu
- P1: Dashboard grid sadeleştirme (karmaşa azalt)
- P2: "Açıklama" metinleri (kullanıcıya ne anlatıyor?)

---

## 5) Test & Kabul Kriterleri

### 5.1 Manuel Kontrol
- Klavye ile uçtan uca:
  - Menü → sayfa → form → modal → kapat
- Kontrast spot check (kritik alanlar: tablo metni, badge'ler, CTA)

### 5.2 Otomasyon (varsa)
- Playwright smoke:
  - Dashboard açılır
  - Market list render
  - Workspace chart render (mock/live)
  - Strategy Lab butonları görünür
- A11y lint (opsiyonel): aria-label eksik yakala

### 5.3 Performans
- P95 sayfa yüklenmesi < 3s hedef (yükleme sırasında skeleton şart)
- Re-render kontrol: rafBatch + memo stratejisi korunacak

---

## 6) Kanıt (Evidence) Paketi Formatı

Önerilen dizin:
- `evidence/uiux/YYYYMMDD/`
  - `a11y_tab_walk.md` (kısa not)
  - `contrast_spotcheck.md`
  - `screens/` (önemli ekran görüntüleri)

Minimum kanıt:
- 1 adet Dashboard skeleton
- 1 adet Market workspace chart
- 1 adet Strategy Lab "Backtest running" state

---

## 7) Uygulama Sırası (Öneri)

1) P0: Loading/Empty/Error state standartları (genel)
2) P0: Form inline validasyon + onay modalları
3) P1: Navigasyon (aktif menü + breadcrumb)
4) P1: Tablo standardı (zebra + sticky header)
5) P1/P2: Chart UX detayları
6) A11y + smoke kanıt paketi

---

## 8) Sonraki Adım
- README'ye aşağıdaki linki ekle:
  - `- [Docs/UI & UX Planı](docs/UI_UX_PLAN.md)`
