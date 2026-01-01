# Figma Parity Analysis - Spark Trading UI

## Mevcut Durum Özeti

### ✅ Tamamlanan Bileşenler
- **TopStatusBar** - Figma parity %95+ (mikro rötuşlar tamamlandı)
  - 3-section layout (left/center/right)
  - Pill-based design tokens
  - Health indicators (API, WS, Executor, DEV)
  - Consistent typography (text-[13px] font-medium)
  - SparkMark component (single source of truth)

### 📋 Ana Sayfalar (Analiz Edilecek)

#### Core Pages (Shell Layout)
1. **Dashboard** (`/dashboard`)
   - Portfolio summary cards
   - Market status
   - Active strategies table
   - Risk status
   - SPARK COPILOT panel

2. **Portfolio** (`/portfolio`)
   - Portfolio overview
   - Account balances
   - Asset breakdown

3. **Market Data** (`/market-data`)
   - Market tickers
   - Price charts
   - Market indicators

4. **Strategy Lab** (`/strategy-lab`)
   - Strategy builder
   - Code editor
   - Backtest interface

5. **Strategies** (`/strategies`)
   - Strategy list
   - Strategy cards
   - Filter/search

6. **Running Strategies** (`/running`)
   - Active strategies
   - Performance metrics
   - Control actions

7. **Alerts** (`/alerts`)
   - Alert list
   - Alert configuration
   - Alert history

8. **Audit / Logs** (`/audit`)
   - Audit trail
   - Event logs
   - Filter/search

9. **Risk / Protection** (`/guardrails`)
   - Risk limits
   - Guardrail rules
   - Protection status

10. **Settings** (`/settings`)
    - User preferences
    - System configuration
    - Integration settings

#### Secondary Pages
- Backtest (`/backtest`)
- Technical Analysis (`/technical-analysis`)
- Observability (`/observability`)
- Strategy Studio (`/strategy-studio`)
- AI Optimizer (`/ai-optimizer`)

## Analiz Kriterleri

### 1. Tipografi
- Font size: `text-[13px]` (pill'ler için standart)
- Font weight: `font-medium`
- Line height: `leading-none`
- Tabular numbers: `tabular-nums` (metrikler için)

### 2. Renkler
- Background: `bg-[#0B0F14]` (ana arkaplan)
- Cards: `bg-white/5` (hafif şeffaf)
- Borders: `border-white/10`
- Text primary: `text-white/90`
- Text secondary: `text-white/60`
- Text muted: `text-white/35`
- Success: `text-emerald-300`
- Warning: `text-amber-500`
- Error: `text-red-500`

### 3. Spacing
- Pill padding: `px-3 py-[3px]`
- Gap between elements: `gap-2` (default), `gap-1.5` (tight)
- Section padding: `px-3` (status bar), `p-4` (cards)

### 4. Layout
- Border radius: `rounded-full` (pill'ler), `rounded-xl` (butonlar)
- Bar height: `h-12` (status bar)
- Card spacing: Consistent padding

### 5. İkonografi
- SparkMark: Single source component (`SparkMark.tsx`)
- Icon size: `h-3.5 w-3.5` (status bar)
- Status dots: `h-2 w-2`

### 6. Interaktivite
- Hover: `hover:bg-white/8` (subtle)
- Transitions: `transition-colors`
- Click handlers: Consistent patterns

## Analiz Checklist (Her Sayfa İçin)

- [ ] Layout structure (3-section, grid, flex)
- [ ] Typography consistency
- [ ] Color palette alignment
- [ ] Spacing/padding consistency
- [ ] Icon usage (SparkMark, status dots)
- [ ] Pill components (Brand, Canary, Health, Action)
- [ ] Card styling
- [ ] Button styling
- [ ] Form elements
- [ ] Table styling
- [ ] Responsive behavior
- [ ] Dark theme consistency
- [ ] Edge fade (scrollable areas)
- [ ] Separator style (`·` with `text-white/35`)

## Yardımcı Komutlar

### Sayfa Listesi
```bash
# Tüm sayfaları listele
find apps/web-next/src/app -name "page.tsx" -type f
```

### Component Analizi
```bash
# Belirli bir sayfadaki component'leri bul
grep -r "import.*from" apps/web-next/src/app/(shell)/dashboard
```

### Tipografi Kontrolü
```bash
# text-xs kullanımlarını bul (text-[13px] olmalı)
grep -r "text-xs" apps/web-next/src/components
```

### Renk Kontrolü
```bash
# Hardcoded renkleri bul
grep -r "#[0-9A-Fa-f]\{6\}" apps/web-next/src
```

## Öncelik Sırası (Önerilen)

1. **Dashboard** - Ana sayfa, en görünür
2. **Portfolio** - Önemli veri görselleştirme
3. **Strategy Lab** - Kullanıcı etkileşimi yüksek
4. **Strategies** - Liste görünümü, standartlaştırma
5. **Running Strategies** - Real-time data
6. **Alerts** - Kritik bilgi
7. **Audit** - Log görünümü
8. **Settings** - Form elementleri
9. **Guardrails** - Risk yönetimi
10. **Market Data** - Grafik/chart bileşenleri

## Notlar

- Status bar tamamlandı, diğer sayfalar için referans olarak kullanılabilir
- Design tokens (`apps/web-next/src/styles/tokens.css`) kontrol edilmeli
- Shared components (`apps/web-next/src/components`) tutarlılık için gözden geçirilmeli
- Figma'dan export edilen renk/spacing değerleri doğrulanmalı

