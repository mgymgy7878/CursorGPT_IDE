# Gate C + Gate D: Technical Debt & Risk Assessment

Date: 2026-01-07
Status: DOCUMENTED (Non-blocking)

## A) Zustand Store Limitations

### Current State
- `useLiveSessionStore` is created using `zustand` in `apps/web-next/src/lib/live-react/useLiveSession.ts`
- Store is **client-only** (React hook, no SSR usage)
- No explicit "use client" directive (Next.js 14 App Router auto-detects)

### Risks
1. **Stale UI on Route Changes**
   - Zustand store persists across route navigation
   - If user navigates away and back, store state may be stale
   - **Mitigation**: Current implementation uses singleton `sessionManager` which handles cleanup automatically

2. **SSR Hydration**
   - Store is initialized on client only (hook-based)
   - **Risk Level**: LOW (no SSR usage in current implementation)

### Recommendations
- ✅ Current implementation is safe (client-only hook)
- ⚠️ Consider adding `resetTelemetry()` on route unmount if needed
- ⚠️ Document that store is client-only in code comments

## B) Debug Trigger / Mock Call Deduplication

### Current State
- Debug button triggers:
  1. Global event (`DEBUG_TRIGGER_EVENT`) → CopilotDock listens
  2. Direct `fetch()` call as fallback/verification

### Risks
1. **Double Request on Single Click**
   - Both event listener AND direct fetch may fire
   - **Current Behavior**: CopilotDock's `handleSend` may be called while direct fetch is also running
   - **Impact**: Two concurrent SSE streams (violates Gate C "single stream" rule)

2. **Stream Active Check Missing**
   - Debug button doesn't check if stream is already active
   - Multiple rapid clicks could create multiple streams

### Recommendations
- 🔴 **HIGH PRIORITY**: Add stream state check to debug button
  - Disable button when `state !== 'idle'`
  - Or show "Already streaming" toast
- 🔴 **HIGH PRIORITY**: Remove direct fetch fallback OR guard it with state check
  - Prefer: Only use event emitter path
  - Alternative: Check `useLiveSessionStore.getState().state` before direct fetch

### Implementation Plan
```typescript
// In LiveDebugBadge.tsx handleStartMockStream:
const currentState = useLiveSessionStore.getState().state;
if (currentState !== 'idle') {
  setLastError('Stream already active. Wait for completion.');
  return;
}
```

## C) Mock Security

### Current State
- Mock enabled when: `isDev && (envFlag || queryFlag || headerFlag)`
- Production check: `process.env.NODE_ENV !== 'production'`
- Mock flag check in route: `const isDev = process.env.NODE_ENV !== 'production'`

### Verification
✅ **Production Safety Verified**
- Route checks `isDev` before enabling mock
- Request flags (`?mock=1`, `x-spark-mock:1`) are ignored in production
- Production without API key → returns 401 (expected behavior)

### Regression Matrix
- ✅ Dev + mock=0 + API key: Real SSE works
- ✅ Dev + mock=0 + no API key: 401 (expected)
- ✅ Dev + mock=1: Mock SSE works (200 + tokens)
- ✅ Prod + mock=1: Mock disabled, 401 if no API key (expected)

### Recommendations
- ✅ Current implementation is secure
- ⚠️ Add integration test to verify prod mock flag is ignored
- ⚠️ Consider adding explicit `console.warn` in prod if mock flag is present (detect misconfiguration)

## D) Additional Technical Debt Items

### 1. Mock Stream Token Count/Delay
- Currently hardcoded: 25 tokens, 50ms delay
- Env vars exist: `SPARK_COPILOT_MOCK_TOKENS`, `SPARK_COPILOT_MOCK_DELAY_MS`
- **Status**: Env vars are read but may not be consistently used
- **Recommendation**: Verify env var usage across all mock paths

### 2. Error Handling in Zustand Store
- Store doesn't persist errors across component unmounts
- **Risk**: LOW (errors are shown immediately)
- **Recommendation**: Consider error queue for debugging

### 3. Telemetry Reset
- `resetTelemetry()` exists but is not called on route change
- **Risk**: LOW (new session overwrites old values)
- **Recommendation**: Auto-reset on route change if needed

## Priority Matrix

| Issue | Priority | Impact | Effort | Status |
|-------|----------|--------|--------|--------|
| Debug button double request | HIGH | HIGH | LOW | ⚠️ TODO |
| Stream active check | HIGH | MEDIUM | LOW | ⚠️ TODO |
| SSR guard documentation | LOW | LOW | LOW | ✅ OK |
| Mock security verification | MEDIUM | HIGH | MEDIUM | ✅ VERIFIED |
| Telemetry reset on route | LOW | LOW | LOW | ⚠️ OPTIONAL |

## Next Steps

1. **Immediate** (Before Production):
   - Fix debug button double request issue
   - Add stream active check to prevent concurrent streams

2. **Soon** (Next Sprint):
   - Add integration test for prod mock flag rejection
   - Document Zustand store lifecycle in code comments

3. **Later** (Backlog):
   - Consider error queue for telemetry
   - Auto-reset telemetry on route change (if needed)

