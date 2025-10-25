# Issue #11 — Pre-Flight Checklist

**Duration:** 10 minutes  
**Purpose:** Final checks before TypeScript Phase 1 sprint

---

## ✈️ 10-Minute Kalkış Kontrolü

### 1. Branch Hazır mı?
```bash
git status
# Should be clean or on fix/ts-phase1-recharts branch
```

### 2. Tip Hatası Bazal Ölçüm
```bash
pnpm -F web-next typecheck 2>&1 | tee evidence/ui/types-before.txt
```

**Expected:** ~45 errors baseline captured

### 3. Recharts Odak Dosyaları
Open in order:
```
apps/web-next/src/components/technical/PriceChart.tsx
apps/web-next/src/components/technical/RSIPanel.tsx
apps/web-next/src/components/common/SLOTimechart.tsx
```

---

## 🔧 Recharts "Tak-Çıkar" Şablonu

### Type Import
```typescript
import type { TimeSeriesPoint } from '@/types/chart'
```

### Data Adapter
```typescript
const data: TimeSeriesPoint[] = raw.map(d => ({
  t: d.timestamp,
  v: d.value
}))

// Or with satisfies (flexible but safe)
const chartData = raw.map(d => ({ t: d.timestamp, v: d.value })) satisfies TimeSeriesPoint[]
```

### Callbacks
```typescript
<Tooltip 
  labelFormatter={(ts: number) => new Date(ts).toLocaleString()} 
/>
```

### Rules
- ✅ Use `satisfies TimeSeriesPoint[]` for flexibility + safety
- ❌ NO `@ts-ignore`
- ✅ Use `as const` + type guard if needed temporarily

---

## 🔒 SWR + Zod Kilidi

### Pattern
```typescript
import { EngineHealthSchema } from '@/schema/api'

const { data } = useSWR<unknown>(
  '/api/public/engine-health',
  fetchJson,
  { refreshInterval: 10_000 }
)

const parsed = data ? EngineHealthSchema.safeParse(data) : null
const ok = !!parsed?.success && parsed.data.running

return { ok, data: parsed?.success ? parsed.data : null, error: ... }
```

### Hook Return
```typescript
// Hook returns
return {
  ok: boolean,      // Safe to use
  data: T | null,   // Only if ok === true
  error: Error | null
}
```

### UI Usage
```typescript
const { ok, data } = useEngineHealth()

// Status dot: only green if ok
<StatusDot ok={ok} />

// Data: only if ok
{ok && data && <span>Running: {data.running}</span>}
```

---

## 🧪 Smoke Assertion (EB Eşiği)

### Error Budget Threshold
```typescript
// tests/health.smoke.ts
import { ErrorBudgetSchema } from '@/schema/api'

test('Error budget meets threshold', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:3003/api/public/error-budget')
  const json = await response.json()
  
  const ebParsed = ErrorBudgetSchema.safeParse(json)
  
  expect(ebParsed.success).toBe(true)
  expect(ebParsed.data.errorBudget).toBeGreaterThanOrEqual(0.95)
})
```

---

## ✅ Kapanış Doğrulaması

### TypeScript
```bash
pnpm -F web-next typecheck
# Target: 0 errors in phase scope (Recharts files)
```

### Build
```bash
pnpm -F web-next build
# Expected: Success
```

### Tests
```bash
pnpm -F web-next test
# Expected: Smoke tests pass
```

### Delta Raporu
```bash
tsx scripts/type-delta.ts after
cat evidence/ui/types-delta.md
```

**Expected Output:**
```
Baseline errors: 45
Current errors: ≤30
✅ Progress: 15+ errors fixed!
```

---

## 📦 PR Paketine Eklenecekler

### Evidence
- [ ] `evidence/ui/types-before.txt` (baseline)
- [ ] `evidence/ui/types-delta.md` (generated)

### PR Description
```markdown
## Summary
TypeScript strict cleanup — Phase 1 (Recharts + SWR/Zod + Smoke assertions)

## Changes
- ✅ Recharts: Central types + adapter pattern
- ✅ SWR: Zod `safeParse` + `ok/data/error` flow
- ✅ Smoke: Schema assertions + EB≥0.95 threshold

## UX-ACK
UX-ACK: ✅ Type safety enhanced, no behavior changes.
```

---

## 🛡️ Risk Devre Dışı Kalkanlar

### Branch Protection
- ✅ Guard Validate active
- ✅ Fork guards on secret-using workflows
- ✅ UX-ACK gate enforced

### Environment
- ⚠️ Mock/Real mode: Don't mix!
- ✅ If no real backend: `.env.local` has NO `ENGINE_URL` / `PROMETHEUS_URL`
- ✅ Restart Next.js after `.env.local` changes

### Common Pitfalls
```bash
# ❌ Don't do this
ENGINE_URL=              # Empty string still triggers proxy mode!

# ✅ Do this (completely remove or comment out)
# ENGINE_URL=http://...
```

---

## 🚀 Sonraki Genişleme Koridorları

### Phase 2: Store Selectors
- `noUncheckedIndexedAccess` → explicit return types
- Market store selectors with type guards
- Portfolio calculations with safe defaults

### Phase 3: Data Flow
- `/market-data` placeholder → minimal real data
- `/backtest` historical data integration
- WebSocket message type validation

---

## 📋 Final Checklist

Before takeoff:
- [ ] Branch: `fix/ts-phase1-recharts`
- [ ] Baseline: `evidence/ui/types-before.txt` created
- [ ] Focus files: Recharts components open
- [ ] Mock mode: `.env.local` has NO backend URLs
- [ ] Servers: `pnpm ws:dev` + `pnpm dev` running
- [ ] Dashboard: http://127.0.0.1:3003/dashboard loads

After landing:
- [ ] TypeScript: 0 errors in phase scope
- [ ] Build: Success
- [ ] Tests: Pass
- [ ] Delta: Generated in `evidence/ui/`
- [ ] PR: Created with UX-ACK block

---

## 🎯 Ready Status

**Checklist:** ✅ Complete  
**Tools:** ✅ Ready  
**Schemas:** ✅ Prepared  
**Tests:** ✅ Written  
**Environment:** ✅ Clean

**Pist senin — gazla!** 🚀

---

*Created: 2025-10-25*  
*Target: Phase 1 complete in 90-120 min*  
*Quality: Zero errors, zero regressions*

