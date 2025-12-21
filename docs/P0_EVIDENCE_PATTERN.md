# P0 Evidence Pattern

## 🎯 Amaç

P0 sayfaları için standardize edilmiş kanıt/QA deseni. Bu pattern, Dashboard'da oturmuş ve Strategy Lab + Running Strategies için de aynı şekilde kullanılacak.

## 📁 Standart Dosya Yapısı

Her P0 sayfası için aynı dosya yapısı:

```
evidence/ui/p0/<page>/
├── README.md                    # Dev toggle + TAB order standardı
└── MANUAL_TEST_RUNBOOK.md      # Screenshot/GIF talimatları + test adımları
```

### README.md İçeriği

1. **Dev Toggle Kullanımı**
   - Query param formatı (`?state=...` veya sayfaya özel)
   - Örnek URL'ler
   - Production güvenliği notu

2. **Before/After Screenshots**
   - Loading state
   - Empty state
   - Error state
   - Sayfaya özel UI öğeleri

3. **GIF: State Akışı**
   - Loading→Empty→Error→Data akışı
   - Veya sayfaya özel interaksiyon akışı

4. **TAB Order Beklenen Sırası**
   - TopStatusBar → PageHeader → Ana içerik → Sidebar
   - Sayfaya özel sıralama
   - Shift+TAB geriye doğru döngü

5. **DoD Kontrolü**
   - Klavye erişimi
   - Kontrast
   - Loading/empty/error state'ler
   - Dev toggle

### MANUAL_TEST_RUNBOOK.md İçeriği

1. **UIStates Kit Screenshots**
   - Loading state (Skeleton)
   - Empty state (EmptyState)
   - Error state (ErrorState)
   - State akışı GIF'i

2. **Sayfaya Özel UI Öğeleri**
   - Örnek: WSStatusBadge staleness, Progress panel, State badge

3. **TAB Order Smoke Test**
   - Beklenen sıra doğrulaması
   - Shift+TAB geriye doğru döngü

4. **ESC Smoke Test**
   - Modal/dropdown ESC + focus return

5. **Contrast Spot-Check**
   - Badge metinleri
   - Focus ring
   - CTA butonları
   - Error mesajları

6. **Deliverable**
   - Screenshot listesi
   - GIF listesi
   - Test sonucu özeti formatı (3 satır)

## 📦 Required Artifacts (Her PR İçin)

### Screenshots (6 adet)
1. `after-skeleton.png` - Loading state
2. `after-empty.png` - Empty state
3. `after-error.png` - Error state
4. Sayfaya özel UI öğeleri (3 adet)
   - Örnek: WSStatusBadge 3 durum, Progress panel, State badge

### GIF (1 adet)
- `loading-flow.gif` veya sayfaya özel interaksiyon akışı (10-15 saniye)

### Test Sonucu Özeti (3 satır)
```
✅ TAB order: Tüm interaktif öğelere erişilebilir, Shift+TAB döngüsü çalışıyor
✅ ESC: Modal/dropdown ESC ile kapanıyor, focus return çalışıyor
✅ Contrast: Badge metinleri ve focus ring ≥4.5:1 (gözle kontrol edildi)
```

## 🔄 Branching Stratejisi

### One-Branch-One-PR Per Page

Her P0 sayfası için:
- **Branch**: `ui/p0-page-targets-<page-name>`
- **PR**: Tek PR, sayfaya özel
- **Base**: Önceki sayfa merge olunca main, yoksa önceki sayfa branch'i

### Örnek Akış

1. **Dashboard** (PR #36)
   - Branch: `ui/p0-page-targets-dashboard`
   - Base: `ui/p0-global-foundation` (PR #35)
   - Merge sonrası: main'e geçer

2. **Strategy Lab** (PR #XX)
   - Branch: `ui/p0-page-targets-strategy-lab`
   - Base: `main` (Dashboard merge olduktan sonra)
   - Veya: `ui/p0-page-targets-dashboard` (Dashboard henüz merge olmamışsa)

3. **Running Strategies** (PR #XX)
   - Branch: `ui/p0-page-targets-running-strategies`
   - Base: `main` (Strategy Lab merge olduktan sonra)

### Dependency Yönetimi

**PR açarken:**
- Önceki sayfa merge olmuşsa → base = `main`
- Önceki sayfa henüz merge olmamışsa → base = önceki sayfa branch'i

**PR merge sonrası:**
- Base'i `main` yap (GitHub UI'dan Change base)
- Lokal rebase:
  ```bash
  git fetch origin
  git checkout ui/p0-page-targets-<next-page>
  git rebase origin/main
  git push --force-with-lease
  ```

## 📋 Sayfaya Özel Adaptasyonlar

### Strategy Lab

**Dev Toggle:**
- `?job=backtest|optimize|idle` (örnek)

**Sayfaya Özel UI:**
- Progress panel (backtest/optimize)
- Last logs paneli
- Kısayollar (Ctrl+Enter, Ctrl+Shift+O, Esc)

**TAB Order:**
- TopStatusBar → PageHeader → Code editor → Run/Backtest/Optimize butonları → Progress panel

### Running Strategies

**Dev Toggle:**
- `?state=running|paused|error` (örnek)

**Sayfaya Özel UI:**
- State badge (running/paused/error)
- Pause/Resume butonları
- Last event time
- Sparkline tooltip

**TAB Order:**
- TopStatusBar → PageHeader → Strategy listesi → Pause/Resume butonları → State badge

## ✅ Pattern Kullanım Checklist

Her yeni P0 sayfası için:

- [ ] `evidence/ui/p0/<page>/README.md` oluştur (TAB order + dev toggle)
- [ ] `evidence/ui/p0/<page>/MANUAL_TEST_RUNBOOK.md` oluştur (test adımları)
- [ ] Dev toggle ekle (SSR-safe, production'da pasif)
- [ ] UIStates kit entegre et (Skeleton/EmptyState/ErrorState)
- [ ] Screenshot'lar al (6 adet)
- [ ] GIF kaydet (1 adet, 10-15 saniye)
- [ ] Test sonucu özeti hazırla (3 satır)
- [ ] PR yorumuna evidence ekle (drag & drop)
- [ ] PR merge sonrası: sonraki sayfa için branch aç

## 🎓 Öğrenilen Dersler

1. **TAB Order Standardı**: "Kişiye bağlı" testlerden "standardize edilmiş" testlere geçiş
2. **Dev Toggle**: GIF çekmek ve regression test için kritik
3. **Evidence Klasörü**: .gitignore'da, README'lerle yol gösterici
4. **One-Branch-One-PR**: Küçük, review'ı kolay, regresyon riski düşük
5. **Dependency Yönetimi**: Base branch stratejisi ile temiz PR akışı

---

**Son Güncelleme:** 2025-01-29
**Durum:** Dashboard'da oturdu, Strategy Lab ve Running Strategies için uygulanacak

