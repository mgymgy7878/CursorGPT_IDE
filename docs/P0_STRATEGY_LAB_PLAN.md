# Strategy Lab P0-Page Targets Plan

## 🎯 Amaç

Strategy Lab sayfası için P0-Page Targets uygulaması. P0 Evidence Pattern kullanılarak Dashboard ile aynı ritimde ilerleyecek.

## 🚧 Blocking Dependencies

**Önce tamamlanması gerekenler:**
- [ ] PR #35 merge (ui/p0-global-foundation)
- [ ] PR #36 base→main + rebase + evidence attach + merge (Dashboard)

**Sonrası:**
- Strategy Lab branch açılacak: `ui/p0-page-targets-strategy-lab`
- Base: `main` (Dashboard merge olduktan sonra)

## 📋 P0 Scope

### 1. Progress Panel + Last Logs

**Hedefler:**
- [ ] Backtest/Optimize çalışırken progress bar gösterimi
- [ ] Son log satırları paneli (son 10 satır)
- [ ] Status paneli (running/completed/error)

**UIStates Kit Kullanımı:**
- `Skeleton` → Progress panel yüklenirken
- `ErrorState` → Backtest/Optimize hatası durumunda

### 2. Inline Error Explanation Panel

**Hedefler:**
- [ ] Kod editör hataları için inline açıklama paneli
- [ ] Hata → öneri gösterimi
- [ ] Monaco editor hata satırında vurgulama

**UIStates Kit Kullanımı:**
- `ErrorState` → Kod hatası durumunda (inline panel)

### 3. Shortcuts (Kısayollar)

**Hedefler:**
- [ ] `Ctrl+Enter`: Backtest
- [ ] `Ctrl+Shift+O`: Optimize
- [ ] `Esc`: Modal/Panel kapat

**DoD:**
- [ ] Kısayollar çalışıyor
- [ ] Kısayollar dokümante edilmiş (tooltip veya help panel)

### 4. Toast Bildirimleri

**Hedefler:**
- [ ] Kaydet/Backtest/Optimize için toast (başarılı/uyarı/hata)
- [ ] Toast pozisyonu tutarlı (sağ üst veya alt)

## 🔧 Dev Toggle

**Format:** `?job=idle|backtest|optimize`

**SSR-Safe Implementation:**
```tsx
type DevJob = 'idle' | 'backtest' | 'optimize';

function resolveDevJob(searchParams?: { job?: string }): DevJob | null {
  if (process.env.NODE_ENV === 'production') return null;
  const job = searchParams?.job;
  if (job === 'idle' || job === 'backtest' || job === 'optimize') {
    return job;
  }
  return null;
}
```

**Kullanım:**
- `?job=idle` → Normal durum
- `?job=backtest` → Backtest çalışıyor (progress panel aktif)
- `?job=optimize` → Optimize çalışıyor (progress panel aktif)

## 📁 Evidence Dosya Yapısı

P0 Evidence Pattern'e göre:

```
evidence/ui/p0/strategy-lab/
├── README.md                    # Dev toggle + TAB order standardı
└── MANUAL_TEST_RUNBOOK.md      # Screenshot/GIF talimatları
```

### README.md İçeriği

1. **Dev Toggle Kullanımı**
   - `?job=idle|backtest|optimize`
   - Production güvenliği notu

2. **TAB Order Beklenen Sırası**
   - TopStatusBar → PageHeader → Code editor → Run/Backtest/Optimize butonları → Progress panel → Last logs

3. **Sayfaya Özel UI**
   - Progress panel (backtest/optimize)
   - Last logs paneli
   - Inline error explanation panel
   - Kısayollar (Ctrl+Enter, Ctrl+Shift+O, Esc)

### MANUAL_TEST_RUNBOOK.md İçeriği

1. **UIStates Kit Screenshots**
   - Loading state (Skeleton)
   - Empty state (EmptyState)
   - Error state (ErrorState + inline panel)

2. **Progress Panel Screenshots**
   - Backtest progress (progress bar + last logs)
   - Optimize progress (progress bar + last logs)

3. **Kısayollar GIF**
   - Ctrl+Enter → Backtest başlatma
   - Ctrl+Shift+O → Optimize başlatma
   - Esc → Modal/Panel kapatma

4. **TAB Order Smoke Test**
   - Code editor → Butonlar → Progress panel

5. **ESC Smoke Test**
   - Modal/dropdown ESC + focus return

6. **Contrast Spot-Check**
   - Badge metinleri, focus ring, CTA butonları

## 📦 Required Artifacts

### Screenshots (6 adet)
1. `after-skeleton.png` - Loading state
2. `after-empty.png` - Empty state
3. `after-error.png` - Error state + inline panel
4. `progress-backtest.png` - Backtest progress panel
5. `progress-optimize.png` - Optimize progress panel
6. `shortcuts-demo.png` - Kısayollar gösterimi

### GIF (1 adet)
- `shortcuts-flow.gif` - Ctrl+Enter → Backtest → Progress panel → Ctrl+Shift+O → Optimize (10-15 saniye)

### Test Sonucu Özeti (3 satır)
```
✅ TAB order: Code editor → Butonlar → Progress panel erişilebilir, Shift+TAB döngüsü çalışıyor
✅ ESC: Modal/Panel ESC ile kapanıyor, focus return çalışıyor
✅ Contrast: Badge metinleri ve focus ring ≥4.5:1 (gözle kontrol edildi)
```

## 🔄 Implementation Sırası

1. **Branch aç:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -B ui/p0-page-targets-strategy-lab
   ```

2. **UIStates Kit entegrasyonu:**
   - Progress panel için Skeleton
   - Error state için ErrorState + inline panel
   - Empty state için EmptyState

3. **Dev toggle ekle:**
   - `?job=idle|backtest|optimize` (SSR-safe)

4. **Kısayollar implementasyonu:**
   - `Ctrl+Enter` → Backtest
   - `Ctrl+Shift+O` → Optimize
   - `Esc` → Modal/Panel kapat

5. **Progress panel:**
   - Progress bar
   - Last logs paneli (son 10 satır)
   - Status paneli

6. **Evidence hazırla:**
   - README.md + MANUAL_TEST_RUNBOOK.md
   - Screenshot'lar (6 adet)
   - GIF (1 adet)

7. **PR aç:**
   - Base: `main`
   - Evidence PR yorumuna eklenecek

## ✅ Definition of Done

- [ ] UIStates kit entegre edildi (Skeleton/EmptyState/ErrorState)
- [ ] Dev toggle çalışıyor (`?job=idle|backtest|optimize`)
- [ ] Progress panel çalışıyor (progress bar + last logs)
- [ ] Inline error explanation panel çalışıyor
- [ ] Kısayollar çalışıyor (Ctrl+Enter, Ctrl+Shift+O, Esc)
- [ ] Klavye erişimi: Tüm interaktif öğeler TAB ile erişilebilir
- [ ] Kontrast: ≥4.5:1 (badge metinleri, focus ring)
- [ ] Evidence: 6 screenshots + 1 GIF + 3-line test summary
- [ ] PR açıldı ve merge edildi

---

**Son Güncelleme:** 2025-01-29
**Durum:** Hazır, blocking dependencies bekleniyor
**Pattern:** [P0 Evidence Pattern](docs/P0_EVIDENCE_PATTERN.md)

