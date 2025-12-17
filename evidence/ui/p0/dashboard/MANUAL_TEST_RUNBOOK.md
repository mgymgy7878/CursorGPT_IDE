# Dashboard P0 Manual Test Runbook

## 🎯 Amaç

Dashboard P0 hedefi için kanıt paketini tamamlamak: screenshot/GIF seti + TAB order + contrast spot-check.

## 📋 Test Adımları

### 1. UIStates Kit Screenshots

#### 1.1 Loading State (Skeleton)
- **URL**: `http://localhost:3003/dashboard?state=loading`
- **Beklenen**: Alarm Drafts ve Canary Tests panellerinde Skeleton gösterimi
- **Screenshot**: `after-skeleton.png`
- **Doğrulama**: `aria-busy="true"` + animate-pulse animasyonu görünür

#### 1.2 Empty State (EmptyState)
- **URL**: `http://localhost:3003/dashboard?state=empty`
- **Beklenen**: Alarm Drafts ve Canary Tests panellerinde EmptyState (title + description + CTA)
- **Screenshot**: `after-empty.png`
- **Doğrulama**: "Henüz alarm taslağı yok" + "Alarm Oluştur" butonu görünür

#### 1.3 Error State (ErrorState)
- **URL**: `http://localhost:3003/dashboard?state=error`
- **Beklenen**: Alarm Drafts ve Canary Tests panellerinde ErrorState (message + retry button)
- **Screenshot**: `after-error.png`
- **Doğrulama**: "Bir hata oluştu" + "Tekrar dene" butonu görünür

#### 1.4 Loading→Empty→Error→Data Akışı (GIF)
- **URL**: `http://localhost:3003/dashboard?state=loading` → `?state=empty` → `?state=error` → `?state=data`
- **Beklenen**: State'ler arası geçiş animasyonları
- **GIF**: `loading-flow.gif` (10-15 saniye)
- **Doğrulama**: Her state geçişi smooth ve anlaşılır

### 2. WSStatusBadge Staleness Görünürlüğü

#### 2.1 Connected (Fresh)
- **Durum**: WS bağlı, mesaj geliyor
- **Beklenen**: 🟢 "Bağlı"
- **Screenshot**: `ws-connected-fresh.png`
- **Doğrulama**: TopStatusBar'da yeşil badge görünür

#### 2.2 Connected (Stale)
- **Durum**: WS bağlı ama 5s+ mesaj yok
- **Beklenen**: 🟠 "Eski (Xs)" (X = saniye)
- **Screenshot**: `ws-connected-stale.png`
- **Doğrulama**: TopStatusBar'da turuncu badge + staleness süresi görünür

#### 2.3 Reconnecting
- **Durum**: WS yeniden bağlanıyor
- **Beklenen**: 🟡 "Yeniden bağlanıyor..."
- **Screenshot**: `ws-reconnecting.png`
- **Doğrulama**: TopStatusBar'da sarı badge görünür, stale gösterilmez

**Önemli:** Reconnecting iken stale gösterilmemeli (state önceliği: reconnecting > stale)

### 3. TAB Order Smoke Test

**Beklenen Sıra** (TAB ile ileriye doğru):

1. TopStatusBar: API badge → WSStatusBadge → Engine badge → Guard Validate link
2. PageHeader: Create Strategy butonu → Create Alert butonu
3. Ana içerik: P95 Metric → Staleness Metric
4. Alarm Drafts paneli: CTA butonu (EmptyState'de)
5. Canary Tests paneli: CTA butonu (EmptyState'de)
6. ErrorState retry butonları: "Tekrar dene" butonları (ErrorState'de)

**Shift+TAB**: Geriye doğru aynı sıra (ters yön)

**Doğrulama:**
- [ ] TAB ile tüm interaktif öğelere erişilebiliyor
- [ ] Shift+TAB ile geriye doğru döngü çalışıyor
- [ ] Focus ring görünür ve kontrastlı

### 4. ESC Smoke Test

**Test Senaryosu:**
- Modal veya dropdown aç (varsa)
- ESC tuşuna bas
- Modal/dropdown kapanmalı
- Focus önceki elemente dönmeli

**Doğrulama:**
- [ ] ESC ile modal/dropdown kapanıyor
- [ ] Focus önceki elemente dönüyor
- [ ] Focus trap çalışıyor (modal içinde TAB döngüsü)

### 5. Contrast Spot-Check

**Kontrol Edilecek Öğeler:**
- Badge metinleri (WSStatusBadge, StatusBadge)
- Focus ring (TAB ile focuslanan öğeler)
- CTA butonları (EmptyState, ErrorState)
- Error mesajları

**Beklenen**: ≥4.5:1 kontrast oranı

**Doğrulama:**
- [ ] Badge metinleri okunabilir (≥4.5:1)
- [ ] Focus ring görünür ve kontrastlı
- [ ] CTA butonları okunabilir
- [ ] Error mesajları okunabilir

**Tool**: Browser DevTools → Accessibility panel veya online contrast checker

## 📦 Deliverable

### PR #36 Yorumuna Eklenecekler:

1. **Screenshots** (drag & drop):
   - `after-skeleton.png`
   - `after-empty.png`
   - `after-error.png`
   - `ws-connected-fresh.png`
   - `ws-connected-stale.png`
   - `ws-reconnecting.png`

2. **GIF**:
   - `loading-flow.gif` (10-15 saniye)

3. **Test Sonucu Özeti** (3 satır):
   ```
   ✅ TAB order: Tüm interaktif öğelere erişilebilir, Shift+TAB döngüsü çalışıyor
   ✅ ESC: Modal/dropdown ESC ile kapanıyor, focus return çalışıyor
   ✅ Contrast: Badge metinleri ve focus ring ≥4.5:1 (gözle kontrol edildi)
   ```

## 🔄 Regression Test Standardı

Bu runbook, ileride Strategy Lab ve Running Strategies sayfaları için de aynı formatla kullanılacak:

- UIStates kit screenshots (loading/empty/error)
- State akışı GIF'i
- TAB order beklenen sırası
- ESC smoke test
- Contrast spot-check

**Not:** Her sayfa için TAB order beklenen sırası, o sayfanın evidence README'sine eklenmelidir.

