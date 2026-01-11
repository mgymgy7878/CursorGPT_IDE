# Figma → Local UI Parity Check

**Tarih:** 2025-01-15
**Durum:** ✅ Kontrol Edildi

---

## 🎯 Özet

**⚠️ ÖNEMLİ: Parity Durumu Sınırlı**

**Figma → Local UI parity** yalnızca şu alanlar için hedeflenmiş durumda:

1. **Strategy Studio / BacktestRunner ana layout'u**
   - Route: `/strategy-studio`
   - URL: `http://localhost:3003/strategy-studio`
   - Layout: Sol metrics, sağ risk panel
   - Grid: `grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6`
   - ✅ BacktestRiskPanel entegre edildi

2. **BacktestRiskPanel bloğu**
   - Verdict, regime, risk score gösterimi
   - API entegrasyonu: `/api/backtest/risk-evaluate`

**❌ Global Shell (v1 Legacy):**
- Ana shell (Sidebar, TopStatusBar, Dashboard kartları, Top Riskler kutusu vs.) hâlâ v1 legacy cockpit
- `/dashboard`, `/market`, `/strategy-lab`, `/strategies`, `/running`, `/portfolio`, `/alerts`, `/audit`, `/guardrails`, `/settings` → Bunların hepsi eski v1 tasarımı
- Figma'daki yeni risk UI tasarımı global shell için referans, ama henüz uygulanmış değil

**Sonuç:** Risk beyni + backtest filtresi kodda var, ama Figma'daki UI sadece küçük bir adada (Strategy Studio) uygulanmış durumda.

---

## 🔴 Local Link Sorunları

### Sorun 1: Port Uyuşmazlığı

**Belirti:** Figma'daki "Open in browser" link'i tıklandığında sayfa açılmıyor

**Kök Sebep:**
- Dev server: `http://localhost:3003` ✅
- Figma link: `http://localhost:3000/...` ❌
- Sonuç: Port çakışması → sayfa açılmaz

**Çözüm:**
Figma dosyasındaki TÜM local link'leri `3000` → `3003` olarak güncelle:

```
❌ http://localhost:3000/strategy-studio
✅ http://localhost:3003/strategy-studio
```

### Sorun 2: Yanlış Route

**Belirti:** Link açılıyor ama Figma'daki tasarımla uyuşmuyor

**Kök Sebep:**
Figma link'i yanlış route'a işaret ediyor:
- ❌ `/backtest` → `/strategy-lab?tab=backtest`'e redirect (eski)
- ❌ `/backtest-lab` → Farklı arayüz (uyuşmaz)
- ❌ `/strategy-lab` → BacktestRunner içermez
- ✅ `/strategy-studio` → BacktestRunner + BacktestRiskPanel (DOĞRU)

**Çözüm:**
Figma link'ini `/strategy-studio` olarak güncelle

---

## ✅ Doğru Route: `/strategy-studio`

### Layout Yapısı

```
┌─────────────────────────────────────────────────┐
│  Backtest Runner                                │
│  [Form: Symbol, Timeframe, Start, End, Run]   │
│  [Progress Bar]                                  │
│                                                  │
│  Backtest Sonuçları                             │
│  ┌──────────────────┬──────────────────────┐  │
│  │ Sol: Metrics     │ Sağ: Risk Panel      │  │
│  │ ┌───┬───┬───┬──┐ │ ┌──────────────────┐ │  │
│  │ │WR │TR │SR │DD│ │ │ Risk Beyni       │ │  │
│  │ └───┴───┴───┴──┘ │ │ [VERDICT BADGE]  │ │  │
│  │                  │ │ Regime: X (Y/100)│ │  │
│  │                  │ │ Reasons...       │ │  │
│  │                  │ └──────────────────┘ │  │
│  └──────────────────┴──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Grid Yapısı

- **Desktop:** `lg:grid-cols-[2fr,1fr]` → Sol 2/3, sağ 1/3
- **Mobile:** `grid-cols-1` → Tek sütun, üst üste
- **Gap:** `gap-6` (24px)

### Metrics Kartları

- **Grid:** `grid-cols-2 md:grid-cols-4 gap-3`
- **Padding:** `p-3` (12px)
- **Hover:** `hover:bg-neutral-800/70 transition-colors`
- **Text:** `text-xs` label, `text-xl` value

### Risk Panel

- **Bileşen:** `BacktestRiskPanel`
- **Props:** `candidate`, `metrics`
- **Görünürlük:** Sadece `report` ve `metrics` dolu olduğunda
- **İçerik:** Verdict badge, regime, risk score, reasons

---

## 📋 Route Karşılaştırması

| Route | BacktestRunner | BacktestRiskPanel | Figma Tasarımı |
|-------|----------------|-------------------|----------------|
| `/strategy-studio` | ✅ | ✅ | ✅ **DOĞRU** |
| `/backtest` | ❌ | ❌ | ❌ Redirect |
| `/backtest-lab` | ❌ | ❌ | ❌ Farklı arayüz |
| `/strategy-lab` | ❌ | ❌ | ❌ BacktestRunner yok |
| `/backtest-engine` | ❌ | ❌ | ❌ Engine yönetimi |

---

## 🔍 Parity Kontrol Checklist

### Port Kontrolü
- [ ] Dev server `3003` portunda çalışıyor mu?
- [ ] Figma link'leri `3003` portunu kullanıyor mu?

### Route Kontrolü
- [ ] Figma link'i `/strategy-studio` route'una işaret ediyor mu?
- [ ] Sidebar'da `/strategy-studio` linki var mı?

### Layout Kontrolü
- [ ] Grid: `grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6` ✅
- [ ] Sol: Metrics kartları (Win Rate, Total Return, Sharpe, Max DD) ✅
- [ ] Sağ: BacktestRiskPanel ✅
- [ ] Spacing: `p-3`, `gap-6`, `space-y-4` ✅

### BacktestRiskPanel Kontrolü
- [ ] Panel sadece report/metrics varken görünüyor mu?
- [ ] Verdict badge görünüyor mu?
- [ ] Regime + risk score görünüyor mu?
- [ ] Reasons satırı görünüyor mu?

---

## 🛠️ Sorun Giderme

### Sayfa Açılmıyor

1. **Port kontrolü:**
   ```bash
   # Dev server çalışıyor mu?
   curl http://localhost:3003/api/healthz
   ```

2. **Figma link kontrolü:**
   - Link `3000` portunu kullanıyorsa → `3003`'e güncelle
   - Link yanlış route'a işaret ediyorsa → `/strategy-studio` olarak güncelle

### Sayfa Açılıyor Ama Tasarım Uyuşmuyor

1. **Route kontrolü:**
   - Doğru route: `/strategy-studio`
   - Yanlış route'lar: `/backtest`, `/backtest-lab`, `/strategy-lab`

2. **Browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) veya `Cmd+Shift+R` (Mac)
   - Dev server'ı yeniden başlat

3. **Layout kontrolü:**
   - DevTools'da grid yapısını kontrol et
   - `lg:grid-cols-[2fr,1fr]` olmalı (desktop'ta)

### Risk Panel Görünmüyor

1. **Backtest çalıştırıldı mı?**
   - Panel sadece backtest sonuçları geldiğinde görünür
   - Backtest çalıştırılmadan önce görünmez (beklenen davranış)

2. **API kontrolü:**
   ```bash
   # Risk evaluation API çalışıyor mu?
   curl -X POST http://localhost:3003/api/backtest/risk-evaluate \
     -H "Content-Type: application/json" \
     -d '{"candidate": {...}, "metrics": {...}}'
   ```

---

## 📝 Figma Güncelleme Notları

Figma dosyasındaki local link'leri güncellerken:

1. **Port:** Tüm link'lerde `3000` → `3003`
2. **Route:** Backtest ekranı için `/strategy-studio` kullan
3. **Örnek link'ler:**
   - ✅ `http://localhost:3003/strategy-studio` (Backtest)
   - ✅ `http://localhost:3003/dashboard` (Dashboard)
   - ✅ `http://localhost:3003/portfolio` (Portfolio)

---

## İlgili Dosyalar

- `docs/LOCAL_DEV_SETUP.md` - Dev server setup
- `apps/web-next/src/app/strategy-studio/page.tsx` - Strategy Studio sayfası
- `apps/web-next/src/components/studio/BacktestRunner.tsx` - Backtest runner
- `apps/web-next/src/components/backtest/BacktestRiskPanel.tsx` - Risk panel
- `apps/web-next/src/components/nav/SidebarNav.tsx` - Sidebar navigation

---

## Sonuç

**Parity Durumu: ⚠️ KISMI (Sadece Strategy Studio)**

### ✅ Tamamlanan
- ✅ Strategy Studio / BacktestRunner layout parity sağlandı
- ✅ BacktestRiskPanel entegre edildi
- ✅ Sidebar'da link mevcut
- ✅ Risk beyni kod tarafı hazır

### ❌ Eksik (Global Shell)
- ❌ Ana shell (Sidebar, TopStatusBar) eski v1 tasarımı
- ❌ Dashboard, Market, Portfolio sayfaları eski cockpit
- ❌ RightRail eski "Top Riskler + Copilot ile Tartış" bloğu
- ❌ Strategy Lab / Strategies / Running eski akış

**Figma Güncelleme Gereksinimleri:**
- ⚠️ Figma local link'leri `3003` portuna güncellenmeli
- ⚠️ Figma link'leri `/strategy-studio` route'una işaret etmeli

**Doğru URL (Strategy Studio için):**
```
http://localhost:3003/strategy-studio
```

**Not:**
- Strategy Studio için "enson figmadaki görünüm localde yok" durumu çözülmüştür.
- Global shell için yeni bir Epic gerekiyor: "Shell v2 – Risk-First UI" (bkz: `docs/SHELL_V2_EPIC_PLAN.md`)

**İlerleme Planı:**
- Sprint S1: Strategy Studio = Figma adası ✅ (kısmen tamamlandı)
- Sprint S2: RightRail Risk Console v1 📋 (planlandı)
- Sprint S3: Shell v2 – Ana çerçeve 📋 (planlandı)

