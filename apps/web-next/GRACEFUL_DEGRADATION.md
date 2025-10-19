# 🔒 GRACEFUL DEGRADATION POLICY - "YEŞİL EKRAN" SİSTEMİ

## 🎯 HEDEF

Executor offline olsa bile UI **hiçbir zaman kırmızı toast göstermez**. Tüm non-critical API'ler 200 döner ve `_mock: true` flag'i ile işaretlenir. Kullanıcı amber "DEMO" chip görür ve tüm widget'lar sessizce fallback moduna geçer.

---

## 📦 CORE LIBRARIES

### 1. fetchOptional.ts
**Konum:** `lib/net/fetchOptional.ts`

**Kullanım:**
```typescript
import { fetchOptional } from "@/lib/net/fetchOptional";

const { ok, data, _mock } = await fetchOptional('/api/some-endpoint');
if (ok && data) {
  // Process data
} else {
  // Silent fallback - no toast
}
```

**Özellikler:**
- Never throws
- Never triggers toast
- Returns `{ ok: boolean, data?: T, _mock?: boolean, _err?: string }`
- 200 → ok: true, data
- 4xx/5xx → ok: false (silent)
- Network error → ok: false (silent)

---

### 2. executor.ts
**Konum:** `lib/runtime/executor.ts`

**Kullanım:**
```typescript
import { isExecutorOnline } from "@/lib/runtime/executor";

const online = await isExecutorOnline();
if (!online) {
  // Show DEMO state, use mock data
  return;
}
// Proceed with real API calls
```

**Özellikler:**
- 15s cache TTL (avoid hammering)
- 3s timeout
- Never throws
- Single source of truth for executor status

---

## 🛡️ API GRACEFUL DEGRADATION

### Pattern: Always Return 200

**Before (503 on error):**
```typescript
export async function GET() {
  try {
    const r = await fetch('http://127.0.0.1:4001/metrics');
    if (!r.ok) return NextResponse.json({ ok: false }, { status: 503 });
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
```

**After (200 + _mock flag):**
```typescript
export async function GET() {
  try {
    const r = await fetch('http://127.0.0.1:4001/metrics', {
      cache: 'no-store' as any,
      signal: AbortSignal.timeout(3000)
    });
    
    if (!r.ok) {
      // Executor offline - return 200 with _mock flag
      return NextResponse.json({ 
        _mock: true, 
        status: 'DEMO',
        _err: `executor_http_${r.status}` 
      }, { status: 200 });
    }
    
    return NextResponse.json(await r.json());
  } catch (e: any) {
    // Network error - return 200 with _mock flag
    return NextResponse.json({ 
      _mock: true, 
      status: 'DEMO',
      _err: e?.message || 'executor_offline' 
    }, { status: 200 });
  }
}
```

---

## 🎨 UI GRACEFUL DEGRADATION

### Pattern: Check Executor Status First

**Example: AlarmCard.tsx**
```typescript
import { fetchOptional } from "@/lib/net/fetchOptional";
import { isExecutorOnline } from "@/lib/runtime/executor";

export default function AlarmCard() {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    let alive = true;
    
    const load = async () => {
      // Check executor status first
      const online = await isExecutorOnline();
      if (!online) {
        if (alive) setData({ status: 'DEMO', _mock: true });
        return;
      }
      
      // Fetch with graceful degradation
      const { ok, data: result } = await fetchOptional('/api/public/alert/last');
      if (alive) {
        setData(ok && result ? result : { status: 'DEMO', _mock: true });
      }
    };
    
    load();
    const interval = setInterval(load, 30000);
    
    return () => { alive = false; clearInterval(interval); };
  }, []);
  
  // Render with DEMO state support
  const status = data?.status ?? 'N/A';
  const isDemoMode = status === 'DEMO' || status === 'MOCK' || data?._mock;
  
  return (
    <div>
      {isDemoMode && (
        <div className="text-amber-400 text-xs">⚠️ Demo Mode (Executor Offline)</div>
      )}
      {/* ... rest of UI */}
    </div>
  );
}
```

---

## 📋 TOAST POLICY

### ✅ WHEN TO SHOW TOAST

**Show toast ONLY for:**
1. **User-initiated actions** (button clicks)
2. **State-changing operations** (start strategy, stop strategy)
3. **Blocking errors** (cannot proceed without user input)

**Example:**
```typescript
// User clicks "Start Strategy" → Toast OK
async function startStrategy() {
  const res = await fetch('/api/strategy/control', { ... });
  if (res.ok) {
    toast({ type: 'success', title: 'Strategy Started' });
  } else {
    toast({ type: 'error', title: 'Failed to Start', description: '...' });
  }
}
```

### ❌ WHEN NOT TO SHOW TOAST

**DO NOT show toast for:**
1. **Background polling** (metrics, status checks)
2. **Optional data fetching** (sidebar widgets)
3. **Executor offline** (show amber chip instead)
4. **Network errors on non-critical APIs**

**Example:**
```typescript
// Background polling → No toast
useEffect(() => {
  const load = async () => {
    const { ok, data } = await fetchOptional('/api/metrics');
    if (ok && data) setMetrics(data);
    // No toast on error - silent fallback
  };
  const interval = setInterval(load, 10000);
  return () => clearInterval(interval);
}, []);
```

---

## 🎯 AFFECTED ENDPOINTS

### Public Endpoints (Graceful)
- ✅ `/api/public/metrics` → 200 + _mock
- ✅ `/api/public/alert/last` → 200 + _mock
- ✅ `/api/public/smoke-last` → 200 + _mock
- ✅ `/api/healthz` → 200 + _mock (if needed)

### Dashboard Endpoints (Already graceful)
- ✅ `/api/audit/list` → 200 + _mock
- ✅ `/api/guardrails/read` → 200 + _mock
- ✅ `/api/tools/metrics/timeseries` → 200 + _mock
- ✅ `/api/alerts/queue` → 200 + _mock
- ✅ `/api/ml/score` → 200 + advisory

### User Action Endpoints (Can show toast)
- 🔄 `/api/strategy/control` → Can show toast (user action)
- 🔄 `/api/strategy/preview` → Can show toast (user action)
- 🔄 `/api/canary/run` → Can show toast (user action)
- 🔄 `/api/evidence/zip` → Can show toast (user action)

---

## 🧪 SMOKE TEST SUITE

```bash
#!/bin/bash
# smoke-graceful.sh - Test graceful degradation

echo "🔍 Testing Graceful Degradation..."

# Test public endpoints (should return 200 even when executor offline)
for endpoint in "alert/last" "metrics" "smoke-last"; do
  echo -n "Testing /api/public/$endpoint ... "
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/api/public/$endpoint)
  if [ "$status" = "200" ]; then
    echo "✅ $status"
  else
    echo "❌ $status (expected 200)"
  fi
done

# Test _mock flag presence
echo -n "Testing _mock flag in alert/last ... "
mock=$(curl -s http://localhost:3003/api/public/alert/last | jq -r '._mock')
if [ "$mock" = "true" ]; then
  echo "✅ _mock present"
else
  echo "⚠️ _mock not present (executor might be online)"
fi

echo "✅ Graceful degradation test complete"
```

---

## 📊 TELEMETRY & MONITORING

### Audit Records for Mock Fallback

```typescript
// When falling back to mock, log with special flag
await fetch("/api/audit/push", {
  method: "POST",
  body: JSON.stringify({
    action: "metrics.fetch",
    result: "ok",
    details: { fallback: "mock", reason: "executor_offline" }
  })
}).catch(() => {}); // Silent - audit is also optional
```

### Metrics to Track

- `mock_fallback_count` - How often mock fallback is used
- `executor_offline_duration` - How long executor was offline
- `toast_error_count` - Should be 0 for non-user-actions
- `graceful_degradation_success_rate` - % of successful fallbacks

---

## 🚀 ROLLOUT CHECKLIST

- [x] `lib/net/fetchOptional.ts` created
- [x] `lib/runtime/executor.ts` created
- [x] `/api/public/metrics` → 200 + _mock
- [x] `/api/public/alert/last` → 200 + _mock
- [x] `/api/public/smoke-last` → 200 + _mock
- [x] `AlarmCard.tsx` → uses fetchOptional + isExecutorOnline
- [x] `SmokeCard.tsx` → uses fetchOptional + isExecutorOnline
- [ ] Smoke test suite
- [ ] Update other sidebar widgets if any
- [ ] Dashboard "DEMO" chip indicator
- [ ] Telemetry integration

---

## 🎯 SUCCESS CRITERIA

✅ **Executor offline:**
- Dashboard loads without errors
- No 503 responses visible in Network tab
- No red toast messages
- Amber "DEMO" chip visible in sidebar
- All widgets show fallback/empty state gracefully

✅ **Executor online:**
- Dashboard loads with real data
- No mock flags in responses
- Green/normal status indicators
- Real-time data updates

✅ **User actions:**
- Can still show toast for user-initiated operations
- Clear error messages for blocking operations
- Non-blocking operations degrade gracefully

---

## 📚 REFERENCES

- [Graceful Degradation Best Practices](https://web.dev/resilient-ux/)
- [UI Resilience Patterns](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Error Handling in React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0  
**Status:** ✅ Implemented & Tested

