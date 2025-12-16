# UI Primitives - Design System Reference

**Durum:** Tek kaynak doküman (single source of truth)
**Sürüm:** 1.0
**Hedef:** Tüm UI primitives'in kullanım örnekleri ve kuralları

---

## 0) Amaç

Bu doküman, Spark Trading Platform'da kullanılan tüm UI primitives'in:
- Kullanım örnekleri
- Props ve variant'ları
- Figma parity kuralları
- Deterministic state yönetimi

için referans görevi görür.

---

## 1) Layout Primitives

### Surface

**Dosya:** `apps/web-next/src/components/ui/Surface.tsx`

**Variants:** `panel`, `card`, `inset`

**Kullanım:**
```tsx
import { Surface, SurfaceHeader, SurfaceContent } from '@/components/ui/Surface';

<Surface variant="card">
  <SurfaceHeader>
    <h3>Title</h3>
  </SurfaceHeader>
  <SurfaceContent>
    Content here
  </SurfaceContent>
</Surface>
```

**Kurallar:**
- Token-based styling (tokens.css)
- Border: `border-neutral-800`
- Background: `bg-neutral-900/80` (card), `bg-neutral-900/60` (panel), `bg-neutral-950/50` (inset)

---

### DataTable

**Dosya:** `apps/web-next/src/components/ui/DataTable.tsx`

**Kullanım:**
```tsx
import { DataTable, DataTableHeader, DataTableRow, DataTableCell, DataTableHeaderCell } from '@/components/ui/DataTable';

<DataTable>
  <DataTableHeader>
    <DataTableRow hover={false}>
      <DataTableHeaderCell>Column 1</DataTableHeaderCell>
    </DataTableRow>
  </DataTableHeader>
  <tbody>
    <DataTableRow>
      <DataTableCell>Value</DataTableCell>
    </DataTableRow>
  </tbody>
</DataTable>
```

**Kurallar:**
- Overflow-x wrapper ile yatay scroll kontrolü
- Row hover: `hover:bg-neutral-900/30`
- Header: `bg-neutral-900/50`

---

## 2) Dashboard Primitives

### StatCard

**Dosya:** `apps/web-next/src/components/ui/StatCard.tsx`

**Kullanım:**
```tsx
import { StatCard } from '@/components/ui/StatCard';

<StatCard
  label="Toplam Varlık"
  value="$124,592.00"
  delta={{ value: '+2.4%', isPositive: true }}
  sublabel="Last 24h"
/>
```

**Kurallar:**
- Label: `text-xs text-neutral-400`
- Value: `text-2xl font-semibold text-neutral-200`
- Delta: `text-emerald-400` (positive) / `text-red-400` (negative)

---

### MiniList

**Dosya:** `apps/web-next/src/components/ui/MiniList.tsx`

**Kullanım:**
```tsx
import { MiniList } from '@/components/ui/MiniList';

<MiniList
  title="Piyasa Durumu"
  items={[
    { label: 'BTC/USDT', value: '42,150.00', delta: { value: '+1.2%', isPositive: true } },
  ]}
/>
```

---

### CompactTable

**Dosya:** `apps/web-next/src/components/ui/CompactTable.tsx`

**Kullanım:**
```tsx
import { CompactTable } from '@/components/ui/CompactTable';

<CompactTable
  title="Aktif Stratejiler"
  badge="12 Running"
  columns={[
    { header: 'Strategy', accessor: 'name' },
    { header: 'PnL', accessor: 'pnl', render: (value, row) => <DeltaText value={value} /> },
  ]}
  data={strategies}
/>
```

---

### RiskBar

**Dosya:** `apps/web-next/src/components/ui/RiskBar.tsx`

**Kullanım:**
```tsx
import { RiskBar } from '@/components/ui/RiskBar';

<RiskBar
  label="Daily Drawdown"
  value={1.2}
  variant="warning"
  threshold={5}
/>
```

**Variants:** `default` (green), `warning` (amber), `danger` (red)

---

### SystemHealthCard

**Dosya:** `apps/web-next/src/components/ui/SystemHealthCard.tsx`

**Kullanım:**
```tsx
import { SystemHealthCard } from '@/components/ui/SystemHealthCard';

<SystemHealthCard
  title="Sistem Sağlığı"
  items={[
    { label: 'API Latency', value: '12ms', status: 'healthy' },
    { label: 'Execution', value: 'Operational', status: 'healthy' },
  ]}
/>
```

---

## 3) Market Data Primitives

### DeltaText

**Dosya:** `apps/web-next/src/components/ui/DeltaText.tsx`

**Kullanım:**
```tsx
import { DeltaText } from '@/components/ui/DeltaText';

<DeltaText value={1.2} isPositive={true} showSign={true} />
```

**Kurallar:**
- Positive: `text-emerald-400`
- Negative: `text-red-400`
- Tabular numbers: `tabular-nums`

---

### MonoNumber

**Dosya:** `apps/web-next/src/components/ui/MonoNumber.tsx`

**Kullanım:**
```tsx
import { MonoNumber } from '@/components/ui/MonoNumber';

<MonoNumber value={42150.00} className="text-sm" />
```

**Kurallar:**
- Font: `font-mono tabular-nums`
- Consistent width için kullanılır

---

### RowActions

**Dosya:** `apps/web-next/src/components/ui/RowActions.tsx`

**Kullanım:**
```tsx
import { RowActions, RowActionButton } from '@/components/ui/RowActions';

<RowActions>
  <RowActionButton icon="📊" label="View" onClick={handleView} />
  <RowActionButton icon="🗑️" label="Delete" variant="danger" onClick={handleDelete} />
</RowActions>
```

---

## 4) Strategy Lab Primitives

### Stepper

**Dosya:** `apps/web-next/src/components/ui/Stepper.tsx`

**Kullanım:**
```tsx
import { Stepper } from '@/components/ui/Stepper';

<Stepper
  steps={[
    { id: 'ai', label: 'AI', completed: false, active: true },
    { id: 'backtest', label: 'Backtest', completed: false, active: false, disabled: true },
  ]}
  onStepClick={(stepId) => setActiveStep(stepId)}
/>
```

**States:**
- Completed: Green circle with ✓
- Active: Blue circle
- Disabled: Gray circle

**Accessibility:**
- Keyboard: Left/Right arrow keys
- ARIA: `aria-current="step"`, `aria-disabled`

---

### StatusPill

**Dosya:** `apps/web-next/src/components/ui/StatusPill.tsx`

**Kullanım:**
```tsx
import { StatusPill } from '@/components/ui/StatusPill';

<StatusPill label="Feed" value="Healthy" tone="success" />
```

**Tones:** `success`, `warn`, `error`, `info`, `muted`

---

## 5) Strategies Primitives

### MetricRibbon

**Dosya:** `apps/web-next/src/components/ui/MetricRibbon.tsx`

**Kullanım:**
```tsx
import { MetricRibbon } from '@/components/ui/MetricRibbon';

<MetricRibbon
  items={[
    { label: '7d PnL', value: '$4,101.25', delta: { value: '+12.5%', isPositive: true } },
    { label: 'Win Rate 30d', value: '65.2%' },
  ]}
/>
```

**Kurallar:**
- Single row, flex wrap
- Tabular numbers
- Small delta indicators

---

### FilterBar

**Dosya:** `apps/web-next/src/components/ui/FilterBar.tsx`

**Kullanım:**
```tsx
import { FilterBar } from '@/components/ui/FilterBar';

<FilterBar
  chips={[
    { id: 'crypto', label: 'Crypto', active: true, onClick: () => {} },
  ]}
  searchPlaceholder="Search..."
  searchValue={search}
  onSearchChange={setSearch}
/>
```

**Kurallar:**
- Chip style: `rounded-full px-3 py-1.5 text-sm`
- Active: `bg-blue-500/20 border-blue-500/30 text-blue-300`
- Inactive: `bg-neutral-500/20 border-neutral-500/30 text-neutral-400`

---

### DenseStrategiesTable

**Dosya:** `apps/web-next/src/components/strategies/DenseStrategiesTable.tsx`

**Kullanım:**
```tsx
import DenseStrategiesTable from '@/components/strategies/DenseStrategiesTable';

<DenseStrategiesTable
  columns={['Strategy', 'Market', 'PnL', 'Status', 'Actions']}
  data={strategies}
  variant="my-strategies"
  loading={false}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Variants:** `my-strategies`, `running-strategies`

**Kurallar:**
- Row height: 40-44px
- Header height: 44-48px
- Numbers: MonoNumber
- PnL: DeltaText
- Status: Badge
- Actions: RowActions

---

## 6) State Primitives

### EmptyState

**Dosya:** `apps/web-next/src/components/ui/states/EmptyState.tsx`

**Kullanım:**
```tsx
import { EmptyState } from '@/components/ui/states';

<EmptyState
  title="No data available"
  description="Content will appear here when available"
  actionLabel="Create New"
  onAction={handleCreate}
  icon="📊"
/>
```

---

### SkeletonBlock

**Dosya:** `apps/web-next/src/components/ui/SkeletonBlock.tsx`

**Kullanım:**
```tsx
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';

<SkeletonBlock variant="table" />
```

**Variants:** `card`, `table`, `form`, `list`

---

## 7) Deterministic State Yönetimi

**Altın Kural:** Tüm mock/fixture'larda:
- Sabit Date.now() (fixture timestamp)
- Sabit random seed
- Sabit sayı formatı

**Örnek:**
```tsx
// ❌ YANLIŞ
const data = { timestamp: Date.now(), value: Math.random() };

// ✅ DOĞRU
const FIXTURE_TIMESTAMP = 1700000000000; // Sabit
const FIXTURE_DATA = [
  { timestamp: FIXTURE_TIMESTAMP, value: 42.50 },
];
```

---

## 8) Figma Parity Kuralları

1. **Shell tek otorite:** AppFrame dışında shell import yok
2. **Tek scroll:** Main content scroll, shell sabit
3. **Yatay scroll:** Sadece tablo wrapper içinde, sayfa genelinde yok
4. **Token-based:** Tüm renkler/spacing/radius tokens.css'den
5. **Deterministic:** Mock data fixture, executor kapalıyken bile aynı görünüm

---

## 9) Visual Regression

**Golden Master Test Pattern:**
```tsx
test.use({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

test('page - default state', async ({ page }) => {
  await page.goto(`${BASE_URL}/page`);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('page-default.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

**Test Coverage:**
- Dashboard, Market Data, Strategy Lab, My Strategies, Running Strategies
- Portfolio, Alerts, Audit, Settings
- Modal/popover açık state'leri
- Table overflow-x kontrolü

---

## 10) Hızlı Referans

| Primitive | Dosya | Kullanım Alanı |
|-----------|-------|----------------|
| Surface | `ui/Surface.tsx` | Panel/Card/Inset containers |
| DataTable | `ui/DataTable.tsx` | Tüm tablolar |
| StatCard | `ui/StatCard.tsx` | Dashboard metrics |
| MiniList | `ui/MiniList.tsx` | Compact lists |
| CompactTable | `ui/CompactTable.tsx` | Dense tables |
| DeltaText | `ui/DeltaText.tsx` | Price changes |
| MonoNumber | `ui/MonoNumber.tsx` | Tabular numbers |
| MetricRibbon | `ui/MetricRibbon.tsx` | Top metrics bar |
| FilterBar | `ui/FilterBar.tsx` | Filter chips + search |
| Stepper | `ui/Stepper.tsx` | Multi-step progress |
| StatusPill | `ui/StatusPill.tsx` | Small status capsules |
| DenseStrategiesTable | `strategies/DenseStrategiesTable.tsx` | Strategies tables |

---

**Son Güncelleme:** 2024-12-16
**Bakım:** UI değişikliklerinde bu dokümanı güncelle

