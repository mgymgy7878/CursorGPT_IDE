# Spark Trading Platform — UI/UX Talimatları ve Geliştirme Planı

**Versiyon:** 1.1
**Tarih:** 26.11.2025
**Kapsam:** `apps/web-next`, `apps/web-next-v2`, `apps/desktop-electron` ana yüzeyleri

Bu doküman, Spark Trading Platform için **tasarım prensipleri**, **bileşen kuralları**, **sayfa bazlı checklist** ve **8 haftalık UI/UX roadmap** sağlar.
Temel kaynaklar: detaylı UX heuristics & erişilebilirlik analizi, proje evrimi raporu ve küresel platform kıyaslaması.

---

## 0. Hedefler

1. **Tutarlı arayüz:** Tüm sayfalarda aynı layout, aynı komponent dili, aynı terminoloji.

2. **Risk / trading bağlamına uygun UI:** "Grafik + metrik + aksiyon" üçlüsü net olsun; kullanıcı ne olduğunu tek bakışta anlasın.

3. **Erişilebilirlik ve hız:** WCAG 2.2 AA, klavye ile tam gezinim, yükleme/boş durumlarda belirsizlik olmaması.

4. **Canary-first düşünce:** UI değişiklikleri ölçülebilir metriklerle (Lighthouse, a11y, task completion) desteklenecek.

---

## 1. Temel Tasarım İlkeleri

### 1.1 Dil ve terminoloji

- Uygulama **ya tam TR ya tam EN modunda** çalışır; karışık "Strategy Lab / Çalışan Stratejiler" kullanılmaz.

- Menü, sayfa başlıkları ve butonlar **TR i18n key** üzerinden gelir (`messages/tr/*.json`).

- **Dil seçimi:** Kullanıcı dil tercihi `/settings > Genel` sekmesinden veya environment flag (`NEXT_PUBLIC_LOCALE`) ile yapılır. Uygulama başlangıcında sistem dili veya localStorage'dan okunur.

- Teknik terimlerde kural:
  - `Strategy`, `Portfolio`, `Backtest` → TR'de "Strateji", "Portföy", "Geritest" kullanılacak.

  - Kısa metinlerde açıklayıcı tooltip ile desteklenir.

### 1.2 Layout (Figma Golden Master Referansı)

**Temel İskelet:**

- Varsayılan iskelet: **Sidebar (sol) + StatusBar (üst) + Content (orta) + CopilotDock (sağ)**
- 1366×768 target çözünürlük (scroll-free dashboard, dense layout)

**Figma Golden Master Ölçümleri:**

- **Sidebar genişliği:** `260-280px` (mevcut: `clamp(190px, 13vw, 220px)` → güncellenecek)
- **StatusBar yüksekliği:** `44px` (mevcut: `44px` ✅)
- **Top header bar yüksekliği:** `56-64px` (Figma'da görünen, StatusBar'dan ayrı)
- **CopilotDock genişlik:** `320-380px` (mevcut: `clamp(320px, 28vw, 380px)` ✅)

**Scroll Stratejisi (Figma Golden Master Prensibi):**

- **Sayfa scroll:** ❌ YOK (tüm sayfalarda)
- **İç scroll:** ✅ VAR (sadece liste/tablo/kart içeriklerinde)
- Dashboard: ✅ Tamamlandı (`[data-dashboard-root="1"]` ile `overflow: clip`)
- Diğer sayfalar: ⚠️ PageShell `.page-center` içinde scroll var → kapatılacak

**CopilotDock:**

- Masaüstünde sağda sabit; tablet/mobilde alt panel veya tam ekran sheet.
- Bağımsız scroll: Copilot paneli kendi içinde scroll eder, sayfa scroll etmez.

### 1.3 Spacing ve grid (Figma Golden Master)

**Temel Spacing:**

- Temel spacing: **4'ün katları** (`4/8/12/16/24/32`).

**Global Content Padding (Figma Golden Master):**

- **Dashboard:** Padding yok (kartlar grid içinde, gap ile ayrılmış)
- **Diğer sayfalar (PageShell):** `px-6 py-3` → **24px yatay, 12px dikey** (mevcut: `clamp(16px, 2vh, 24px)` → güncellenecek)

**Kart Spacing:**

- **Kart iç padding:** Minimum `16px` (Figma'dan exact değer kontrol edilecek)
- **Kart gap:** `12px` (mevcut: `--gap: 12px` ✅)
- **Kartlar arası boşluk:** Minimum `16px` (yatay/dikey)

**Tablo Spacing:**

- Tablo satır yüksekliği: Minimum `40px`
- Tablo iç padding: `12px` (header ve cell)

### 1.4 Renk ve kontrast

- Metin/arkaplan kontrastı **WCAG 2.2 AA (en az 4.5:1)** sağlayacak.

- Pozitif / negatif / uyarı renkleri:
  - Pozitif: `status.success`

  - Negatif: `status.danger`

  - Uyarı: `status.warning`

- Renk, **anlamı destekler**, tek başına taşımaz:
  - "Kırmızı = zarar" yanında ikon veya metin de olmalı.

### 1.5 Tipografi (Figma Golden Master)

**Font Family:**

- Font: Sistem sans-serif (ör. `system`, `-apple-system`, `SF Pro`, `Inter`).

**Font Scale (Figma Golden Master):**

- **H1 (Sayfa başlığı):** `24-28px` (mevcut: `clamp(20px, 4vw, 28px)` ✅)
- **H2 (Bölüm başlığı):** `18-24px` (mevcut: `clamp(18px, 3.5vw, 24px)` ✅)
- **Body (Ana metin):** `14-16px` (minimum: `14px`, tercihen `15-16px`)
- **Caption (Küçük metin):** `12-14px`
- **Label (Form etiketleri):** `12-14px`

**Sayısal Alanlar:**

- `.tabular-nums` (monospace sayılar) kullanılmalı.
- Fiyat, miktar, P&L: sağa hizalı.
- Font weight: Sayısal değerler için `font-semibold` veya `font-bold` (Figma'dan kontrol edilecek)

### 1.6 Durum ve geri bildirim

- **Yükleme:** Her kritik ekranda en az bir **skeleton** veya spinner:
  - Dashboard, Strategy Lab, Portfolio, Market, Backtest.

- **Boş durum:** "Hiç strateji yok" / "Portföy boş" gibi durumlarda açıklayıcı boş durum kartları.

- **Hata:** Hata mesajı:
  - Kullanıcı dostu, teknik jargon minimum.

  - Hata alanına yakın (form alanı altında, kart içinde).

- **İşlem sonrası:** "Kaydet" / "Backtest çalıştır" gibi aksiyonlarda:
  - Buton üzerinde spinner

  - Sonuç için toast + inline bilgi (örneğin "Backtest #123 tamamlandı").

### 1.7 Erişilebilirlik (a11y)

- WCAG 2.2 AA hedeflenir:
  - Tüm interaktif elemanlar **TAB ile erişilebilir**.

  - `aria-label`, `aria-describedby` ve `role` alanları kritik kontrollerde doldurulmalı.

- Klavye kısayolları:
  - Komut paleti: `Ctrl+K` / `⌘K`

  - Copilot panel aç/kapa: `Ctrl+Shift+C`

  - **Kısayol görünürlüğü:** Tüm klavye kısayolları en az bir yerde UI'da görünür olmalıdır:
    - Tooltip'lerde (örn. buton hover'da "Ctrl+K ile aç")
    - Settings altında "Klavye Kısayolları" cheatsheet sayfası
    - Command palette açıldığında kısayol listesi gösterimi

- Odak halkası gizlenmez; özel stil verilebilir ama görünür olmalı.

---

## 2. Bileşen Bazlı Talimatlar

### 2.1 App Shell / Sidebar / Topbar / StatusBar

**SidebarNav**

- Aktif sayfa her zaman bariz:
  - Kalın yazı + ikon rengi + sol tarafta accent çizgi.

- Grup başlıkları (örn. "Trading", "Sistem") küçük ve gri tonlarda.

- Hover durumu: arka plan hafif aydınlık/dark varyant.

**Topbar**

- Solda: Sayfa başlığı.

- Ortada opsiyonel **context** (seçili sembol, zaman aralığı).

- Sağda: Kullanıcı menüsü, **tema toggle** (dark/light), WS durumu, bildirimler.
  - **Tema toggle konumu:** Topbar sağ tarafında, kullanıcı menüsünün solunda yer alır. StatusBar'da değil, Topbar'da bulunur.

**StatusBar**

- Solda: AU durumu, build versiyonu.

- Ortada: WS/Executor/Crash durumu kısa etiketlerle.

- Sağda: Son uyarı veya mini log linki.

### 2.2 Card komponentleri

- Card'larda standart yapı:
  - Üstte başlık + kısa açıklama.

  - Ortada metrik/grafik/özet tablo.

  - Altta opsiyonel aksiyon butonları.

- Card başlığı maks. 1 satır, alt açıklama 2 satırla sınırlı.

### 2.3 Tablo ve liste

- Tablolarda:
  - Header satırı sabit (sticky) ve arka planı farklı.

  - Zebra pattern (opsiyonel) veya satır hover rengi.

- Kolonlar:
  - Sembol, strateji adı: sola hizalı.

  - Fiyat, P&L, hacim: sağa hizalı.

- Filtre/sıralama:
  - En azından "duruma göre" veya "tarihe göre" sıralama butonu.

### 2.4 Formlar (Ayarlar, Strategy Lab, Backtest)

- Her input için **visible label** zorunlu.

- Zorunlu alanlar `*` veya "Zorunlu" ibaresi ile gösterilir.

- Inline validasyon:
  - Hatalı alanda kırmızı çerçeve + kısa mesaj.

- Submit:
  - Tek belirgin primer buton ("Kaydet", "Backtest Çalıştır").

  - İşlem sürerken disabled + loading.

### 2.5 Modal / Dialog

- Modal sadece **kritik onay** ve **detay form** için kullanılır.

- Başlık net: "Stratejiyi Sil" / "Yeni Strateji".

- İki buton:
  - Primer: "Onayla"

  - Secondary: "İptal"

- ESC / dış tıklamayla kapatma davranışı: kritik işlemlerde kapatma onayı istenebilir.

### 2.6 Chart'lar

- Her grafikte:
  - Başlık

  - X/Y eksen etiketleri (zaman, fiyat, P&L vb.)

- Renk kodlama:
  - Long/pozitif: yeşil.

  - Short/negatif: kırmızı.

- Legend:
  - Birden fazla seri varsa açıklayıcı legend zorunlu.

---

## 3. Sayfa Bazlı Checklist

Aşağıdaki listeler **P0 (kritik)**, **P1 (önemli)**, **P2 (polish)** olarak işaretlenmiştir.

### 3.1 `/dashboard`

**Amaç:** Canlı sistem sağlığını, aktif strateji özetini, alarm durumunu tek bakışta göstermek.

- P0
  - [ ] İlk yüklemede skeleton: aktif strateji kartları, risk kartı, WS/Executor durum kartı.
  - [ ] Sidebar'da Dashboard aktif highlight.
  - [ ] En az 3 ana widget: "Aktif Stratejiler", "Risk/Günlük P&L", "Sistem Sağlığı".
  - [ ] Boş durum: hiç strateji yoksa açıklayıcı kart.

- P1
  - [ ] Grafikli minik P&L sparkline'lar, açıklayıcı tooltip'ler.
  - [ ] Son uyarı/incident kartı.

- P2
  - [ ] Hafif animasyon (widget giriş transition).
  - [ ] Kullanıcıya özel "son yaptığın işlemler" minik liste.

### 3.2 `/strategy-lab`

**Amaç:** Strateji fikir → kod → backtest → optimize → deploy akışını tek ekranda yönetmek.

- P0
  - [ ] Copilot chat + code editor + parametre formu **aynı görünürlükte**.
  - [ ] "Generate", "Backtest", "Optimize", "Deploy" butonları net ayrılmış.
  - [ ] Uzun süren işlemlerde (öz. backtest) loading state + progress bilgisi.
  - [ ] Hata mesajı hem toast hem panel içinde (ör. backtest log özeti).

- P1
  - [ ] Wizard akışı: "Hedef → Piyasa → Risk → Zaman dilimi" sorularıyla otomatik prompt üretimi.
  - [ ] Son backtest sonuçları tablosu + equity curve kartı.
  - [ ] **Command Palette entegrasyonu:** Command palette'den (`Ctrl+K`) strateji aç/kapat, Strategy Lab'e atla, sembol bağla gibi aksiyonlar trigger edilebilir. Copilot ile birlikte kullanıldığında, komutlar Copilot context'ine otomatik aktarılır.

- P2
  - [ ] Farklı strateji taslakları için tab'ler (Draft 1, Draft 2…).
  - [ ] "Mutasyon" butonu: AI'ın varyant stratejiler önermesi.

### 3.3 `/strategies`

**Amaç:** Tüm stratejilerin durumunu yönetmek (draft/active/paused/deprecated).

- P0
  - [ ] Durum sütunu: renkli pill (Draft, Aktif, Durduruldu).
  - [ ] Filtreleme: durum ve piyasa bazlı.
  - [ ] Silme/durdurma işlemleri için onay dialog'u.

- P1
  - [ ] Arama (isim, etiket).
  - [ ] Satır tıklaması ile sağda "StrategyDetailPanel" açılması.

- P2
  - [ ] Mini performans özeti (son 7 gün P&L).

### 3.4 `/running`

**Amaç:** Şu anda çalışan stratejilerin gerçek zamanlı izlenmesi.

- P0
  - [ ] Canlı P&L, açık pozisyon sayısı, kullanılan risk yüzdesi.
  - [ ] "Durdur" ve "Duraklat" butonları, birbirinden net ayrılmış.
  - [ ] "Acil Stop" (kill switch) butonu sadece yetkili kullanıcıda görünür.

- P1
  - [ ] Strateji başına mini sparkline + tooltip (son X dakika performansı).

- P2
  - [ ] "Market regime" etiketi (trend/range/high-vol vb.) Supervisor ajan beslenecek şekilde placeholder.

### 3.5 `/portfolio`

**Amaç:** Çoklu piyasalardaki varlıkları ve risk dağılımını göstermek.

- P0
  - [ ] Tabloda kontrast ve hizalama kuralları uygulanmış.
  - [ ] "Toplam risk yüzdesi" ve "Günlük P&L" özet kartları.
  - [ ] Veri yenilemede skeleton veya subtle loading bar.

- P1
  - [ ] Dilim grafik (allocation donut).
  - [ ] Farklı hesap / borsa filtreleri.

- P2
  - [ ] "Ne olursa" senaryoları için link/CTA (ileride backtest/what-if entegrasyonu).

### 3.6 `/market` ve `/technical-analysis`

- P0
  - [ ] Seçili sembol + zaman dilimi barı belirgin.
  - [ ] Her grafikte axis label, legend, fiyat tick boyutu okunur.

- P1
  - [ ] Çoklu sembol karşılaştırma (overlay veya grid).

- P2
  - [ ] Kullanıcıya özel layout (chart + orderbook + times&sales kombinasyonu).

### 3.7 `/settings`, `/alerts`, `/guardrails`, `/observability`

- P0
  - [ ] Ayarlar formu: kategori bazlı sekmeler (Genel, Risk, Bildirim, API).
  - [ ] Guardrails için sade editable liste (limitler, eşikler).
  - [ ] Observability: en az 3 metrik (P95 latency, error rate, WS staleness).

- P1
  - [ ] Alerts: "yeni alarm" wizard'ı (koşul, eşik, kanal).

- P2
  - [ ] Observability sayfasında mini Grafana embed veya özet kartları.

---

## 4. 8 Haftalık UI/UX Roadmap

Bu roadmap, mevcut analizde tarif edilen 8 haftalık planla uyumludur.

### Hafta 1–2 — Temel İyileştirmeler (P0 Aşaması)

**Hedef:** Yükleme, boş durum, hata durumlarını güvenli hale getirmek.

- [ ] Dashboard, Strategy Lab, Portfolio, Market, Backtest için skeleton state'ler.
- [ ] Formlarda inline validasyon ve net hata mesajları.
- [ ] Tüm sayfalarda aktif menü highlight'ı.
- [ ] Temel WCAG kontrolleri (kontrast, TAB navigasyonu, odak halkaları).

**Kabul kriteri:**

- Hiçbir sayfada "boş beyaz ekran" yok; her durumda kullanıcıya durum gösteriliyor.

### Hafta 3–4 — Animasyonlar ve Etkileşim

**Hedef:** Framer Motion ile hafif, anlamlı animasyonlar; micro-interaction.

- [ ] Sayfa geçiş animasyonları (fade/slide; abartısız).
- [ ] Kart ve buton hover/click feedback.
- [ ] Modalların giriş/çıkış animasyonları.
- [ ] Toast bildirimleri için giriş/çıkış hareketi.

**Kabul kriteri:**

- Kullanıcı aksiyonlarında "tık yok mu?" hissi kalmıyor, ama göz yormayan animasyonlar.

### Hafta 5–6 — Tema ve Erişilebilirlik Derinleştirme

**Hedef:** Dark/Light tema tam, WCAG 2.2 AA audit.

- [ ] Light theme implementasyonu + tema toggle.
- [ ] Sistem temasına göre başlangıç modu (prefers-color-scheme).
- [ ] WCAG 2.2 AA checklist üzerinden manuel ve otomatik tarama.
- [ ] Ekran okuyucu testleri (NVDA / VoiceOver kısa smoke).

**Kabul kriteri:**

- Lighthouse Accessibility ≥ 90
- Otomatik kontrast testlerinden %100 geçiş.

### Hafta 7–8 — Gelişmiş Özellikler (Command Palette vs.)

**Hedef:** Güç kullanıcıları için verimlilik, daha derin görselleştirme.

- [ ] Command palette geliştirmeleri (strateji aç/kapat, Strategy Lab'e atla, sembol bağla, WS test vb.).
  - Command palette'den yapılan aksiyonlar Copilot context'ine otomatik aktarılır; Copilot ile birlikte kullanıldığında entegre çalışır.
- [ ] Klavye kısayolları dokümante ve UI'da gösterim (tooltip/cheatsheet).
- [ ] Data export (CSV/PDF) ve "print-friendly" görünümler.
- [ ] Gelişmiş grafikler (equity curve detay, drawdown, heatmap).

**Kabul kriteri:**

- Temel trading akışları (strateji oluştur/backtest/çalıştır) sadece klavye ile tamamlanabilir.

---

## 5. Ölçülebilir KPI ve Kabul Kriterleri

- **Lighthouse (UI):**
  - Performance ≥ 80
  - Accessibility ≥ 90
  - Best Practices ≥ 90

- **Kullanılabilirlik (SUS / iç test):**
  - Hedef: ≥ 80/100.

- **Görev tamamlama:**
  - "Yeni strateji oluştur ve backtest et" senaryosunda ilk denemede başarı oranı ≥ %90.

- **Hata oranı:**
  - Form gönderim hata oranı (Validation fail) ≤ %10 (inline validasyon sonrası).

- **Erişilebilirlik:**
  - WCAG 2.2 AA otomatik testlerinde kritik ihlal sayısı: 0.

---

## 6. Uygulama Notları

- UI değişiklikleri için PR'larda:
  - [ ] En az bir ekran görüntüsü veya kısa gif.
  - [ ] Hangi sayfa checklist maddesini kapattığı belirtilmeli.
  - [ ] Eğer a11y etkisi varsa kısa not (fokus, rol, aria eklemesi).

- Yeni komponent eklerken:
  - Önce **mevcut** komponentler incelenir (`/components`).
  - Aynı işi yapan iki farklı komponent oluşturulmaz; gerekirse mevcut olan genişletilir.

Bu doküman, Spark için **tek referans UI/UX kılavuzu** olarak kullanılmalı; roadmap ilerledikçe versiyonlanarak güncellenmelidir.

---

## 7. Figma Golden Master Hizalama - Sayfa Bazlı TODO Listesi

**Hedef:** Tüm sayfaları Figma Golden Master tasarımına göre hizalamak.

**Prensip:** "Sayfa scroll yok, iç scroll var" - Dashboard pattern'ini tüm sayfalara uygula.

### 7.1 Global Değişiklikler (Tüm Sayfalar İçin)

#### A) PageShell Scroll Stratejisi Patch

**Dosya:** `apps/web-next/src/components/layout/PageShell.tsx` ve `apps/web-next/src/app/globals.css`

**Değişiklik:**

- PageShell `.page-center` içindeki `overflow-y: auto` kaldırılacak
- Sayfa scroll engellenecek (Dashboard pattern'i gibi)
- İçerik scroll'u sadece liste/tablo/kart içeriklerinde olacak

**CSS Patch Önerisi:**

```css
/* PageShell: Sayfa scroll kapat, iç scroll aç */
.page-shell {
  overflow: clip; /* Sayfa scroll yok */
  height: calc(100dvh - var(--app-topbar) - var(--top-gap));
}

.page-center {
  overflow: visible; /* Sayfa scroll yok */
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* İçerik scroll sadece liste/tablo/kart içinde */
.page-center > [data-scroll-container] {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
```

#### B) Sidebar Genişlik Güncelleme

**Dosya:** `apps/web-next/src/app/globals.css`

**Değişiklik:**

- `--sidebar: clamp(190px, 13vw, 220px)` → `clamp(260px, 18vw, 280px)`

#### C) Global Content Padding Güncelleme

**Dosya:** `apps/web-next/src/app/globals.css`

**Değişiklik:**

- PageShell `.page-center` padding: `clamp(16px, 2vh, 24px)` → `24px` (yatay), `12px` (dikey)
- CSS: `padding: 12px 24px;` (Figma: `px-6 py-3`)

---

### 7.2 Sayfa Bazlı TODO Listesi

#### `/dashboard` - ✅ Tamamlandı (Referans)

**Durum:** Figma Golden Master'a uygun

- ✅ Page scroll kapalı (`[data-dashboard-root="1"]` ile)
- ✅ İç scroll sadece kart içeriklerinde
- ⚠️ Sidebar genişlik güncellenecek (260-280px)

**TODO:**

- [ ] Sidebar genişlik: `clamp(190px, 13vw, 220px)` → `clamp(260px, 18vw, 280px)`

---

#### `/market-data` - 🔴 Yüksek Öncelik

**Component:** `apps/web-next/src/app/market-data/page.tsx`

**Durum:** Minimal placeholder içerik, PageShell kullanıyor

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] İçerik geliştirildikçe scroll container ekle (liste/tablo için)
- [ ] Figma'dan exact spacing/gap değerlerini uygula

---

#### `/strategy-lab` - 🔴 Yüksek Öncelik

**Component:** `apps/web-next/src/app/strategy-lab/page.tsx`

**Durum:** PageShell kullanıyor, tab içerikleri uzun olabilir

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] Tab içeriklerini scroll container'a al (`data-scroll-container`)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] Tab button spacing/gap: Figma'dan exact değer
- [ ] Code editor ve form alanları için scroll container

---

#### `/strategies` - 🔴 Yüksek Öncelik

**Component:** `apps/web-next/src/app/strategies/page.tsx`

**Durum:** PageShell kullanıyor, StrategyList uzun liste olabilir

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] StrategyList'i scroll container'a al (`data-scroll-container`)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] StrategyCard gap: Figma'dan exact değer (muhtemelen `16px`)
- [ ] StrategyDetailPanel: Modal veya sağ panel scroll container

---

#### `/running` - 🔴 Yüksek Öncelik

**Component:** `apps/web-next/src/app/running/page.tsx`

**Durum:** PageShell kullanıyor, grid kartlar

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] Grid container'ı scroll container'a al (`data-scroll-container`)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] Grid gap: Figma'dan exact değer (muhtemelen `16px`)
- [ ] Running strategy kartları: min-height ve scroll container

---

#### `/portfolio` - 🔴 Yüksek Öncelik

**Component:** `apps/web-next/src/app/portfolio/page.tsx`

**Durum:** PageShell kullanıyor, OptimisticPositionsTable uzun olabilir

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] OptimisticPositionsTable'ı scroll container'a al (`data-scroll-container`)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] PortfolioCard gap: Figma'dan exact değer
- [ ] ExchangeStatus ve LivePnL kartları: spacing/gap

---

#### `/alerts` - 🟡 Orta Öncelik

**Component:** `apps/web-next/src/app/alerts/page.tsx`

**Durum:** PageShell kullanıyor, tablo uzun olabilir

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] Alerts tablosunu scroll container'a al (`data-scroll-container`)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] Tablo satır yüksekliği: Minimum `40px` (Figma'dan kontrol)
- [ ] AlertsControl spacing: Figma'dan exact değer

---

#### `/audit` - 🟡 Orta Öncelik

**Component:** `apps/web-next/src/app/audit/page.tsx`

**Durum:** PageShell kullanıyor, AuditTable uzun olabilir

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] AuditTable'ı scroll container'a al (`data-scroll-container`)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] AuditFilters spacing: Figma'dan exact değer
- [ ] Tablo satır yüksekliği: Minimum `40px` (Figma'dan kontrol)

---

#### `/guardrails` - 🟢 Düşük Öncelik

**Component:** `apps/web-next/src/app/guardrails/page.tsx`

**Durum:** PageShell kullanıyor, empty state + template CTAs

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] Template CTA kartları: gap ve padding (Figma'dan exact değer)
- [ ] Empty state spacing: Figma'dan exact değer

---

#### `/settings` - 🟢 Düşük Öncelik

**Component:** `apps/web-next/src/app/settings/page.tsx`

**Durum:** PageShell kullanıyor, form içerikleri

**TODO:**

- [ ] PageShell scroll stratejisi uygula (sayfa scroll kapat)
- [ ] Form container'ı scroll container'a al (`data-scroll-container`)
- [ ] Content padding: `24px` (yatay), `12px` (dikey)
- [ ] Tabs spacing: Figma'dan exact değer
- [ ] ApiForm spacing: Figma'dan exact değer

---

### 7.3 Figma Golden Master Ölçüm Gereksinimleri

**Figma'dan alınması gereken exact değerler:**

1. **Sidebar genişlik:** px cinsinden (muhtemelen 260-280px)
2. **Copilot panel genişlik:** px cinsinden (muhtemelen 320-380px)
3. **Content padding:** `px-6 py-3` → exact px (muhtemelen 24px yatay, 12px dikey)
4. **Kart gap:** Kartlar arası boşluk (px)
5. **Kart padding:** Kart içi padding (px)
6. **Font boyutları:** h1, h2, body, caption (px)
7. **Renk kodları:** Hex değerleri (arka plan, metin, border)
8. **Border radius:** Kart köşe yuvarlaklığı (px)
9. **Icon boyutları:** Menü ikonları, buton ikonları (px)
10. **Tablo satır yüksekliği:** Minimum değer (px)

---

### 7.4 Health Check Listesi (Test Senaryoları)

**Global Patch + Pilot Sayfalar Test Checklist:**

#### Genel (PageShell)

- [ ] Herhangi bir PageShell sayfasında fareyi body üzerinde kaydırınca sayfa komple kaymamalı
- [ ] Scroll sadece `data-scroll-container` içindeyken çalışmalı
- [ ] Sidebar genişliği: yaklaşık 260–280px arasında, dashboard ve diğer sayfalarda tutarlı
- [ ] Copilot paneli sayfa ile birlikte sabit yükseklikte kalıyor

#### /portfolio Özel

- [ ] Üst kartlar (ExchangeStatus, LivePnL vs.) hiç kıpırdamıyor
- [ ] Sadece "Açık Pozisyonlar" alanı scroll ediyor
- [ ] Açık pozisyonlar tablosunda çok satır olduğunda scroll bar görünüyor
- [ ] Card yapısı: `CardHeader` + `CardTitle` + `CardContent` hiyerarşisi bozulmadan render oluyor
- [ ] Mobil / dar genişlikte grid tek kolona düşerken scroll davranışı aynı kalıyor

#### /running Özel

- [ ] Üstteki filtre/özet bar'ı hep görünür
- [ ] Sadece kart grid'i kayıyor
- [ ] Card sayısı azsa scroll çubuğu çıkmasa bile layout bozulmamalı
- [ ] Empty state'te de scroll container içi düzgün ortalanmış görünmeli

#### Overlay / Modallar

- [ ] Komut paleti (`Ctrl+K`) tam ekranın içinde kalıyor mu?
- [ ] Büyük modal'lar (Strategy delete, API key vs.) altta kaybolan kısım var mı?
- [ ] Dropdown menüler tam ekranın içinde kalıyor mu?

**Not:** Eğer bir modal yüksekliği `100vh`'ye yakınsa, gerektiğinde o component'e lokal `overflow-y-auto` ekleyerek çözülebilir.

---

### 7.5 Sonraki Adımlar: Kalan Sayfalara Scroll Pattern'i Yaymak

**Pattern Özeti:**

1. `PageShell` içindeki en dış wrapper: `flex flex-col h-full gap-4`
2. Üst blok(lar) → sabit alan (filtreler, özetler, header'lar)
3. Alt ana içerik → `data-scroll-container className="flex-1 min-h-0"`
4. İçeride uzun liste/tablo → `overflow-y-auto` ile kendi içinde scroll

**Kalan Sayfalar (Sırayla):**

1. `/strategy-lab` - Tab içerikleri scroll container'a alınacak
2. `/strategies` - StrategyList scroll container'a alınacak
3. `/alerts` - Alerts tablosu scroll container'a alınacak
4. `/audit` - AuditTable scroll container'a alınacak
5. `/settings` - Form container scroll container'a alınacak
6. `/guardrails` - Template CTAs scroll container'a alınacak (gerekirse)

**Her Sayfa İçin Standart Yapı:**

```tsx
return (
  <PageShell>
    <div className="flex flex-col gap-4 h-full">
      {/* ÜST SABİT BLOK */}
      <div>
        <PageHeader ... />
        {/* Filtreler, özetler, kontroller */}
      </div>

      {/* ALT SCROLL BLOK */}
      <div data-scroll-container className="flex-1 min-h-0">
        {/* Uzun içerik: liste, tablo, form */}
      </div>
    </div>
  </PageShell>
);
```

---

### 7.6 Figma İnce Ayar Sprinti (Sonraki Faz)

Scroll işi oturduktan sonra yapılacaklar:

**Kart Spacing Standardizasyonu:**

- [ ] Figma'dan kart padding net px değerlerini çek
- [ ] Card'ların `p-4 / p-5` benzeri spacing'lerini standardize et
- [ ] Kart gap değerlerini Figma'dan al ve uygula
- [ ] Border radius değerlerini standardize et

**Font Scale Hizalama:**

- [ ] H1/H2/body font boyutlarını Figma'dakiyle birebir eşitle
- [ ] Font weight'leri (regular, medium, semibold, bold) kontrol et
- [ ] Line height değerlerini Figma'dan al

**Renk Token Mapping:**

- [ ] Arka plan renkleri (bg, bg-2, bg-3) Figma'dan al
- [ ] Border renkleri (border, border-strong, border-muted) kontrol et
- [ ] Accent renkleri (primary, success, error, warning) eşitle
- [ ] Tailwind theme'e map et

**Icon Boyutları:**

- [ ] Menü ikonları boyutunu standardize et
- [ ] Buton ikonları boyutunu kontrol et
- [ ] Status badge ikonları boyutunu eşitle

---

## 8. UI Geliştirme İşlem Hattı (Pipeline)

### 8.1 Standart 3 Adımlı Süreç

Her UI ticket'i için aşağıdaki 3 adım standardı uygulanır:

#### Adım 1: Kod Patch'i

- Gerekli dosyalarda değişiklikler yapılır
- Linter hataları kontrol edilir
- TypeScript tip hataları düzeltilir

#### Adım 2: Dev Server Başlatma

```bash
cd apps/web-next
pnpm dev
```

- Server `http://localhost:3003` adresinde çalışır
- Hot reload aktif olmalı

#### Adım 3: Cursor İçinden Görsel Kontrol

- Cursor browser tool'u ile `http://localhost:3003/[route]` sayfaları açılır
- Aşağıdaki checklist hızlıca geçilir:

**UI Checklist:**

- [ ] **Sidebar genişliği:** 260-280px bandında mı?
- [ ] **Üst sabit blok:** Header/filters/tabs sabit kalıyor mu?
- [ ] **data-scroll-container:** İçerik scroll ediyor mu, sayfa scroll yok mu?
- [ ] **Copilot dock konumu:** Sağda sabit yükseklikte mi?
- [ ] **Layout yapısı:** `flex flex-col h-full gap-4` pattern'i uygulanmış mı?

### 8.2 Empty State Yanılgısı

**Önemli Not:** Çoğu sayfa şu an boş/az içerikli; scroll görünmemesi normaldir.

**Uzun içerik testi için:**

- `/strategies` için fake 30+ strateji
- `/portfolio` için 30+ pozisyon
- `/alerts` / `/audit` için 50+ satırlık seed data

Gerekirse faker seed patch'i eklenebilir.

### 8.3 Yeni Çalışma Protokolü

#### ChatGPT → Cursor İletişim Formatı

**ChatGPT tarafı:**

```
PATCH (kod ve stil)
NOTES (hangi sayfa, hangi figma maddesi kapandı)
SMOKE TEST (hangi route'lar açılıp nasıl kontrol edilecek)
```

**Cursor tarafı:**

1. Kod değişikliklerini uygula
2. `pnpm dev` ile server'ı başlat
3. `http://localhost:3003/...` sayfalarını aç
4. Tek bir **FINAL SUMMARY** ile hem test hem görsel gözlemi raporla

### 8.4 PR Açıklaması Template (Zorunlu)

**Her UI ticket'i PR açıklamasında şu mini blokla gelmelidir:**

```markdown
## UI PIPELINE

- [x] PATCH uygulandı (dosyalar: `apps/web-next/src/app/...`, `globals.css`, vb.)
- [x] pnpm dev (apps/web-next, port 3003)
- [x] Cursor Browser Tool ile kontrol: - `/portfolio` - Sidebar ✅, Scroll container ✅, Copilot dock ✅ - `/running` - Sidebar ✅, Scroll container ✅, Copilot dock ✅ - (diğer ilgili route'lar)
- [ ] Extra notlar (a11y, spacing, regressions)
```

**Kural:** Bu pipeline'dan geçmeyen hiçbir UI değişikliği "tamam" sayılmamalı.

### 8.5 Figma Golden Master ↔ Canlı UI Döngüsü

**Operational Pipeline:**

```
Figma Golden Master
    ↓
Kod Patch (globals.css + sayfa component'leri)
    ↓
pnpm dev (localhost:3003)
    ↓
Cursor Browser Tool (görsel kontrol)
    ↓
FINAL SUMMARY (test + görsel gözlem raporu)
    ↓
İteratif düzeltme (gerekirse)
```

**Sonuç:** Artık Spark'ın UI'ını sadece koda bakarak değil, Cursor içinden gerçek uygulamayı görerek iteratif düzeltebiliyoruz. "Figma Golden Master ↔ canlı UI" döngüsü resmen operational.

### 8.6 Dev-Only Fake Data Epic

**Amaç:** Scroll davranışını gerçekten test etmek için uzun içerik simülasyonu.

**Yapı:**

- Klasör: `apps/web-next/src/dev-seed/*.ts`
- Ortak flag: `NEXT_PUBLIC_DEV_SEED=1`
- Pattern: `getDevStrategies(seedEnabled: boolean, real: Strategy[])`

**Sayfalar:**

- `/strategies` → 30–40 fake strateji
- `/portfolio` → 30–40 pozisyon
- `/alerts` → 50+ alert
- `/audit` → 50+ audit kaydı

**Pattern Örneği:**

```typescript
export function getDevStrategies(seedEnabled: boolean, real: Strategy[]) {
  if (!seedEnabled) return real;
  return [...real, ...fakeStrategies(30)];
}
```

**Faydalar:**

- Scroll davranışını gerçekten görebiliriz
- "Empty state, scroll yok" ile "uzun liste, iç scroll" farkı net olacak
- UI testleri daha gerçekçi olacak

**Not:** Seed data sadece development ortamında (`NEXT_PUBLIC_DEV_SEED=1`) aktif olmalı.

**Detaylı dokümantasyon:** `docs/DEV_SEED_DATA_EPIC.md`

---

## 9. Değişiklik Geçmişi (Changelog)

### v1.2 (2025-01-20) – PageShell Scroll & Figma Golden Master

- **Figma Golden Master Hizalama:** Global layout kuralları eklendi (sidebar, copilot, topbar, padding, gap, font, renk)
- **Scroll Stratejisi:** "Sayfa scroll yok, iç scroll var" prensibi tüm sayfalara uygulandı
  - Global patch: `globals.css` + `PageShell.tsx`
  - Pilot sayfalar: `/portfolio`, `/running`
  - Kalan sayfalar: `/strategy-lab`, `/strategies`, `/alerts`, `/audit`, `/settings`, `/guardrails`
- **Sayfa Bazlı TODO Listesi:** Her sayfa için Figma hizalaması görevleri eklendi
- **PageShell Scroll Patch:** Sayfa scroll kapatma stratejisi dokümante edildi
- **UI Geliştirme İşlem Hattı:** 3 adımlı pipeline standardı eklendi (Kod → pnpm dev → Cursor Browser Tool)
- **PR Template:** UI PIPELINE checklist bloğu zorunlu hale getirildi

### v1.3 (Planlanan) – Figma Spacing/Font/Renk İnce Ayarı

- **Kart Spacing Standardizasyonu:** Figma'dan kart padding/gap/border radius değerleri
- **Font Scale Hizalama:** H1/H2/body font boyutları Figma'dakiyle birebir eşitlenecek
- **Renk Token Mapping:** Arka plan, border, accent renkleri Figma + Tailwind theme'e map edilecek
- **Icon Boyutları:** Menü, buton, status badge ikonları standardize edilecek
- **Dev-Only Fake Data:** Seed data sistemi eklenecek (scroll testi için)

### v1.1 (26.11.2025)

- **Dil seçimi:** `/settings > Genel` sekmesinden veya `NEXT_PUBLIC_LOCALE` environment flag'i ile yapılacağı netleştirildi
- **Tema toggle konumu:** Topbar sağ tarafında, kullanıcı menüsünün solunda sabitlendi (StatusBar'da değil)
- **Klavye kısayolları görünürlüğü:** Tüm kısayolların UI'da görünür olması kuralı eklendi (tooltip, cheatsheet, command palette)
- **Command Palette + Copilot entegrasyonu:** Strategy Lab ve roadmap'e Command Palette ile Copilot ilişkisi eklendi

### v1.0 (26.11.2025)

- İlk sürüm: Tasarım prensipleri, bileşen kuralları, sayfa checklist'leri ve 8 haftalık roadmap
