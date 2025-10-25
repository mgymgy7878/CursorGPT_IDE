# Issue #11 — TypeScript Zero-Error Sprint

**Goal:** Zero TypeScript errors in web-next  
**Baseline:** 45 errors  
**Target:** 0 errors  
**Duration:** 90-120 minutes (Phase 1)

---

## 🚀 Kickoff — Tak-Çıkar Mini Plan

### 1) Branch & Baseline (5 min)

```bash
git checkout -b fix/ts-phase1-recharts
pnpm -F web-next typecheck 2>&1 | tee evidence/ui/types-before.txt
```

**Output:** Baseline error count captured

---

### 2) Recharts Tipleri (Phase 1) — 40 min

**Target Files:**
- `src/components/charts/*`
- `src/types/chart.ts`
- Any component using Recharts

**Actions:**
- ✅ Import types from `src/types/chart.ts`
- ✅ Create adapter for chart data → `TimeSeriesPoint[]`
- ✅ Add explicit types to callbacks (`Tooltip`, `labelFormatter`)
- ✅ Remove `@ts-ignore` → Use `satisfies` if needed

**Example Adapter:**
```typescript
// src/lib/chart-adapter.ts
import type { TimeSeriesPoint } from '@/types/chart'

export function toTimeSeries(data: unknown[]): TimeSeriesPoint[] {
  return data.map(item => ({
    timestamp: item.timestamp,
    value: item.value,
    // ... other fields
  }))
}
```

**Example Component:**
```typescript
import { toTimeSeries } from '@/lib/chart-adapter'

const chartData = toTimeSeries(rawData) satisfies TimeSeriesPoint[]

<LineChart data={chartData}>
  <Tooltip 
    labelFormatter={(value: number) => new Date(value).toLocaleString()}
  />
</LineChart>
```

---

### 3) SWR + Zod (Phase 2) — 30 min

**Target Files:**
- `src/hooks/useEngineHealth.ts`
- `src/hooks/useHeartbeat.ts`
- `src/schema/api.ts`

**Actions:**
- ✅ Apply `Schema.safeParse` in SWR hooks
- ✅ Return `ok/data/error` structure
- ✅ UI checks `ok` before rendering green

**Example Hook:**
```typescript
// src/hooks/useEngineHealth.ts
import useSWR from 'swr'
import { EngineHealthSchema } from '@/schema/api'
import { fetchJson } from '@/lib/health'

export function useEngineHealth() {
  const { data, error, isLoading } = useSWR(
    '/api/public/engine-health',
    fetchJson,
    { refreshInterval: 10000 }
  )
  
  const parsed = data ? EngineHealthSchema.safeParse(data) : null
  
  return {
    ok: parsed?.success ?? false,
    data: parsed?.success ? parsed.data : null,
    error: error || (parsed?.success === false ? parsed.error : null),
    isLoading
  }
}
```

**UI Usage:**
```typescript
const { ok, data } = useEngineHealth()

<StatusDot ok={ok} />
{ok && data && <span>EB {(data.errorBudget * 100).toFixed(0)}%</span>}
```

---

### 4) Smoke + Assertions (Phase 3) — 20 min

**Target Files:**
- `tests/health.smoke.ts` (create if needed)
- `apps/web-next/package.json` (add test script)

**Actions:**
- ✅ Zod schema validation in smoke tests
- ✅ Error Budget threshold: EB ≥ 0.95
- ✅ WS connection test (3s timeout)

**Example Smoke Test:**
```typescript
// tests/health.smoke.ts
import { test, expect } from '@playwright/test'
import { EngineHealthSchema, ErrorBudgetSchema } from '@/schema/api'

test('Engine health returns valid schema', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:3003/api/public/engine-health')
  const json = await response.json()
  
  const result = EngineHealthSchema.safeParse(json)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.status).toBe('OK')
  }
})

test('Error budget meets threshold', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:3003/api/public/error-budget')
  const json = await response.json()
  
  const result = ErrorBudgetSchema.safeParse(json)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.errorBudget).toBeGreaterThanOrEqual(0.95)
  }
})

test('WebSocket connects', async ({ page }) => {
  let connected = false
  page.on('websocket', ws => {
    ws.on('open', () => { connected = true })
  })
  
  await page.goto('http://127.0.0.1:3003/dashboard')
  await page.waitForTimeout(3000)
  
  expect(connected).toBe(true)
})
```

---

### 5) Doğrulama (10 min)

```bash
# TypeScript check
pnpm -F web-next typecheck   # Target: 0 errors in phase scope

# Build
pnpm -F web-next build       # Success

# Tests
pnpm -F web-next test        # All pass
```

---

### 6) Delta Raporu (5 min)

```bash
# Generate delta
tsx scripts/type-delta.ts after

# Review
cat evidence/ui/types-delta.md
```

**Expected Output:**
```
Baseline errors: 45
Current errors: 30 (or less)
✅ Progress: 15+ errors fixed!
```

---

## ✅ Definition of Done (Phase 1)

- [ ] Recharts files: **0 TypeScript errors**
- [ ] No `@ts-ignore` comments (use `satisfies` if needed)
- [ ] SWR hooks: Zod `safeParse` + `ok/data/error` pattern
- [ ] Smoke tests: Schema assertions pass
- [ ] Error Budget: EB ≥ 0.95 assertion
- [ ] Build: Success
- [ ] Delta report: Generated in `evidence/ui/`

---

## 📝 PR Template (Copy-Paste)

```markdown
## Summary
TypeScript strict cleanup — Phase 1 (Recharts + SWR/Zod + Smoke assertions)

Fixes #11

## Changes
- ✅ Central chart types + adapter pattern
- ✅ SWR hooks with Zod `safeParse` + `ok/data/error` flow
- ✅ Smoke tests with schema validation + EB≥0.95 threshold
- ✅ Removed all `@ts-ignore` in Recharts components

## Validation
- `pnpm -F web-next typecheck` → 0 errors (in phase scope)
- `pnpm -F web-next build` → Success
- `pnpm -F web-next test` → All pass
- Delta: `evidence/ui/types-delta.md`

## Testing
- [x] Manual: Dashboard loads, status dots green
- [x] Smoke: Schema assertions pass
- [x] Build: Production build successful

## UX-ACK
UX-ACK: ✅ Type safety enhanced, no behavior changes. Runtime validation added.

## Checklist
- [x] Code follows project style
- [x] Tests pass
- [x] Documentation updated (types-delta.md)
- [x] No new warnings introduced
```

---

## 🧠 Micro Tips

### noUncheckedIndexedAccess
```typescript
// ❌ Before
const item = array[0]  // Type: Item | undefined (strict mode)
item.value            // Error: Object is possibly undefined

// ✅ After
const item = array[0]
const value = item?.value ?? defaultValue
```

### Recharts Generics
```typescript
// Pragmatic & Safe
const chartData = toTimeSeries(rawData) satisfies TimeSeriesPoint[]

// Or explicit type
const chartData: TimeSeriesPoint[] = toTimeSeries(rawData)
```

### Type Guards
```typescript
// src/schema/guards.ts
import { ChartPoint } from '@/types/chart'

export function isChartPoint(value: unknown): value is ChartPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'timestamp' in value &&
    typeof value.timestamp === 'number'
  )
}

// Usage
if (isChartPoint(data)) {
  // data is ChartPoint here
  return data.timestamp
}
```

### Zod Transform
```typescript
// For complex API responses
const ApiResponseSchema = z.object({
  timestamp: z.string().transform(s => new Date(s).getTime()),
  value: z.number()
})

// Inferred type is clean
type ApiResponse = z.infer<typeof ApiResponseSchema>
// { timestamp: number, value: number }
```

---

## 📊 Progress Tracking

### Baseline (Before)
```
Total errors: 45
- Recharts: ~15 errors
- SWR hooks: ~8 errors
- Component props: ~12 errors
- Type guards: ~5 errors
- Misc: ~5 errors
```

### Phase 1 Target (After)
```
Total errors: ≤30
- Recharts: 0 errors ✅
- SWR hooks: 0 errors ✅
- Component props: ~12 errors (next phase)
- Type guards: ~3 errors (next phase)
- Misc: ~5 errors (next phase)
```

---

## 🔄 Next Phases (Preview)

### Phase 2: Component Props (30-40 min)
- Add explicit prop types
- Remove `any` from component interfaces
- Add JSDoc for complex props

### Phase 3: Type Guards (20-30 min)
- Create guards in `schema/guards.ts`
- Replace runtime checks with type guards
- Add assertions where needed

### Phase 4: Final Cleanup (20-30 min)
- Fix remaining misc errors
- Remove all temporary `satisfies`
- Add strict mode to tsconfig if not already

---

## 🚀 Ready to Launch

**Kokpit hazır!** 🛫

**Commands:**
```bash
# 1. Branch
git checkout -b fix/ts-phase1-recharts

# 2. Baseline
pnpm -F web-next typecheck 2>&1 | tee evidence/ui/types-before.txt

# 3. Code (90 min)
# - Recharts types
# - SWR + Zod
# - Smoke assertions

# 4. Validate
pnpm -F web-next typecheck
pnpm -F web-next build
pnpm -F web-next test

# 5. Delta
tsx scripts/type-delta.ts after

# 6. PR
# Use template above
```

**Throttle açık — direkt kalkış!** 🚀

---

*Created: 2025-10-25*  
*Duration: 90-120 min*  
*Goal: Zero errors in Recharts + SWR*

