# UI/UX Backlog — Önceliklendirilmiş İşler

## HIGH (P0)
- Form error handling: alan-altı mesaj + inline validasyon (Ayarlar, Strategy Studio)
- WCAG AA: kontrast düzeltmeleri, odak halkaları, klavye erişilebilirlik
- Navigasyon: aktif menü vurgusu + opsiyonel breadcrumb
- Skeleton & Empty States: Dashboard, Strategy Lab, Portföy

## MEDIUM (P1)
- Veri görselleştirme: eksen etiketleri, birimler, uygun grafik türleri
- Renk & tipografi standardizasyonu (primary/secondary, tabular nums)
- Portföy: sabit header + sıralama ikonları + zebra

## LOW (P2)
- Yardım ipuçları (inline help), ikon metinleri/tooltip'leri
- Mobil kırılım cilaları (safe-area, alt konumlandırma)

## Kabul Kriterleri (özet)
- Axe kritik ihlal: 0; Lighthouse a11y ≥ 90
- Klavye ile tüm CTA'lara erişim ve görünür odak
- P95 < 3s'de skeleton; boş veri durumuna açıklama + CTA

## Evidence
- `evidence/ui-ux/<YYYYMMDD>/axe/*.json`
- `evidence/ui-ux/<YYYYMMDD>/lighthouse/*.json`
- `evidence/ui-ux/<YYYYMMDD>/screenshots/*.png`

