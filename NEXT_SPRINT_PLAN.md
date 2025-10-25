# Next Sprint Plan — TypeScript Cleanup & UI Hardening

**Created:** 2025-10-25  
**Target:** Issue #11 + UI Smoke enhancements  
**Duration:** 1-2 sprint cycles (2-4 hours total)

---

## 🚦 Sprint Priorities

### 1. Issue #11 — TypeScript Cleanup (Primary)

**Goal:** Zero `tsc` errors, minimal `@ts-ignore`, type-safe recharts + stores

#### Task Breakdown

**A. Recharts Type Safety (1h)**

```typescript
// Before: implicit any in recharts callbacks
<LineChart data={data}>
  <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleString()} />
</LineChart>

// After: explicit generics
type DataPoint = { timestamp: number; value: number };
<LineChart data={data as DataPoint[]}>
  <Tooltip labelFormatter={(ts: number) => new Date(ts).toLocaleString()} />
</LineChart>
```

**Files to fix:**
- `components/common/SLOTimechart.tsx` (partial ✅)
- `components/technical/PriceChart.tsx`
- `components/technical/RSIPanel.tsx`
- `components/technical/VolumeProfile.tsx`

**Pattern:**
```typescript
// Define chart data types
type ChartDataPoint = {
  timestamp: number;
  [key: string]: number | string;
};

// Use in components
const data: ChartDataPoint[] = transformedData;
```

**B. Store Selector Types (30min)**

```typescript
// Before: inferred any
const status = useMarketStore(s => s.status);

// After: explicit return type
const status = useMarketStore(s => s.status as 'idle' | 'healthy' | 'degraded' | 'down');

// OR: Add selector with explicit return
const selectStatus = (s: MarketState): ConnectionStatus => s.status;
const status = useMarketStore(selectStatus);
```

**Files:**
- All store usage in `app/**/page.tsx`
- `components/dashboard/*.tsx`
- `hooks/useWsHeartbeat.ts` ✅
- `hooks/useEngineHealth.ts`

**C. SWR + Zod Validation (1h)**

```typescript
// Before: unsafe data access
const { data } = useSWR('/api/endpoint', fetcher);
console.log(data.field); // any

// After: Zod schema validation
import { z } from 'zod';

const EngineHealthSchema = z.object({
  status: z.enum(['OK', 'ERROR']),
  running: z.boolean(),
  updatedAt: z.string(),
  source: z.enum(['mock', 'real']).optional()
});

type EngineHealth = z.infer<typeof EngineHealthSchema>;

export function useEngineHealth() {
  const { data, error } = useSWR<EngineHealth>(
    '/api/public/engine-health',
    fetchJson,
    { refreshInterval: 10000 }
  );
  
  // Runtime validation
  const validated = data ? EngineHealthSchema.safeParse(data) : null;
  
  return {
    ok: !!validated?.success && validated.data.running && !error,
    data: validated?.success ? validated.data : null,
    error: error || (validated?.success === false ? validated.error : null)
  };
}
```

**Files:**
- `hooks/useEngineHealth.ts`
- `hooks/useHeartbeat.ts`
- API route types in `app/api/**/route.ts`

**D. tsconfig Progressive Strictness (30min)**

```json
// Current: permissive
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true
  }
}

// Phase 1: Add gradually
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}

// Phase 2 (later): Full strict
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": false,
    "noUncheckedIndexedAccess": true
  }
}
```

**Strategy:**
- Start with `noUncheckedIndexedAccess`
- Fix resulting errors (array access safety)
- Add `exactOptionalPropertyTypes` next
- Keep `skipLibCheck: true` for now (recharts dependencies)

---

### 2. UI Smoke Enhancement (30min)

**A. Schema Validation in Tests**

```typescript
// tests/health.smoke.ts
import { z } from 'zod';

const ErrorBudgetSchema = z.object({
  status: z.literal('OK'),
  errorBudget: z.number().min(0).max(1),
  updatedAt: z.string(),
  source: z.enum(['prometheus', 'mock'])
});

const EngineHealthSchema = z.object({
  status: z.literal('OK'),
  running: z.boolean(),
  updatedAt: z.string(),
  source: z.enum(['mock', 'real'])
});

async function testHealthEndpoints() {
  const ebRes = await fetch('http://127.0.0.1:3003/api/public/error-budget');
  const ebData = await ebRes.json();
  
  // Schema validation
  const ebParsed = ErrorBudgetSchema.safeParse(ebData);
  assert(ebParsed.success, 'Error budget schema invalid');
  assert(ebParsed.data.errorBudget >= 0.95, 'Error budget below threshold');
  
  const engineRes = await fetch('http://127.0.0.1:3003/api/public/engine-health');
  const engineData = await engineRes.json();
  
  const engineParsed = EngineHealthSchema.safeParse(engineData);
  assert(engineParsed.success, 'Engine health schema invalid');
  
  console.log('✅ All health endpoints valid');
}
```

**B. WS Status Check**

```typescript
// Add to smoke test
async function testWsConnection() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:4001';
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WS connection timeout'));
    }, 3000);
    
    ws.onopen = () => {
      clearTimeout(timeout);
      ws.close();
      resolve('✅ WS connection OK');
    };
    
    ws.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
  });
}
```

**C. CI Integration**

```yaml
# .github/workflows/ui-smoke.yml
- name: Run health smoke tests
  run: |
    cd apps/web-next
    pnpm test:smoke
  env:
    NEXT_PUBLIC_WS_URL: ws://127.0.0.1:4001
    CI: true
```

---

### 3. Documentation Updates (20min)

**A. apps/web-next/README.md Enhancement**

```markdown
## Backend Integration Toggle

### Mock Mode (Default)
No backend required. All endpoints return mock data.

```bash
# .env.local (or don't create it)
# Mock mode active by default
pnpm dev
# Status dots: API ✅, WS ⚠️, Engine ✅ (all mock)
```

### Real Backend Mode

1. **Start backend services:**
   ```bash
   # Terminal 1: Executor (WebSocket)
   pnpm --filter @spark/executor dev
   # Listening on ws://127.0.0.1:4001

   # Terminal 2: Strategy Engine (HTTP)
   pnpm --filter @spark/engine dev
   # Listening on http://127.0.0.1:3001
   ```

2. **Configure environment:**
   ```bash
   # .env.local
   ENGINE_URL=http://127.0.0.1:3001
   PROMETHEUS_URL=http://localhost:9090  # if available
   ```

3. **Start UI:**
   ```bash
   pnpm dev
   # Status dots: API ✅, WS ✅, Engine ✅ (all real)
   ```

4. **Verify:**
   ```bash
   curl http://localhost:3003/api/public/engine-health
   # { "status": "OK", "running": true, "source": "real" }
   ```

### Hybrid Mode
Mix real and mock by setting only specific ENV vars.
```

**B. .env.example Enhancement**

```bash
# Spark Trading Platform — Environment Variables
# Copy to .env.local and customize

# ============================================
# Frontend URLs (Required for UI)
# ============================================

# API endpoint for frontend requests
# Default: http://127.0.0.1:3001
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001

# WebSocket endpoint for real-time data
# Default: ws://127.0.0.1:4001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001

# Guard Validate workflow badge URL
# Default: GitHub Actions workflow URL
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml

# ============================================
# Backend Integration (Optional)
# ============================================

# Strategy Engine health endpoint
# If set: UI proxies to real engine
# If unset: UI returns mock health data
# Example: http://127.0.0.1:3001
ENGINE_URL=

# Prometheus server for error budget metrics
# If set: UI queries real Prometheus
# If unset: UI returns mock error budget (98%)
# Example: http://localhost:9090
PROMETHEUS_URL=

# ============================================
# Feature Flags (Optional)
# ============================================

# Use manual WS ping test instead of market store status
# Default: false (use market store)
NEXT_PUBLIC_USE_WS_PING_TEST=false

# ============================================
# Development (Optional)
# ============================================

# Node.js memory limit for Next.js build
# Default: Node default
# Example for large builds: --max-old-space-size=4096
NODE_OPTIONS=
```

---

## ✅ Definition of Done — Issue #11

### Success Criteria

**TypeScript:**
- [ ] `pnpm -F web-next typecheck` → **0 errors** (warnings acceptable)
- [ ] No `@ts-ignore` in recharts usage (replaced with proper generics)
- [ ] No `@ts-ignore` in store selectors (replaced with explicit types)
- [ ] All API responses validated with Zod schemas

**Tests:**
- [ ] `pnpm -F web-next build` → **success**
- [ ] `pnpm -F web-next test:smoke` → **all pass** (local)
- [ ] UI Smoke CI job → **green**

**Documentation:**
- [ ] README backend toggle section added
- [ ] .env.example has per-variable descriptions
- [ ] Type patterns documented (optional)

**Runtime:**
- [ ] No new console errors in dev mode
- [ ] Status dots functional (mock + real modes)
- [ ] All routes render without crash

### Non-Goals (Out of Scope)

- ❌ Upgrading recharts version
- ❌ Refactoring chart components
- ❌ Performance optimization
- ❌ E2E test coverage expansion

---

## 🧪 Quick Health Check Commands

```bash
# Development
pnpm -F web-next dev           # http://localhost:3003
pnpm -F web-next ws:dev        # ws://127.0.0.1:4001

# Type & Build
pnpm -F web-next typecheck     # Should be 0 errors after fix
pnpm -F web-next build         # Should succeed

# Smoke
pnpm -F web-next test:smoke    # Health endpoint validation
# OR
pnpm -F web-next test          # If test:smoke not defined

# CI Validation (local)
.github/scripts/validate-workflow-guards.ps1
```

---

## 🛡️ Governance Reminders

### Branch Protection (Active)

**Required Checks:**
- Guard Validate (workflow fork guards)
- UX-ACK (PR description approval)

**NOT Required:**
- Build check (informational only)
- Type check (will be informational)

### Path Guards (Active)

**UI-only PRs trigger:**
- Guard Validate ✅
- UX-ACK ✅
- UI Smoke ✅

**UI-only PRs skip:**
- Contract/Chaos tests (paths guard)
- Headers smoke (paths guard)
- Main CI verify (paths guard)

**Keep this working!** Path filters reduce CI time by 77%.

### Demo PR #4

**Status:** Permanent (DO NOT MERGE)  
**Purpose:** Proof that guard validator catches missing guards  
**Action:** Keep open indefinitely with `do-not-merge` label

---

## 🧯 Rollback Plan

### If TypeScript Strictness Breaks Build

```bash
# Option A: Revert specific commit
git revert <commit-hash>
git push

# Option B: Revert tsconfig change only
git checkout HEAD~1 -- apps/web-next/tsconfig.json
git commit -m "revert(ts): rollback strict config"
git push
```

**Then:** Create sub-issue for broken area

### If UI Smoke Becomes Flaky

**Short-term fix:**
```yaml
# .github/workflows/ui-smoke.yml
- name: Run smoke tests
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: pnpm -F web-next test:smoke
```

**Long-term:** Investigate root cause in separate issue

---

## 📋 PR Template Suggestion (Issue #11)

```markdown
## Summary
Resolves TypeScript strict mode violations in web-next components.

Fixes #11

## Changes

### TypeScript Fixes
- [ ] Recharts type generics added (PriceChart, RSIPanel, etc.)
- [ ] Store selectors with explicit return types
- [ ] SWR + Zod validation for API responses
- [ ] tsconfig: `noUncheckedIndexedAccess: true`

### UI Smoke Enhancements
- [ ] Schema validation in health smoke tests
- [ ] WS connection check added
- [ ] Error budget threshold assertion (≥95%)

### Documentation
- [ ] README backend toggle section
- [ ] .env.example per-variable descriptions

## Testing

**Local:**
```bash
pnpm -F web-next typecheck  # 0 errors ✅
pnpm -F web-next build      # success ✅
pnpm -F web-next test:smoke # all pass ✅
```

**CI:** UI Smoke workflow green

## Runtime Verification

- [ ] Mock mode: All status dots green
- [ ] Real backend mode: All status dots green (with services running)
- [ ] No console errors in dev
- [ ] All routes render

## UX-ACK

UX-ACK: ✅ I reviewed the changes; type safety improvements only; no runtime impact.

## Test Summary

- TypeScript: 0 errors (was ~15-20)
- Build: Success
- Smoke: All pass
- Runtime: No new errors
```

---

## 🎯 Sprint Success Metrics

**Time Investment:** 2-4 hours total
- TypeScript fixes: 2.5h
- UI smoke: 0.5h
- Docs: 0.5h
- Testing/validation: 0.5h

**Value Delivered:**
- Type safety: ↑↑
- Developer experience: ↑
- CI confidence: ↑
- Documentation: ✅

**Risk:** Minimal (no runtime changes)

---

**🚀 Ready for next sprint! Issue #11 fully scoped and actionable.**

*Created: 2025-10-25*  
*Owner: Next developer*  
*Context: All in this file + Issue #11*

