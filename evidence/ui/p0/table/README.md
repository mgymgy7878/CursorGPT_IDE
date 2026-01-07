# Table A11y Evidence

## Before/After Screenshots

### Sticky Header + Numeric Formatting + Zebra Pattern
- `before.png` - Eski tablo (sticky header yok, numeric formatting tutarsız)
- `after.png` - Yeni tablo (sticky header + tabular-nums + zebra pattern)

### Test Senaryoları
1. **Sticky Header**: Scroll edildiğinde header sabit kalır
2. **Numeric Formatting**: Numeric kolonlar `tabular-nums` ile hizalı
3. **Zebra Pattern**: Alternating row colors (even/odd)
4. **A11y**: thead>th[scope="col"] ile erişilebilirlik

### Notlar
- aria-sort attribute eklenecek (sıralama özelliği eklendiğinde)
- Tablo scroll container içinde max-height ile sınırlandırıldı

