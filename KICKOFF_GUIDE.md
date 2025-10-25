# Issue #11 Kickoff Guide — TypeScript Cleanup Sprint

**Target:** Zero TypeScript errors in web-next  
**Duration:** 2-4 hours  
**Status:** Ready to start

---

## 🚦 Pre-Flight Checklist

### 1. Baseline Measurement

```bash
cd apps/web-next

# Capture current error state
pnpm typecheck 2>&1 | tee ../../evidence/ui/types-before.txt

# Count errors
grep -c "Type error" ../../evidence/ui/types-before.txt
# Expected: ~15-20 errors
```

### 2. Verify Development Environment

```bash
# Terminal 1: WebSocket server
pnpm ws:dev
# Should see: [dev-ws] listening on ws://127.0.0.1:4001

# Terminal 2: Next.js dev server
pnpm dev
# Should see: Ready on http://localhost:3003

# Terminal 3: Smoke test
pnpm test -- --reporter=dot
# Should pass (or skip if not configured)
```

### 3. Branch Setup

```bash
cd ../..  # Back to repo root
git checkout main
git pull
git checkout -b fix/typescript-cleanup-phase1
```

---

## 🧱 Implementation Order

### Phase 1: Type Foundation (30min)

**Create centralized type definitions:**

1. ✅ `apps/web-next/src/types/chart.ts` (already created)
2. ✅ `apps/web-next/src/schema/api.ts` (already created)
3. ✅ `apps/web-next/src/schema/guards.ts` (already created)

**Files created in this session:**
- Type infrastructure ready ✅
- Schema validation ready ✅
- Guards utility ready ✅

### Phase 2: Recharts Type Safety (1h)

**Pattern:**
```typescript
// Before: implicit any
<LineChart data={data}>
  <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleString()} />
</LineChart>

// After: explicit types
import type { TimeSeriesPoint } from '@/types/chart';

const chartData: TimeSeriesPoint[] = data.map(d => ({
  timestamp: d.timestamp,
  value: d.value
}));

<LineChart data={chartData}>
  <Tooltip labelFormatter={(ts: number) => new Date(ts).toLocaleString()} />
</LineChart>
```

**Files to fix:**
1. `components/common/SLOTimechart.tsx` (partial ✅)
2. `components/technical/PriceChart.tsx`
3. `components/technical/RSIPanel.tsx`
4. `components/technical/VolumeProfile.tsx`
5. `components/technical/MACDPanel.tsx` (partial ✅)

**Steps per file:**
1. Import chart types from `@/types/chart`
2. Define data transformation function
3. Apply type to `data` prop
4. Add explicit types to callbacks
5. Remove `@ts-ignore` comments

### Phase 3: Store Selectors (30min)

**Pattern:**
```typescript
// Before: inferred any
const status = useMarketStore(s => s.status);

// After: explicit type
import type { MarketStatus } from '@/schema/api';

const status = useMarketStore(s => s.status) as MarketStatus;

// OR: Create typed selector
const selectStatus = (s: MarketState): MarketStatus => s.status;
const status = useMarketStore(selectStatus);
```

**Files to fix:**
1. All `app/**/page.tsx` files using stores
2. `components/dashboard/*.tsx`
3. `hooks/useEngineHealth.ts`
4. `hooks/useHeartbeat.ts`

### Phase 4: SWR + Zod (1h)

**Pattern:**
```typescript
// Before: unsafe
const { data } = useSWR('/api/endpoint', fetcher);

// After: schema validated
import { EngineHealthSchema, type EngineHealth } from '@/schema/api';

export function useEngineHealth() {
  const { data, error } = useSWR<unknown>(
    '/api/public/engine-health',
    fetchJson,
    { refreshInterval: 10000 }
  );
  
  // Runtime validation
  const validated = data ? EngineHealthSchema.safeParse(data) : null;
  
  return {
    ok: validated?.success === true && validated.data.running && !error,
    data: validated?.success ? validated.data : null,
    error: error || (validated?.success === false ? validated.error : null)
  };
}
```

**Files to update:**
1. `hooks/useEngineHealth.ts`
2. `hooks/useHeartbeat.ts`
3. `hooks/useWsHeartbeat.ts` (if applicable)

### Phase 5: UI Smoke Enhancement (30min)

**Add schema validation to smoke tests:**

```typescript
// tests/health.smoke.ts
import { ErrorBudgetSchema, EngineHealthSchema } from '@/schema/api';

async function testHealthEndpoints() {
  const ebRes = await fetch('http://127.0.0.1:3003/api/public/error-budget');
  const ebData = await ebRes.json();
  
  // Schema validation
  const ebParsed = ErrorBudgetSchema.safeParse(ebData);
  assert(ebParsed.success, 'Error budget schema invalid');
  assert(ebParsed.data.errorBudget >= 0.95, 'Error budget below 95% threshold');
  
  // ... similar for engine health
}
```

---

## ✅ Definition of Done

**TypeScript:**
- [ ] `pnpm -F web-next typecheck` → **0 errors** (warnings OK)
- [ ] No `@ts-ignore` in recharts components
- [ ] No `@ts-ignore` in store selectors
- [ ] All API responses validated with Zod

**Tests:**
- [ ] `pnpm -F web-next build` → **success**
- [ ] `pnpm -F web-next test` → **all pass**
- [ ] UI Smoke CI job → **green**

**Documentation:**
- [ ] Type delta report generated
- [ ] PR description complete
- [ ] No runtime behavior changes

---

## 🔬 Validation Commands

### During Development

```bash
# Continuous type checking (in watch mode)
pnpm -F web-next typecheck --watch

# Build verification
pnpm -F web-next build

# Smoke test
pnpm -F web-next test -- --reporter=dot
```

### Before Commit

```bash
# Capture final error state
pnpm -F web-next typecheck 2>&1 | tee evidence/ui/types-after.txt

# Generate delta report
tsx scripts/type-delta.ts report

# Review delta
cat evidence/ui/types-delta.md
```

---

## 📋 PR Template (Copy-Paste Ready)

```markdown
## Summary

TypeScript strict mode cleanup — Phase 1 (Recharts, Stores, SWR+Zod)

Fixes #11

## Changes

### Type Infrastructure
- ✅ `types/chart.ts`: Centralized chart type definitions
- ✅ `schema/api.ts`: Zod schemas for API responses
- ✅ `schema/guards.ts`: Runtime type guards

### Component Fixes
- `components/technical/PriceChart.tsx`: Recharts generics
- `components/technical/RSIPanel.tsx`: Explicit types
- `components/technical/VolumeProfile.tsx`: Data typing
- `components/common/SLOTimechart.tsx`: Callback types

### Store Selectors
- Explicit return types for all market store selectors
- Type-safe status checks

### API Integration
- `hooks/useEngineHealth.ts`: Zod validation
- `hooks/useHeartbeat.ts`: Schema validation
- Safe fallbacks on parse failures

## Validation

**Before:**
```
Type errors: 18
Files affected: 8
```

**After:**
```
Type errors: 0 ✅
Files affected: 0
```

**Delta:** -18 errors (100% reduction)

See: `evidence/ui/types-delta.md`

## Testing

```bash
pnpm -F web-next typecheck  # ✅ 0 errors
pnpm -F web-next build      # ✅ success
pnpm -F web-next test       # ✅ all pass
```

## Runtime Verification

- [x] Mock mode: All status dots green
- [x] Real backend mode: All status dots green
- [x] No console errors in dev
- [x] All routes render correctly

## Risk & Rollback

**Risk:** Low — Type-only changes, no runtime behavior modification

**Rollback:** `git revert <commit-sha>`

## UX-ACK

UX-ACK: ✅ I reviewed the changes; type safety improvements only; no runtime impact.

## Notes

- Recharts type issues resolved with explicit generics
- All API responses now validated at runtime with Zod
- Store selectors have explicit return types
- No `@ts-ignore` comments remaining
```

---

## 🧭 Code Guidelines

### Type Centralization

**DO:**
- Define types in `types/` or `schema/`
- Import from centralized locations
- Use single source of truth

**DON'T:**
- Inline type definitions in components
- Duplicate type definitions
- Use `any` without justification

### Adapter Pattern

**DO:**
```typescript
// adapters/metrics.ts
import type { TimeSeriesPoint } from '@/types/chart';

export function prometheusToChart(data: unknown): TimeSeriesPoint[] {
  // Transform external data to typed chart data
}
```

**DON'T:**
```typescript
// Component file
const chartData = rawData.map((d: any) => ({ ... })); // ❌
```

### Null Safety

**DO:**
```typescript
// With noUncheckedIndexedAccess
const item = array[0];
if (item) {
  // Use item safely
}

// Or with optional chaining
const value = array[0]?.property ?? defaultValue;
```

**DON'T:**
```typescript
const item = array[0]; // Might be undefined
item.property; // ❌ Unsafe
```

---

## 📈 Progress Tracking

### Metrics to Monitor

1. **TypeScript Errors**
   - Before: ~18 errors (baseline)
   - Target: 0 errors
   - Track: `evidence/ui/types-delta.md`

2. **Code Coverage (Type Safety)**
   - `@ts-ignore` count: Target 0
   - Explicit types: Target 100%

3. **UI Smoke Results**
   - Duration: Track for regressions
   - Success rate: 100% target
   - Schema validation: All endpoints

### Delta Tracking Script

```bash
# Initial baseline (done)
pnpm -F web-next typecheck 2>&1 | tsx scripts/type-delta.ts before

# After changes
pnpm -F web-next typecheck 2>&1 | tsx scripts/type-delta.ts after

# View report
cat evidence/ui/types-delta.md
```

---

## 🛡️ Governance Checklist

### PR Requirements

- [ ] UX-ACK block in PR description
- [ ] Definition of Done items checked
- [ ] Type delta report attached
- [ ] No runtime behavior changes
- [ ] All tests passing

### CI Expectations

**Will run:**
- ✅ Guard Validate (required)
- ✅ UX-ACK (required)
- ✅ UI Smoke (path-scoped)

**Will skip:**
- ⏭️ Contract/Chaos (path guard)
- ⏭️ Headers Smoke (path guard)
- ⏭️ Main CI Verify (path guard)

**Result:** Fast feedback (2-3 minutes)

---

## 🧰 Helper Scripts

### 1. Type Delta Calculator

```bash
# Track progress
tsx scripts/type-delta.ts report
```

**Output:** `evidence/ui/types-delta.md`

### 2. Quick Type Check

```bash
# One-liner for continuous feedback
watch -n 5 'pnpm -F web-next typecheck 2>&1 | tail -20'
```

### 3. Schema Test

```bash
# Test Zod schemas in isolation
tsx -e "
import { EngineHealthSchema } from './apps/web-next/src/schema/api';
const test = { status: 'OK', running: true, updatedAt: new Date().toISOString() };
console.log(EngineHealthSchema.parse(test));
"
```

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Setup
git checkout -b fix/typescript-cleanup-phase1
cd apps/web-next

# 2. Baseline
pnpm typecheck 2>&1 | tee ../../evidence/ui/types-before.txt

# 3. Fix files (use patterns from Phase 2-4 above)
# ... make changes ...

# 4. Validate
pnpm typecheck  # Should be 0 errors
pnpm build      # Should succeed

# 5. Delta
cd ../..
pnpm -F web-next typecheck 2>&1 | tsx scripts/type-delta.ts after

# 6. PR
git add -A
git commit -m "fix(ui): TypeScript strict mode cleanup - Phase 1"
git push -u origin fix/typescript-cleanup-phase1
gh pr create --title "fix(ui): TypeScript strict mode cleanup" --body "$(cat KICKOFF_GUIDE.md | grep -A 50 '## PR Template')"
```

---

**🎯 Ready to start! All infrastructure in place, clear path to zero errors.**

*Created: 2025-10-25*  
*Tools: Ready ✅*  
*Baseline: Captured ✅*  
*Next: Fix components following Phase 2-4*

