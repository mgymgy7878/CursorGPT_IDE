# StatusBadge Evidence

## Before/After Screenshots

### WS States
- `before.png` - Eski StatusDot kullanımı
- `after.png` - Yeni WSStatusBadge (connected/reconnecting/stale/error durumları)

### Test Senaryoları
1. **Connected**: WS bağlı, mesaj geliyor → 🟢 "Bağlı"
2. **Reconnecting**: WS yeniden bağlanıyor → 🟡 "Yeniden bağlanıyor..."
3. **Stale**: WS bağlı ama 5s+ mesaj yok → 🟠 "Eski (Xs)"
4. **Error**: WS bağlantı hatası → 🔴 "Bağlantı hatası"

### Notlar
- Staleness yanlış alarmı kontrol edildi: reconnecting iken stale gösterilmiyor
- aria-label ile ekran okuyucu desteği mevcut

