# Modal Focus Trap Evidence

## Before/After Screenshots/GIF

### Focus Trap + ESC Close
- `before.png` - Eski modal (focus trap yok, ESC çalışmıyor)
- `after.png` veya `after.gif` - Yeni modal (focus trap + ESC)

### Test Senaryoları
1. **Focus Trap**: Modal açılınca focus ilk butona kilitlenir
2. **TAB Döngüsü**: Son elementten TAB → ilk elemente döner
3. **Shift+TAB Döngüsü**: İlk elementten Shift+TAB → son elemente döner
4. **ESC Close**: ESC ile modal kapanır, focus önceki elemente döner
5. **Edge Case**: Tek focusable element varsa döngü yapmaz

### Notlar
- aria-modal="true" + aria-labelledby/aria-describedby kullanıldı
- Focus trap edge-case kontrol edildi: tek element durumu handle ediliyor

