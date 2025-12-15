# Dashboard P0 Evidence

## Dev Toggle Kullanımı

Dashboard sayfasında dev toggle ile state'leri test etmek için:

- `?state=loading` - Loading state (Skeleton gösterimi)
- `?state=empty` - Empty state (EmptyState gösterimi)
- `?state=error` - Error state (ErrorState gösterimi)
- `?state=data` - Normal data state

**Örnek URL'ler:**
- `http://localhost:3003/dashboard?state=loading`
- `http://localhost:3003/dashboard?state=empty`
- `http://localhost:3003/dashboard?state=error`

## Before/After Screenshots

### 1. Loading State
- `before.png` - Eski loading durumu (tutarsız veya yok)
- `after.png` - Yeni Skeleton component (animate-pulse, aria-busy)

### 2. Empty State
- `before.png` - Eski empty durumu (sadece "no data" metni)
- `after.png` - Yeni EmptyState component (title + description + CTA)

### 3. Error State
- `before.png` - Eski error durumu (sadece hata mesajı)
- `after.png` - Yeni ErrorState component (message + retry button)

## GIF: Loading→Empty→Error Akışı

`loading-flow.gif` - Dev toggle ile sırayla gösterilen state'ler:
1. Loading (Skeleton)
2. Empty (EmptyState)
3. Error (ErrorState)

**GIF Çekme Talimatı:**
1. `?state=loading` → Screenshot al
2. `?state=empty` → Screenshot al
3. `?state=error` → Screenshot al
4. Veya dev toggle ile manuel olarak state değiştirip GIF kaydet

## WSStatusBadge Staleness Görünürlüğü

TopStatusBar'da WSStatusBadge'in staleness durumlarını test etmek için:

- **Connected (Taze)**: WS bağlı, mesaj geliyor → 🟢 "Bağlı"
- **Connected (Stale)**: WS bağlı ama 5s+ mesaj yok → 🟠 "Eski (Xs)"
- **Reconnecting**: WS yeniden bağlanıyor → 🟡 "Yeniden bağlanıyor..."

**Not:** Reconnecting iken stale gösterilmemeli (state önceliği: reconnecting > stale)

## Test Senaryoları

1. **Loading State**: Alarm Drafts panelinde Skeleton gösterimi
2. **Empty State**: Canary Tests panelinde EmptyState gösterimi
3. **Error State**: Her iki panelde ErrorState + retry butonu
4. **WSStatusBadge**: TopStatusBar'da staleness durumları

## DoD Kontrolü

- [ ] Klavye erişimi: Tüm interaktif öğeler TAB ile erişilebilir
- [ ] Kontrast: ≥4.5:1 (badge metinleri, focus ring)
- [ ] Loading/empty/error: Tüm state'ler görünür ve anlaşılır
- [ ] Dev toggle: Query param ile state kontrolü çalışıyor

## TAB Order Beklenen Sırası (Regression Test Standardı)

Dashboard sayfasında TAB ile gezinim sırası:

1. **TopStatusBar**: API badge → WSStatusBadge → Engine badge → Guard Validate link
2. **PageHeader**: Create Strategy butonu → Create Alert butonu
3. **Ana içerik**: 
   - P95 Metric → Staleness Metric
   - Alarm Drafts paneli (CTA butonu varsa)
   - Canary Tests paneli (CTA butonu varsa)
   - Live Market Cards (interaktif öğeler)
4. **Sidebar**: Last Alarm Status → Last Canary Test
5. **ErrorState retry butonları**: Hata durumunda "Tekrar dene" butonları

**Shift+TAB**: Geriye doğru aynı sıra (ters yön)

**Not:** Bu sıra, regresyon testlerinde standardize edilmiş referans olarak kullanılır. Değişiklik yapıldığında bu liste güncellenmelidir.

