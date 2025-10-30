# Spark Trading Platform — UI/UX İyileştirme Planı

**Amaç:** Spark'ta tüm sayfalar için NN/g + WCAG 2.2 AA uyumlu, performans ve erişilebilirlik odaklı bir standart tesis etmek. (Heuristics, klavye erişimi, kontrast ≥4.5:1, skeleton & boş durumlar, veri görselleştirme prensipleri.)

## 1) Standartlar
- **NN/g 10 Heuristic:** Sistem durumu görünürlüğü, gerçek dünya ile eşleşme, kullanıcı kontrolü/özgürlüğü, hata önleme vb. (kaynak: NN/g).
- **WCAG 2.2 AA:** Klavye ile erişilebilirlik; **Kontrast (1.4.3) min. 4.5:1**; büyük metin 3:1; bileşen/ikon **3:1**; odak görünürlüğü; hedef boyutu vb.
- **Playwright Best Practices:** Prod-benzeri `webServer` üstünde E2E; iz sürümü `trace` yalnızca retry'da; paralel/karşıt tarayıcı matrisi.
- **Veri Görselleştirme:** Başlık, eksen etiketleri, birim; sadeleşmiş renk kullanımı; anlamlı tooltip'ler.

## 2) Sayfa Bazlı İş Listesi (D1–D3 sonrası)
### 🏠 Ana Sayfa
- [ ] Ticker/strateji panellerinde **skeleton loading**
- [ ] Sol menüde **aktif sayfa vurgusu** + (ops.) breadcrumb
- [ ] WS bağlantı durumu rozeti (üst çubuk)

### 🧪 Strategy Lab
- [ ] Kaydet/Backtest sırasında **spinner + toast** (aria-live="polite")
- [ ] Kod editör hatalarında **inline açıklama** (field altında)
- [ ] **Kısayollar:** Ctrl+Enter → backtest, Ctrl+Shift+O → optimize
- [ ] Son log'lar & durum paneli

### 📋 Stratejilerim
- [ ] Sayfalama veya sonsuz kaydırma; boş durum metinleri
- [ ] Sil/Düzenle için **onay diyaloğu** (Esc ile kapanır)

### 🏃‍♂️ Çalışan Stratejiler
- [ ] Sparkline daha büyük + **tooltip**; durum rozetleri (running/paused/error)
- [ ] Pause/Resume butonlarında ikon + metin

### 💼 Portföy
- [ ] Tablo başlıkları **fix**; **zebra** desen; sıralama ikonları
- [ ] Periyodik güncellemelerde satır **hafif highlight**

### ⚙️ Ayarlar
- [ ] Her alanda **label + aria-describedby**; zorunlu alanlar `*`
- [ ] Tema/dil seçimi **TAB ile gezilebilir**; kaydette spinner

### 🔔 Alerts (Planlı)
- [ ] "Henüz bir alarmınız yok" boş durum + CTA; form doğrulama

### 📊 Market Analysis (Planlı)
- [ ] Grid düzeni; grafiklerde **başlık/açıklama/eksen** zorunlu; tooltip'te değer + birim

## 3) Bileşen Kuralları
- **Buton:** Birincil/ikincil hiyerarşi; odak halkası; `aria-label` zorunlu (ikonikse).
- **Formlar:** Inline validasyon; hatada alan altı mesaj; submit'te `disabled + spinner`.
- **Tablolar:** `<thead><th scope>`; zebra; dar ekranda yatay kaydırma izni.
- **Grafikler:** Başlık + eksen; anlamlı renk; **tooltip ile bağlam**.
- **Odak & Klavye:** Tüm etkileşimli öğeler TAB/Shift+TAB ile ulaşılabilir; `Enter/Space` davranışı tutarlı.

## 4) Erişilebilirlik ve Kontrast
- Metin/arka plan **≥4.5:1**; büyük metin **≥3:1**; UI bileşenleri **≥3:1**.
- Odak durumları görünür; klavye tuzakları yok (modallar `Esc` ile kapanır, `focus-trap`).

## 5) Test & Kabul Kriterleri
- **WCAG AA:** Kontrast, klavye erişimi ve odak görünürlüğü otomatik + manuel geçer.
- **Form Validasyon:** 5/5 hatalı senaryo yakalanır; hata mesajı alan altında.
- **Yükleme Deneyimi:** P95 <3s; içerik yüklenirken skeleton gösterimi.
- **E2E:** Prod-benzeri `webServer` üstünde; tarayıcı matrisi (Chromium/Firefox/WebKit); trace **on-first-retry**.

## 6) Uygulama Notları (CI/E2E)
- Playwright config: `webServer` prod build'i başlatır (örn. `pnpm --filter web-next start -p 3003`).
- `trace: 'on-first-retry'`; paralel ve matrix ile hızlandırma; artifact'ler (screenshot/video/trace) **sadece fail** durumunda saklanır.

## 7) Kaynaklar
- NN/g — 10 Usability Heuristics
- W3C — WCAG 2.2; Kontrast (1.4.3/1.4.11)
- WebAIM / Deque — Kontrast kontrol ve eşikler
- Playwright — Best Practices & WebServer
- Tableau — Visual Best Practices

---

## Ek: Hızlı Kontrol Listesi
- [ ] Aktif sayfa vurgusu + breadcrumb
- [ ] Skeleton/boş durum metinleri
- [ ] Klavye ile tüm eylemler yapılabiliyor
- [ ] Kontrast kontrolleri (≥4.5:1)
- [ ] Tooltip'lerde değer + birim
- [ ] Form inline validasyon + spinner
