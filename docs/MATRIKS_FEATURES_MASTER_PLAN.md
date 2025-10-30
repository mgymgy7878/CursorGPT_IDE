# Matriks IQ Özellik Entegrasyonu — Master Plan

**Tarih:** 29 Ekim 2025
**Kapsam:** 3 PR (P0 + P1 özellikleri)
**Kaynak:** [Matriks IQ Yardım — Versiyon 5.4.0](https://iqyardim.matriksdata.com/docs/non-knowledgebase/yenilikler/versiyon-5-4-0)

---

## 📋 Özet

Matriks IQ ekosisteminden Spark Trading'e aktarılacak kritik özelliklerin planı:

- **P0 (Hemen değer üretenler):** Chart Trading + Session Widget + Alert Presets + Layout Presets + PWA
- **P1 (Fark yaratan akıllı katman):** AI Kod Asistanı + Rule Builder + Portfolio Multi-Actions

**Toplam Süre:** ~18 saat (3 PR, ortalama 6 saat/PR)

---

## 🎯 PR Breakdown

### PR-6: P0 Özellikleri (Chart Trading + Session Widget + Alerts)

**Süre:** ~5 saat
**Branch:** `feat/pr6-matriks-p0-features`
**Doküman:** `PR_6_MATRIKS_FEATURES_P0.md`

**Özellikler:**
1. ✅ Chart Trading Panel — Market sayfasına tek tık emir paneli
2. ✅ Seans-içi Analiz Widget — Dashboard mini modülü (hacim, değişim, net işlemler)
3. ✅ Alert → Emir Dönüştürme + Şablonlar — Alerts sayfasına kaydet/yükle ve emre dönüştür

**Değer Artışı:**
- Emir verme süresi: 10s → 3s (70% ⬇️)
- Alert → Emir dönüşümü: 6 adım → 1 adım (85% ⬇️)
- Dashboard KPI görünürlüğü: %100

---

### PR-7: P0 Özellikleri Part 2 (Layout Presets + PWA)

**Süre:** ~4.5 saat
**Branch:** `feat/pr7-layout-pwa`
**Doküman:** `PR_7_MATRIKS_FEATURES_P0_PT2.md`

**Özellikler:**
1. ✅ Layout Presets — Operatör/Grafik/Portföy şablonları
2. ✅ PWA + Offline Detector — manifest.webmanifest + service worker + online/offline banner

**Değer Artışı:**
- Offline uptime: %100 (SW cache ile)
- Lighthouse PWA score: 100/100
- Kullanıcı deneyimi: Native app feel

---

### PR-8: P1 Özellikleri (AI Assistant + Rule Builder + Portfolio Actions)

**Süre:** ~8.5 saat
**Branch:** `feat/pr8-matriks-p1-features`
**Doküman:** `PR_8_MATRIKS_FEATURES_P1.md`

**Özellikler:**
1. ✅ AI Kod Asistanı — Strategy Lab içinde doğal dil → TypeScript çeviri (Codi benzeri)
2. ✅ Formül/Rule Builder — Sürükle-bırak kural yazımı ve backtest entegrasyonu
3. ✅ Portföy Çoklu Aksiyonlar — Toplu emir iptali, TP/SL/Trailing uygulama

**Değer Artışı:**
- Strateji yazma süresi: 30dk → 5dk (85% ⬇️)
- Kural yazma: Sürükle-bırak ile 2 dakika
- Toplu işlem: 10 emir iptali 30s → 5s (85% ⬇️)

---

## 📅 Timeline

```
Hafta 1:
  ├── PR-6 (5 saat)
  │   ├── Chart Trading (2h)
  │   ├── Session Widget (1.5h)
  │   └── Alert Presets (1.5h)
  │
  └── PR-7 (4.5 saat)
      ├── Layout Presets (2h)
      └── PWA Support (2.5h)

Hafta 2:
  └── PR-8 (8.5 saat)
      ├── AI Assistant (3h)
      ├── Rule Builder (3.5h)
      └── Portfolio Multi-Actions (2h)
```

**Toplam:** 18 saat (2 hafta içinde tamamlanabilir)

---

## 🎨 Teknik Stack

### Frontend
- **React:** Next.js 14
- **UI:** Tailwind CSS + Lucide Icons
- **State:** Zustand (persist middleware)
- **Visual Editor:** React Flow (Rule Builder için)
- **Charts:** Lightweight Charts (Chart Trading)

### Backend
- **API:** Next.js API Routes
- **SSE:** Server-Sent Events (Session Stats)
- **Storage:** Firestore/Redis (Alert Presets)
- **AI:** Claude/OpenAI API (AI Assistant)

### PWA
- **Manifest:** Web App Manifest
- **Service Worker:** Cache First + Network First strategies
- **Icons:** PWA icon generator

---

## 🧪 Quality Assurance

### Automated Tests
```bash
# Typecheck
pnpm --filter web-next typecheck

# Build
pnpm --filter web-next build

# Smoke tests (all pages)
node tools/smoke.cjs --all
```

### Manual Tests (Her PR için)
- [ ] Feature çalışıyor mu?
- [ ] UI responsive mı?
- [ ] Keyboard shortcuts çalışıyor mu?
- [ ] i18n labels doğru mu?
- [ ] API endpoints erişilebilir mi?

### Lighthouse Audit (PR-7 için)
```bash
pnpm dlx lighthouse http://localhost:3003/dashboard --view

Targets:
- PWA: 100/100
- Performance: >90
- Accessibility: >95
```

---

## 📊 Metrikler

### Operatör Hızı (P0)
| Metrik | Öncesi | Sonrası | İyileşme |
|--------|--------|---------|----------|
| Emir verme | 10s | 3s | 70% ⬇️ |
| Alert → Emir | 6 adım | 1 adım | 85% ⬇️ |
| Dashboard KPI | %60 | %100 | +40% |

### Geliştirici Deneyimi (P1)
| Metrik | Öncesi | Sonrası | İyileşme |
|--------|--------|---------|----------|
| Strateji yazma | 30dk | 5dk | 85% ⬇️ |
| Kural yazma | Manuel kod | Sürükle-bırak | - |
| Toplu işlem | 30s | 5s | 85% ⬇️ |

---

## 🔗 İlgili Dokümanlar

- **PR-6:** `docs/PR_6_MATRIKS_FEATURES_P0.md`
- **PR-7:** `docs/PR_7_MATRIKS_FEATURES_P0_PT2.md`
- **PR-8:** `docs/PR_8_MATRIKS_FEATURES_P1.md`
- **Matriks IQ Yardım:** https://iqyardim.matriksdata.com/docs/non-knowledgebase/yenilikler/versiyon-5-4-0
- **PR-5 Summary:** `PR_5_ULTRA_FINAL_SUMMARY.md`

---

## ✅ Acceptance Criteria

### PR-6
- [ ] Chart Trading: Market sayfasında floating emir paneli çalışıyor
- [ ] Session Widget: Dashboard'da SSE stream ile güncel veriler gösteriliyor
- [ ] Alert Presets: Şablon kaydet/yükle ve emre dönüştürme çalışıyor

### PR-7
- [ ] Layout Presets: 3 preset (Operatör/Grafik/Portföy) çalışıyor
- [ ] PWA: Manifest + Service Worker + Offline banner aktif
- [ ] Lighthouse: PWA score 100/100

### PR-8
- [ ] AI Assistant: Doğal dil → TypeScript çeviri çalışıyor
- [ ] Rule Builder: Sürükle-bırak kural yazımı + backtest entegrasyonu
- [ ] Portfolio Actions: Toplu işlemler ve satır-içi aksiyonlar çalışıyor

---

## 🚀 Next Steps

1. **PR-6 başlat** (Chart Trading + Session Widget + Alert Presets)
2. **PR-6 merge → PR-7 başlat** (Layout Presets + PWA)
3. **PR-7 merge → PR-8 başlat** (AI Assistant + Rule Builder + Portfolio Actions)
4. **Documentation** — Özellikleri kullanıcı dokümanlarına ekle
5. **Analytics** — Kullanım metriklerini takip et

---

**Status:** 🟢 READY TO START
**Estimated Completion:** 2 hafta
**Priority:** P0 > P1 (operatör hızı → akıllı katman)

