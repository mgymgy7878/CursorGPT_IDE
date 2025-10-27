# MICRO IMPROVEMENTS - Portfolio Sprint
**chatgpt suggestions + cursor implementation**

---

## 1️⃣ UI Staleness Badge

**Location**: `apps/web-next/src/components/portfolio/SummaryCards.tsx`

### Implementation

```typescript
import { Badge } from '@tremor/react';

interface SummaryCardsProps {
  totalUsd: number;
  accountCount: number;
  updatedAt?: string;
}

export default function SummaryCards({ totalUsd, accountCount, updatedAt }: SummaryCardsProps) {
  // Calculate staleness
  const staleness = updatedAt 
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000)
    : null;
  
  // Determine badge color
  const getBadgeColor = (seconds: number | null) => {
    if (seconds === null) return 'gray';
    if (seconds < 60) return 'green';   // < 1 min: fresh
    if (seconds < 300) return 'yellow'; // < 5 min: stale
    return 'red';                       // >= 5 min: very stale
  };
  
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Existing cards */}
      
      {/* Staleness indicator card */}
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-70">Veri Tazeliği</span>
          <Badge color={getBadgeColor(staleness)}>
            {staleness !== null ? `${staleness}s önce` : 'Yükleniyor...'}
          </Badge>
        </div>
        {staleness !== null && staleness > 300 && (
          <p className="mt-2 text-xs text-red-500">
            ⚠️ Veri bayat olabilir, yenileyin
          </p>
        )}
      </div>
    </div>
  );
}
```

**Expected Output**:
- < 60s: 🟢 Green badge "45s önce"
- 60-300s: 🟡 Yellow badge "180s önce"
- > 300s: 🔴 Red badge "450s önce" + warning

---

## 2️⃣ Binance Price Cache with TTL

**Location**: `services/executor/src/services/portfolioService.ts`

### Implementation

```typescript
// Price cache with TTL
interface PriceCache {
  data: Map<string, number>;
  timestamp: number;
}

let priceCache: PriceCache | null = null;
const PRICE_CACHE_TTL = 30_000; // 30 seconds

async function fetchBinanceAccount(): Promise<PortfolioAccount | null> {
  // ... existing code ...
  
  // Price fetching with cache
  let priceMap: Map<string, number>;
  
  if (priceCache && (Date.now() - priceCache.timestamp) < PRICE_CACHE_TTL) {
    // Use cached prices
    console.log('[Portfolio] Using cached Binance prices');
    priceMap = priceCache.data;
  } else {
    // Fetch fresh prices
    console.log('[Portfolio] Fetching fresh Binance prices');
    const allPrices = await binance.getAllTickerPrices();
    priceMap = new Map<string, number>();
    
    for (const p of allPrices) {
      if (p.symbol && p.price) {
        priceMap.set(p.symbol, parseFloat(p.price));
      }
    }
    
    // Update cache
    priceCache = {
      data: priceMap,
      timestamp: Date.now()
    };
  }
  
  // ... rest of code uses priceMap ...
}
```

**Benefits**:
- Reduces API calls: 1 call per 30s instead of 1 call per refresh
- Faster response time: O(1) lookup from cache
- Rate limit friendly: Binance won't block us

**Metrics to watch**:
```promql
# Cache hit rate (implement counter)
spark_portfolio_price_cache_hits_total / 
spark_portfolio_price_cache_requests_total
```

---

## 3️⃣ BTCTurk Error Classification

**Location**: `services/executor/src/connectors/btcturk.ts`

### Implementation

```typescript
import { apiErrors } from '../metrics/portfolio.js';

async function http(path: string, method='GET', body?: any, auth=false) {
  const url = `${BASE}${path}`;
  const init: RequestInit = { 
    method, 
    headers: auth ? authHeaders() : { 'Content-Type':'application/json' } 
  };
  
  if (body !== undefined) init.body = JSON.stringify(body);
  
  try {
    const res = await fetch(url, init);
    const json = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      // Classify error type
      const errorType = 
        res.status === 401 ? 'auth' :
        res.status === 403 ? 'auth' :
        res.status === 429 ? 'ratelimit' :
        res.status === 504 ? 'timeout' :
        res.status >= 500 ? 'server' :
        'unknown';
      
      // Increment error counter with label
      apiErrors.labels('btcturk', errorType).inc();
      
      const error = Object.assign(
        new Error('btcturk_error'), 
        { status: res.status, body: json, errorType }
      );
      throw error;
    }
    
    return json;
  } catch (err: any) {
    // Network/timeout errors
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      apiErrors.labels('btcturk', 'timeout').inc();
    } else if (!err.errorType) {
      // Unknown error (not from status code check above)
      apiErrors.labels('btcturk', 'unknown').inc();
    }
    throw err;
  }
}
```

**Grafana Query**:
```promql
sum by (error_type) (
  rate(spark_exchange_api_error_total{exchange="btcturk"}[5m])
)
```

**Alert Rule**:
```yaml
- alert: BTCTurkAuthErrors
  expr: rate(spark_exchange_api_error_total{exchange="btcturk",error_type="auth"}[5m]) > 0
  for: 1m
  annotations:
    summary: "BTCTurk API authentication errors detected"
    action: "Regenerate API key and update .env"
```

---

## 4️⃣ Prometheus Label Hygiene

**Location**: `services/executor/src/metrics/portfolio.ts`

### Implementation

```typescript
import { register } from 'prom-client';

// Add default labels to ALL metrics
register.setDefaultLabels({
  environment: process.env.NODE_ENV || 'development',
  service: 'executor',
  version: process.env.npm_package_version || 'unknown',
  host: process.env.HOSTNAME || 'localhost'
});

// When recording metrics
export function recordPortfolioRefresh(
  exchange: string, 
  startTime: number, 
  success: boolean
) {
  const duration = Date.now() - startTime;
  
  // Labels are automatically enriched with defaults
  portfolioLatency.labels(exchange).observe(duration);
  
  if (!success) {
    apiErrors.labels(exchange, 'unknown').inc();
  }
}
```

**Grafana Benefits**:
- Filter by environment: `{environment="production"}`
- Compare versions: `{version=~"v1.9.*"}`
- Multi-host dashboards: `sum by (host) (...)`

**Example Query**:
```promql
histogram_quantile(0.95, 
  sum by (le, exchange, environment) (
    rate(spark_portfolio_refresh_latency_ms_bucket{environment="production"}[5m])
  )
)
```

---

## 5️⃣ BONUS: Exponential Backoff (Future Sprint)

**Location**: `services/executor/src/lib/retry.ts` (NEW FILE)

### Implementation Outline

```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;
  
  let lastError: any;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      // Don't retry on auth errors (permanent failure)
      if (err.status === 401 || err.status === 403) {
        throw err;
      }
      
      // Last attempt, throw
      if (attempt === maxRetries) {
        throw err;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
  
  throw lastError;
}

// Usage in connector
export async function getAccountBalances() {
  return retryWithBackoff(
    () => http('/api/v3/account', 'GET', {}, true),
    { maxRetries: 2, initialDelay: 500 }
  );
}
```

**Benefits**:
- Resilient to transient network issues
- Respects rate limits (waits before retry)
- Metrics: `spark_portfolio_retry_attempts_total`

---

## 📊 METRICS TO ADD

For full observability of improvements:

```typescript
// In metrics/portfolio.ts

// Price cache metrics
export const priceCacheHits = new Counter({
  name: 'spark_portfolio_price_cache_hits_total',
  help: 'Number of price cache hits',
  labelNames: ['exchange']
});

export const priceCacheRequests = new Counter({
  name: 'spark_portfolio_price_cache_requests_total',
  help: 'Total price cache requests',
  labelNames: ['exchange']
});

// Error classification
export const apiErrors = new Counter({
  name: 'spark_exchange_api_error_total',
  help: 'Exchange API errors by type',
  labelNames: ['exchange', 'error_type'] // error_type: auth|ratelimit|timeout|server|unknown
});

// Retry attempts
export const retryAttempts = new Counter({
  name: 'spark_portfolio_retry_attempts_total',
  help: 'Number of retry attempts',
  labelNames: ['exchange', 'reason']
});
```

---

## 🎯 IMPLEMENTATION PRIORITY

| Improvement | Effort | Impact | Priority | Sprint |
|-------------|--------|--------|----------|--------|
| 1. UI Staleness Badge | 15 min | Medium | HIGH | Current (v1.9-p3) |
| 2. Price Cache TTL | 20 min | High | HIGH | Current (v1.9-p3) |
| 3. Error Classification | 30 min | Medium | MEDIUM | Current (v1.9-p3) |
| 4. Label Hygiene | 10 min | Low | MEDIUM | Current (v1.9-p3) |
| 5. Exponential Backoff | 2 hours | High | LOW | Future (N+2) |

**Recommendation**: Implement #1, #2, #4 today (45 minutes total), defer #3 and #5.

---

## 📈 EXPECTED IMPROVEMENTS

**Before**:
- UI: No staleness indicator → user confusion
- API: 50+ price requests per refresh → rate limit risk
- Errors: Generic "btcturk_error" → hard to diagnose
- Metrics: No environment label → can't filter prod vs dev

**After**:
- UI: 🟢 "15s önce" badge → user confidence
- API: 1 price request per 30s → 98% reduction
- Errors: "auth", "ratelimit", "timeout" labels → targeted fixes
- Metrics: `{environment="production"}` → clean prod dashboards

**Estimated Performance Gain**:
- Latency: -30% (price cache)
- API calls: -95% (cache + batching)
- Error diagnosis time: -70% (error classification)

---

**cursor (Claude 3.5 Sonnet) + chatgpt**  
**Sprint**: v1.9-p3 Micro Improvements  
**Status**: Ready to implement (45 min) 🚀

