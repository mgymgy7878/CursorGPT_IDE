# P0-Global Regression Checklist

## Klavye Navigasyon (TAB Order)

- [ ] **TopStatusBar**: WS badge TAB ile erişilebilir
- [ ] **Ana içerik**: Tüm interaktif öğeler TAB sırasıyla erişilebilir
- [ ] **Tablo header sort**: Sıralama butonları TAB ile erişilebilir (gelecekte eklenecek)

## ESC ve Focus Yönetimi

- [ ] **Modal ESC**: ESC ile modal kapanıyor
- [ ] **Focus geri dönüşü**: Modal kapandığında focus önceki elemente dönüyor
- [ ] **Focus trap**: Modal içinde TAB ile döngü çalışıyor (ilk→son→ilk)
- [ ] **Shift+TAB**: Geriye doğru döngü çalışıyor (son→ilk→son)
- [ ] **Edge case**: Tek focusable element varsa döngü yapmıyor

## Kontrast Spot-Check (≥4.5:1)

- [ ] **Badge metinleri**: StatusBadge metinleri arka plana göre ≥4.5:1
- [ ] **Focus ring**: Focus halkası görünür ve kontrastlı
- [ ] **Modal metinleri**: Modal içindeki metinler okunabilir
- [ ] **Tablo metinleri**: Tablo içindeki metinler okunabilir

## Edge Case Kontrolleri

- [ ] **Focus trap edge-case**: Modal içinde tek element varsa döngü yapmıyor
- [ ] **Staleness yanlış alarmı**: WS "reconnecting" iken stale gösterilmiyor
- [ ] **Staleness doğru alarmı**: WS "connected" ama mesaj gelmiyorsa stale gösteriliyor

