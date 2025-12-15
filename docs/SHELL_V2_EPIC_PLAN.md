# Shell v2 – Risk-First UI Epic Plan

**Tarih:** 2025-01-15
**Durum:** 📋 Planlama Aşaması
**Epic:** Shell v2 – Risk-First UI

---

## 🎯 Epic Amacı

Figma'daki yeni "Risk Brain + Backtest Studio" tasarımını global shell'e uygulamak. Şu anda risk beyni kodda var ama UI sadece Strategy Studio'da küçük bir adada uygulanmış durumda.

---

## 📊 Mevcut Durum

### ✅ Tamamlanan (Risk Brain Kod Katmanı)

- ✅ Risk Architecture Baseline v1
- ✅ Copilot Risk Brain v1 (deterministic policy)
- ✅ LLM Enrichment
- ✅ Guardrails + Aksiyon Yüzeyi v1
- ✅ Backtest Risk Filter v1
- ✅ BacktestRiskPanel UI component
- ✅ Strategy Studio / BacktestRunner layout (Figma parity)

### ❌ Eksik (Global Shell)

- ❌ Ana shell (Sidebar, TopStatusBar) eski v1 tasarımı
- ❌ Dashboard, Market, Portfolio sayfaları eski cockpit
- ❌ RightRail eski "Top Riskler + Copilot ile Tartış" bloğu
- ❌ Strategy Lab / Strategies / Running eski akış

**Figma'daki yeni tasarım:**
- Daha sade "Risk RightRail"
- Strategy/Backtest için ayrı bir "studio" hissi
- Top bar + stat strip risk pipeline ile uyumlu

---

## 🚀 Sprint Planı

### Sprint S1 – "Strategy Studio = Figma Adası" (Örnek Ada)

**Hedef:** Figma'daki risk/backtest tasarımı tek bir route'ta tertemiz dursun. Bu ekran, Shell v2 için referans UI olacak.

**Görevler:**
1. `apps/web-next/src/app/strategy-studio/page.tsx`
   - İçeriğini Figma'daki Backtest ekranına göre netleştirme
   - BacktestRunner + Risk Panel + küçük header
   - Başlıklar, spacing, kart başlıkları, tipografi Figma'ya göre
   - Sağdaki risk panelinin header'ı / alt notları
2. `SidebarNav.tsx`
   - Strategy Studio'yu solda ayrı bir item olarak belirginleştirme
   - İkon + isim Figma'ya göre
3. Geri kalan sayfalara hiç dokunmama (eski cockpit olduğu gibi kalsın)

**Çıktı:** "Figma'daki risk/backtest ekranı = Strategy Studio" diyebileceğiz. Bu ekran, Shell v2 için referans UI olacak.

**Durum:** ✅ Kısmen tamamlandı (BacktestRunner + BacktestRiskPanel entegre edildi, detaylar eksik)

**Pratik Plan:**
- Başlıklar, spacing, kart başlıkları, tipografi Figma'ya göre ayarlanmalı
- Sağdaki risk panelinin header'ı / alt notları eklenmeli
- Bu ekran, Shell v2 için "örnek ada" olacak

---

### Sprint S2 – "RightRail Risk Console v1" (Küçük Ama Etkili)

**Hedef:** Dashboard / Market / Portfolio sağ tarafındaki "Top Riskler + Copilot ile Tartış" bloğunu Figma'daki Risk RightRail ile hizalamak.

**Görevler:**
1. Ortak bir `RightRailRiskConsole` component'i çıkar
   - Rejim, riskScore, top 3 risk
   - "Bu sayfada Copilot ne der?" satırı
2. Dashboard, market, portfolio sayfalarında sağdaki paneli bu component'e bağla
   - Şimdilik eski cockpit'in sağ bloğunu değiştirmen bile kâfi
   - Plug-in gibi takılabilir olmalı
3. İçeriği: `RightRailSummaryDto` + `CopilotRiskAdviceDto` çıktıları ile aynı dilden konuşsun
4. Risk beynini bütün shell'e yayar; ama layout'u tamamen söküp takmayız

**Çıktı:** Risk beyni tüm sayfalarda görünür, ama global layout'a dokunulmaz.

**Durum:** 📋 Planlandı

**Pratik Plan:**
- Tek bir component: `RightRailRiskConsole`
- Dashboard, Market, Portfolio, Strategies sayfalarına plug-in gibi tak
- Şimdilik eski cockpit'in sağ bloğunu değiştirmen bile kâfi

---

### Sprint S3 – "Shell v2 – Ana Çerçeve" (Büyük Refactor'ü Parçalara Böl)

**Hedef:** Sidebar + TopStatusBar + içerik container'ını Figma'daki global shell'e yaklaştırmak.

**Görevler (Parçalara Bölünmüş):**

**3.1 Layout İskeleti:**
1. `LayoutShell` / `AppShell` component'i çıkarma
2. Yeni sidebar genişliği, yeni topbar yüksekliği
3. Content container max-width, padding, grid yapısı

**3.2 Sayfa Bazlı Migrasyon:**
4. Her sayfayı sırayla migrate:
   - v1 kartlarını, v2 kart komponentlerine taşı
   - Eski CSS/Tailwind sınıflarını temizle
5. Sidebar item'ları (isim, ikon, sıra) → Figma'ya göre reset
6. TopStatusBar → Figma'daki P95 / risk summary / environment band'ine göre yeniden çizim
7. RightRail → "Risk Brain / Guardrails / Telemetry" özetine göre yeniden kurgulama

**Çıktı:** Global shell Figma tasarımıyla uyumlu.

**Durum:** 📋 Planlandı

**Pratik Plan:**
- Önce layout iskeleti (sidebar genişliği, topbar yüksekliği, content container)
- Sonra her sayfayı sırayla migrate (v1 kartlarını v2'ye taşı, eski CSS'i temizle)
- Büyük refactor'ü parçalara böl, tek seferde yapma

---

## 📋 Teknik Detaylar

### Figma'daki Yeni Tasarım Özellikleri

1. **Daha Sade Risk RightRail**
   - Eski: "Top Riskler + Copilot ile Tartış" bloğu
   - Yeni: Risk Brain / Guardrails / Telemetry özeti

2. **Strategy/Backtest Studio Hissi**
   - Ayrı bir "studio" alanı
   - BacktestRunner + Risk Panel odaklı

3. **Top Bar + Stat Strip**
   - Risk pipeline ile uyumlu
   - P95 / risk summary / environment band

### Mevcut Shell Yapısı (v1 Legacy)

- Full trading dashboard (P&L, executions, alerts, portfolio vs.)
- RightRail'de eski "Top Riskler + Copilot ile Tartış" bloğu
- Strategy Lab / Strategies / Running eski akış

---

## 🎯 Başarı Kriterleri

### Sprint S1
- [ ] Strategy Studio route'u Figma tasarımıyla %100 uyumlu
- [ ] Sidebar'da Strategy Studio belirgin şekilde görünüyor
- [ ] Geri kalan sayfalar eski haliyle çalışıyor

### Sprint S2
- [ ] RightRailRiskConsole component'i oluşturuldu
- [ ] Dashboard, market, portfolio sayfalarında risk console görünüyor
- [ ] Risk beyni tüm sayfalarda erişilebilir

### Sprint S3
- [ ] Global shell Figma tasarımıyla uyumlu
- [ ] Sidebar, TopStatusBar, RightRail yeniden tasarlandı
- [ ] Tüm sayfalar yeni shell ile uyumlu

---

## 📝 Notlar

- **Risk Beyni:** Kod katmanında hazır, sadece UI entegrasyonu gerekiyor
- **Backtest Filtresi:** Kod + UI hazır (Strategy Studio'da)
- **Global Shell:** Eski v1 tasarımı, yeni tasarıma geçiş gerekiyor
- **Refactor Kapsamı:** Büyük, ama adım adım yapılabilir

---

## 🎯 Pratik İlerleme Stratejisi

### Mevcut Durum
- **Risk beyni & backtest:** Modern (v1 mimari + UI adası hazır)
- **Shell:** Legacy (v1, planı çizilmiş ama uygulanmamış)

### Mimari Faz Farkı
Bu bir bug değil, mimari faz farkı:
- Risk beyni & backtest: v1 mimari + UI adası hazır ✅
- Shell: henüz v1, planı çizilmiş ama uygulanmamış 📋

### İlerleme Yaklaşımı
"Cursor'da çok düzenleme" işini ısırık ısırık yemek için:

1. **Adım 1 – Strategy Studio'yu bitirip "örnek ada" yapmak**
   - Orayı tam Figma'ya yaklaştır
   - Bu ekran, Shell v2 için referans UI olacak

2. **Adım 2 – RightRail Risk Console v1 (küçük ama etkili)**
   - Tek bir component: `RightRailRiskConsole`
   - Dashboard, Market, Portfolio sayfalarına plug-in gibi tak
   - Şimdilik eski cockpit'in sağ bloğunu değiştirmen bile kâfi

3. **Adım 3 – Shell v2 (büyük refactor'ü parçalara böl)**
   - Önce layout iskeleti (sidebar, topbar, content container)
   - Sonra her sayfayı sırayla migrate
   - Büyük refactor'ü parçalara böl, tek seferde yapma

**Sonuç:** Bundan sonrası tamamen "kas ve prosedür" sprint'i. Hangi ekrandan başlamak istediğine göre Cursor için PATCH planı çıkarılabilir, shell parça parça Figma'ya taşınır.

---

## İlgili Dosyalar

- `docs/FIGMA_LOCAL_PARITY_CHECK.md` - Parity durumu
- `docs/LOCAL_DEV_SETUP.md` - Dev server setup
- `docs/BACKTEST_RISK_FILTER_V1.md` - Backtest risk filter
- `docs/COPILOT_RISK_BRAIN_V1.md` - Risk brain
- `apps/web-next/src/app/strategy-studio/page.tsx` - Strategy Studio sayfası
- `apps/web-next/src/components/studio/BacktestRunner.tsx` - Backtest runner
- `apps/web-next/src/components/backtest/BacktestRiskPanel.tsx` - Risk panel

