# P0-Page Targets Implementation Plan

## 🎯 Amaç

P0-Global foundation tamamlandıktan sonra, her P0 sayfası için UIStates kit + WSStatusBadge + Modal/Table standartlarını uygulamak.

## 📋 Sıralı İlerleme Kuralı

**Kritik:** P0 bitmeden P1 yok. Her sayfa için:
- ✅ UIStates kit entegrasyonu (Skeleton/EmptyState/ErrorState)
- ✅ WSStatusBadge entegrasyonu (Dashboard için)
- ✅ Evidence: 1 before/after + 1 kısa GIF
- ✅ DoD kontrolü: klavye erişimi + kontrast + loading/empty/error

## 🗺️ Sayfa Bazlı İş Listesi

### 1. Dashboard (Ana Sayfa)

**Hedefler:**
- [ ] Ticker ve strateji panellerinde skeleton loading
- [ ] Sol menüde aktif sayfa vurgusu + (opsiyon) breadcrumb
- [ ] Üst çubukta WS bağlantı durumu (connected/paused/reconnecting + staleness)

**UIStates Kit Kullanımı:**
- `Skeleton` → Ticker paneli yüklenirken
- `EmptyState` → Strateji listesi boşsa
- `ErrorState` → API hatası durumunda

**WSStatusBadge Entegrasyonu:**
- TopStatusBar'da WS durumu görünür
- Staleness tracking: 5s+ mesaj yoksa stale göster

**Evidence:**
- `evidence/ui/p0/dashboard/before.png` - Eski durum
- `evidence/ui/p0/dashboard/after.png` - Yeni durum (skeleton/empty/error)
- `evidence/ui/p0/dashboard/loading-flow.gif` - Loading→Empty→Error akışı

**DoD:**
- [ ] Klavye erişimi: Tüm interaktif öğeler TAB ile erişilebilir
- [ ] Kontrast: ≥4.5:1 (badge metinleri, focus ring)
- [ ] Loading/empty/error: Tüm state'ler görünür ve anlaşılır

---

### 2. Strategy Lab

**Hedefler:**
- [ ] Kaydet/Backtest/Optimize için spinner + toast
- [ ] Kod editör hataları için inline açıklama paneli (hata → öneri)
- [ ] "Run" sonrası son log'lar & status paneli (son 10 satır)
- [ ] Kısayollar:
  - `Ctrl+Enter`: Backtest
  - `Ctrl+Shift+O`: Optimize
  - `Esc`: Modal/Panel kapat

**UIStates Kit Kullanımı:**
- `Skeleton` → Backtest/Optimize sonuçları yüklenirken
- `ErrorState` → Kod editör hatası durumunda (inline panel)

**Progress Panel:**
- Backtest/Optimize çalışırken progress bar + son log satırları
- Toast bildirimleri (başarılı/uyarı/hata)

**Evidence:**
- `evidence/ui/p0/strategy-lab/before.png` - Eski durum
- `evidence/ui/p0/strategy-lab/after.png` - Yeni durum (progress panel + shortcuts)
- `evidence/ui/p0/strategy-lab/shortcuts.gif` - Kısayollar gösterimi

**DoD:**
- [ ] Klavye erişimi: Kısayollar çalışıyor (Ctrl+Enter, Ctrl+Shift+O, Esc)
- [ ] Kontrast: ≥4.5:1
- [ ] Progress panel: Son log satırları görünür

---

### 3. Running Strategies (Çalışan Stratejiler)

**Hedefler:**
- [ ] Sparkline daha büyük + tooltip (PnL, DD, winrate gibi temel özet)
- [ ] Pause/Resume butonları net ikon + metin
- [ ] Durum rozeti: running/paused/error + son olay zamanı

**UIStates Kit Kullanımı:**
- `Skeleton` → Strateji listesi yüklenirken
- `EmptyState` → Henüz çalışan strateji yoksa

**WSStatusBadge Entegrasyonu:**
- Her strateji için durum rozeti (running/paused/error)
- Son olay zamanı gösterimi

**Evidence:**
- `evidence/ui/p0/running-strategies/before.png` - Eski durum
- `evidence/ui/p0/running-strategies/after.png` - Yeni durum (state badge + pause/resume)
- `evidence/ui/p0/running-strategies/state-flow.gif` - State değişimleri (running→paused→error)

**DoD:**
- [ ] Klavye erişimi: Pause/Resume butonları TAB ile erişilebilir
- [ ] Kontrast: ≥4.5:1
- [ ] State badge: Durum net görünür (running/paused/error)

---

## 🔄 İlerleme Sırası

1. **Dashboard** → İlk sayfa, en çok görülen
2. **Strategy Lab** → Core functionality, kullanıcı akışının merkezi
3. **Running Strategies** → Canlı durum takibi, kritik bilgi

**Kural:** Her sayfa tamamlandıktan sonra evidence alınır, PR açılır, merge edilir. Sonraki sayfaya geçilir.

---

## 📊 Evidence Standartları

### Her Sayfa İçin:
- **1 before/after screenshot**: Eski vs yeni durum karşılaştırması
- **1 kısa GIF**: İnteraktif özellikler (loading akışı, kısayollar, state değişimleri)

### GIF İçeriği:
- **Dashboard**: Loading→Empty→Error akışı (3-5 saniye)
- **Strategy Lab**: Kısayollar gösterimi (Ctrl+Enter, Ctrl+Shift+O, Esc)
- **Running Strategies**: State değişimleri (running→paused→error)

---

## ✅ Definition of Done (Her Sayfa İçin)

- [ ] UIStates kit entegre edildi (Skeleton/EmptyState/ErrorState)
- [ ] WSStatusBadge entegre edildi (Dashboard için)
- [ ] Klavye erişimi: Tüm interaktif öğeler TAB ile erişilebilir
- [ ] Kontrast: ≥4.5:1 (badge metinleri, focus ring)
- [ ] Loading/empty/error: Tüm state'ler görünür ve anlaşılır
- [ ] Evidence: 1 before/after + 1 kısa GIF
- [ ] PR açıldı ve merge edildi

---

## 🚀 Başlangıç Komutları

```bash
# P0-Global merge sonrası
git checkout main
git pull origin main
git checkout -B ui/p0-page-targets-dashboard

# İlk sayfa: Dashboard
# ... implementation ...
# ... evidence al ...
# ... PR aç ...
# ... merge et ...

# Sonraki sayfa: Strategy Lab
git checkout -B ui/p0-page-targets-strategy-lab
# ... implementation ...
```

---

**Son Güncelleme:** 2025-01-29  
**Durum:** P0-Global tamamlandı, P0-Page Targets hazır

