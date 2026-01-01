# Sprint S1 – Strategy Studio Refinement (Örnek Ada)

**Tarih:** 2025-01-15
**Durum:** 📋 Planlandı
**Epic:** Shell v2 – Risk-First UI
**Sprint:** S1

---

## 🎯 Sprint Amacı

Strategy Studio'yu tam Figma tasarımına yaklaştırmak. Bu ekran, Shell v2 için referans UI olacak.

**Hedef:** "Figma'daki risk/backtest ekranı = Strategy Studio" diyebileceğiz.

---

## 📊 Mevcut Durum

### ✅ Tamamlanan
- ✅ BacktestRunner component'i entegre edildi
- ✅ BacktestRiskPanel entegre edildi
- ✅ Grid layout: `grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6`
- ✅ Sidebar'da link mevcut

### ❌ Eksik (Figma Parity İçin)
- ❌ Başlıklar, spacing, kart başlıkları, tipografi Figma'ya göre ayarlanmalı
- ❌ Sağdaki risk panelinin header'ı / alt notları eksik
- ❌ Genel görsel hiyerarşi Figma tasarımına yaklaştırılmalı

---

## 📋 Görevler

### 1. Strategy Studio Page Layout

**Dosya:** `apps/web-next/src/app/strategy-studio/page.tsx`

**Görevler:**
- [ ] Başlık ve header düzenlemesi (Figma'ya göre)
- [ ] Spacing ve padding ayarları
- [ ] BacktestRunner + Risk Panel layout'u optimize et
- [ ] Genel görsel hiyerarşi iyileştir

### 2. BacktestRunner Component Refinement

**Dosya:** `apps/web-next/src/components/studio/BacktestRunner.tsx`

**Görevler:**
- [ ] Kart başlıkları ve tipografi Figma'ya göre
- [ ] Metrics kartlarının spacing'i optimize et
- [ ] Form alanlarının görsel hiyerarşisi
- [ ] Progress bar ve error state'leri iyileştir

### 3. BacktestRiskPanel Header & Notes

**Dosya:** `apps/web-next/src/components/backtest/BacktestRiskPanel.tsx`

**Görevler:**
- [ ] Panel header'ı ekle (Figma'ya göre)
- [ ] Alt notlar / açıklamalar ekle
- [ ] Verdict badge görsel iyileştirmeleri
- [ ] Regime ve risk score görsel hiyerarşisi

### 4. Sidebar Navigation

**Dosya:** `apps/web-next/src/components/nav/SidebarNav.tsx`

**Görevler:**
- [ ] Strategy Studio'yu belirginleştir (ikon + isim Figma'ya göre)
- [ ] İkon seçimi ve yerleşimi
- [ ] Hover state'leri ve aktif durum

---

## 🎨 Figma Referansları

### Layout
- Grid: `grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6`
- Spacing: Figma'daki padding/margin değerleri
- Typography: Başlık hiyerarşisi ve font boyutları

### Risk Panel
- Header: "Risk Beyni (Backtest)" veya Figma'daki başlık
- Alt notlar: Verdict açıklamaları
- Badge: Verdict renkleri ve stilleri

### Metrics Cards
- Kart başlıkları: Figma'daki label stilleri
- Değer gösterimi: Tipografi ve renkler
- Hover state'leri: Figma'daki interaksiyon stilleri

---

## ✅ Başarı Kriterleri

- [ ] Strategy Studio sayfası Figma tasarımıyla %90+ uyumlu
- [ ] Başlıklar, spacing, tipografi Figma'ya göre
- [ ] Risk panel header ve alt notlar mevcut
- [ ] Sidebar'da Strategy Studio belirgin şekilde görünüyor
- [ ] Geri kalan sayfalar eski haliyle çalışıyor (değişiklik yok)

---

## 📝 Notlar

- Bu sprint sadece Strategy Studio'ya odaklanır
- Geri kalan sayfalara hiç dokunulmaz (eski cockpit olduğu gibi kalır)
- Bu ekran, Shell v2 için "örnek ada" olacak
- Figma tasarımındaki her detay uygulanmak zorunda değil, genel görsel hiyerarşi önemli

---

## İlgili Dosyalar

- `apps/web-next/src/app/strategy-studio/page.tsx` - Strategy Studio sayfası
- `apps/web-next/src/components/studio/BacktestRunner.tsx` - Backtest runner
- `apps/web-next/src/components/backtest/BacktestRiskPanel.tsx` - Risk panel
- `apps/web-next/src/components/nav/SidebarNav.tsx` - Sidebar navigation
- `docs/SHELL_V2_EPIC_PLAN.md` - Epic planı
- `docs/FIGMA_LOCAL_PARITY_CHECK.md` - Parity durumu

