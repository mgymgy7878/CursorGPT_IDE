# P2 Roadmap - Operasyonel Kokpit Yükseltmesi

## Genel Bakış

Ana sayfayı "bak-ve-hareket-et" seviyesine çıkarmak için P2 iyileştirmeleri. Tek ekranda trend, risk, haber, P&L ve aksiyon.

## Uygulama Sırası (1 Sprint)

### Faz 1: Portföy P&L Sparkline (2-3 gün)

**Bileşen:** `apps/web-next/src/components/home/PortfolioSpark.tsx`

**Özellikler:**
- Üst: Toplam Bakiye, Günlük P&L, Aylık P&L (chip'lerle "Gün/Ay" toggle)
- Alt: 24/60 noktalı sparkline (recharts)
- `prefers-reduced-motion` saygılı (animasyonları kapat)
- Hover'da son 5 noktanın delta'sını gösteren tooltip

**Teknik:**
- Recharts `Line` component (lightweight)
- `useSWR` ile `/api/portfolio/history?period=24h|60h`
- CSS: `@media (prefers-reduced-motion: reduce) { animation: none; }`

**Entegrasyon:**
- `PortfolioPnL.tsx` içine `PortfolioSpark` ekle
- Mevcut P&L kartını zenginleştir

---

### Faz 2: Çalışan Stratejiler Top 3 Liste (2 gün)

**Bileşen:** `apps/web-next/src/components/home/StrategiesTop.tsx`

**Özellikler:**
- "Açık P&L Toplamı" altında ilk 3 strateji: ad | anlık P&L | % | minik çubuk gösterge
- Satır üzerine hover: ▶ Başlat/⏸ Durdur kısayol butonları (ikon)
- Kart footer: "Tüm stratejiler" linki

**Teknik:**
- `useSWR` ile `/api/strategies/active?limit=3`
- Lucide icons: `Play`, `Pause`
- Mini progress bar: `div` ile CSS `linear-gradient`

**Entegrasyon:**
- `StrategiesPnL.tsx` içine `StrategiesTop` ekle
- Mevcut liste görünümünü zenginleştir

---

### Faz 3: Piyasa Akıllı Chip'ler (2-3 gün)

**Bileşen:** `apps/web-next/src/components/home/MarketChips.tsx`

**Özellikler:**
- Üstte 3 chip: "En çok ↑ %", "En çok ↓ %", "Hacim ↑"
- Tıklayınca tabloyu o kritere göre sırala
- İlk 3 satırı hafif arka planla vurgula
- Tablo header'ına `aria-sort` ekle

**Teknik:**
- Local state: `sortBy: 'changeUp' | 'changeDown' | 'volume' | null`
- `rows.sort()` ile client-side sorting
- `aria-sort="ascending|descending|none"` ekle
- İlk 3 satır: `bg-emerald-500/5` ile vurgula

**Entegrasyon:**
- `MarketQuick.tsx` içine `MarketChips` ekle
- Sort logic'i `MarketQuick` içine taşı

---

### Faz 4: Canlı Haber KAP Odaklı Short-Brief (1-2 gün)

**Bileşen:** `apps/web-next/src/components/home/LiveNews.tsx` (mevcut, iyileştirme)

**Özellikler:**
- "Özet" modu: her satırda 1 satırlık özet + kaynak rozet + süre
- KAP açıkken başlığa küçük "KAP filtresi aktif" ikonu
- Hover'da 2. satırda kısa genişleme (max 2 satır)
- Tıklayınca "Haber detayı" sayfası

**Teknik:**
- `summary` prop zaten var
- KAP ikonu: Lucide `Filter` icon
- Expand/collapse: `useState` ile kontrol
- Link: `next/link` ile `/news/[id]`

**Entegrasyon:**
- Mevcut `LiveNews.tsx` içine özet modu ekle
- KAP ikonu header'a ekle

---

### Faz 5: Copilot Çıktı Paneli (2 gün)

**Bileşen:** `apps/web-next/src/components/home/CopilotOutput.tsx`

**Özellikler:**
- Kartın altında dar bir çıktı kanalı (log-like)
- Son komut özeti, "gelişmiş"e atlayan link
- Üç hazır kısayol: "BTC 1h trend + risk", "Portföy özet", "Strateji sağlığı"

**Teknik:**
- `useCopilotStore` ile son komut state'i
- Scrollable container: `max-h-[120px] overflow-y-auto`
- Kısayollar: `button` array ile map

**Entegrasyon:**
- `CopilotMini.tsx` içine `CopilotOutput` ekle
- Store entegrasyonu

---

### Faz 6: Telemetri & Performans (1 gün)

**Event'ler:**
- `news_chip_click` (KAP toggle)
- `market_sort_change` (sort chip)
- `copilot_quickrun` (quick command)
- `strategy_quick_toggle` (play/pause)

**Render Optimizasyonu:**
- Haber/Piyasa listelerinde virtualization (10+ satırda)
- `react-window` veya `@tanstack/react-virtual`
- KPI'larda `will-change: transform` ekle

**Teknik:**
- Analytics: `analytics.track()` wrapper
- Virtualization: `react-window` minimal setup
- CSS: `will-change: transform` KPI strip'e

---

## Kabul Kriterleri

- ✅ 1366×768 ve 1440×900'de 5 modül fold üstünde
- ✅ Sağ ray 360–420px aralığında
- ✅ Sparkline animasyonu `prefers-reduced-motion: reduce` iken kapalı
- ✅ Chip/sort etkileşimleri tabloyu 100ms altında güncelliyor
- ✅ Erişilebilirlik: KAP anahtarı `role="switch"`, tablo başlıkları `aria-sort`, butonlar Space/Enter ile tetikleniyor

## Bağımlılıklar

```json
{
  "recharts": "^2.10.0",
  "lucide-react": "^0.300.0",
  "react-window": "^1.8.10"
}
```

## Test Planı

1. **Visual Regression:** Screenshot karşılaştırması (Playwright)
2. **Performance:** Lighthouse score (90+)
3. **Accessibility:** axe-core (WCAG AA)
4. **Interaction:** Chip/sort etkileşimleri (100ms altında)

## Notlar

- Tüm bileşenler `apps/web-next/src/components/home/` altında
- Mock data ile başla, sonra API entegrasyonu
- Her faz için ayrı PR (incremental)
- P1.5 kozmetik düzeltmeleri tamamlandı ✓

