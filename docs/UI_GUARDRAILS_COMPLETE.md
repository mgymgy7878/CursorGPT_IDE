# UI Guardrails Tamamlandı ✅

**Tarih:** 12 Ocak 2026
**Durum:** PASS — Tüm guardrails aktif ve çalışıyor

## Tamamlanan İşlemler

### 1. Token Lockdown (Baseline Mode)
- ✅ Hardcode renk sınıflarını yakalayan script (`scripts/check-ui-tokens.js`)
- ✅ Baseline mode: Mevcut violation'lar borç olarak kalır, yeni violation'lar yakalanır
- ✅ CI entegrasyonu: PR'larda otomatik çalışır
- ✅ Stabil hash: Satır kayması yeni ihlal olarak algılanmaz

**Kullanım:**
```bash
# Yeni violation kontrolü
pnpm check:ui-tokens

# Baseline güncelleme (UI değişikliği yaptıysanız)
pnpm check:ui-tokens:baseline

# Hotspot dosyaları görüntüle
pnpm check:ui-tokens:hotspot
```

### 2. Visual Smoke Test
- ✅ Core route'lar için snapshot'lar oluşturuldu (8 dosya, win32 formatında)
- ✅ CSP-safe test implementasyonu
- ✅ Flakiness azaltma teknikleri (animasyon kapatma, sabit viewport, caret gizleme)
- ✅ CI entegrasyonu: Windows runner kullanıyor (win32 snapshot uyumu)

**Snapshot'lar:**
- `/dashboard` → `-dashboard-full-win32.png`
- `/market-data` → `-market-data-full-win32.png`
- `/strategies` → `-strategies-full-win32.png`
- `/running` → `-running-full-win32.png`
- `/control` → `-control-full-win32.png`
- `/settings` → `-settings-full-win32.png`
- Command Palette → `command-palette-open-win32.png`
- Empty State → `strategies-empty-state-win32.png`

**Kullanım:**
```bash
# Normal akış: Snapshot compare (CI'da otomatik)
pnpm ui:test:visual

# UI değişikliği yaptıysanız: Snapshot güncelleme (kontrollü)
pnpm ui:test:update
```

**Kural:** Normal PR'larda sadece `pnpm ui:test:visual` çalıştırın. Sadece bilinçli UI değişikliği yaptıysanız `pnpm ui:test:update` kullanın.

### 3. CI Workflow
- ✅ `.github/workflows/ui-guard.yml` aktif
- ✅ Token Lockdown: Ubuntu runner (hafif, hızlı)
- ✅ Visual Smoke: Windows runner (win32 snapshot uyumu)
- ✅ PR ve push trigger'ları yapılandırıldı

## Commit'ler

```
fa32283dc chore(ci): use windows-latest for visual smoke tests (snapshot win32 compatibility)
6504b65c2 chore(ui): add initial visual smoke snapshots
```

## Sonuç

UI Guardrails artık tam olarak çalışıyor:
- ✅ Token Lockdown yeni violation'ları yakalıyor
- ✅ Visual Smoke Test snapshot compare yapıyor
- ✅ CI otomatik olarak yeni kaçakları yakalayacak

**UI işi artık "yangın" olmaktan çıktı.** Artık ürünün asıl motoruna (market data/backtest/guardrails) dönebilirsiniz.

## Sonraki Adımlar (Önerilen Sırayla)

1. **Market Data canlı katman:**
   - Staleness/latency ölçümü
   - Reconnect/backoff mekanizması
   - "No data" empty-state'leri gerçek metrikle bağla
   - UI'da "Veri akışı çalışıyor/çalışmıyor" gerçek kaynaktan göster

2. **BTCTurk + BIST reader:**
   - Tek event envelope
   - Tek clock
   - Tek symbol normalizasyonu

3. **Backtest engine:**
   - Deterministik replay
   - Param grid
   - Rapor çıktısı (equity curve, drawdown, trades)

## İlgili Dokümanlar

- [UI_GUARDRAILS.md](./UI_GUARDRAILS.md) - Detaylı guardrails dokümantasyonu
- [UI_GUARDRAILS_SNAPSHOT_SETUP.md](./UI_GUARDRAILS_SNAPSHOT_SETUP.md) - Snapshot setup guide
- [UI_UX_PLAN.md](./UI_UX_PLAN.md) - UI/UX plan ve DoD checklist
