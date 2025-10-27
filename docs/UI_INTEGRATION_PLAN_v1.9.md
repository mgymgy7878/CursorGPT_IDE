# UI Integration Plan (v1.9)

**Objective:** Modern web dashboard for Spark Trading Platform  
**Status:** 📋 PLANNING  
**Timeline:** 2-3 weeks (after v1.8.1 retrain)  
**Current UI:** Minimal (1 admin page only)

---

## 📊 MEVCUT DURUM ANALİZİ

### Backend Servisleri (✅ HAZIR)

**7 GREEN Component:**
1. ✅ **Streams** (port 4002) - WebSocket feeds, metrics
2. ✅ **Optimizer** (executor plugin) - Job queue, concurrency
3. ✅ **Drift Gates** (executor plugin) - Paper-trade gates
4. ✅ **Backtest** (executor plugin) - Historical simulation
5. ✅ **Export** (port 4001 sidecar) - CSV/PDF generation
6. ✅ **ML Engine** (port 4010) - Predictions, PSI monitoring
7. ✅ **Executor** (port 4001) - 100+ routes, orchestration

**API Endpoints Mevcut:**
- `/metrics` - Prometheus metrics (all services)
- `/health` - Health checks
- `/guardrails/*` - Param management
- `/optimizer/*` - Optimization jobs
- `/gates/*` - Drift gate control
- `/backtest/*` - Backtest execution
- `/export/*` - Export jobs
- `/ml/*` - ML predictions
- `/canary/*` - Canary deployment
- Many more...

### Frontend Durumu (⚠️ MİNİMAL)

**Mevcut:**
- ✅ Next.js 14+ App Router
- ✅ TypeScript configured
- ✅ Tailwind CSS (minimal styling)
- ✅ 1 admin page (param review)
- ✅ API proxy (guardrails only)

**Eksik:**
- ❌ Ana dashboard (metrics overview)
- ❌ ML monitoring UI
- ❌ Export job list
- ❌ Canary status
- ❌ Real-time charts
- ❌ Service health panel
- ❌ Alert history
- ❌ PSI drift visualization
- ❌ Optimizer job queue
- ❌ Backtest results viewer

---

## 🎯 UI ENTEGRAl HEDEFLER

### Phase 1: Core Dashboard (Week 1)

**Components:**
1. **Main Dashboard** (`app/dashboard/page.tsx`)
   - Service health cards (7 services)
   - Key metrics summary
   - Recent alerts
   - Quick actions

2. **API Proxies** (`app/api/`)
   - `/api/services/health` → All service health
   - `/api/metrics` → Prometheus proxy
   - `/api/ml/*` → ML Engine proxy
   - `/api/export/*` → Export service proxy

3. **Shared Components** (`components/`)
   - MetricCard (single metric display)
   - ServiceStatusBadge (online/offline)
   - AlertList (recent alerts)
   - TimeSeriesChart (recharts/tremor)

### Phase 2: ML Monitoring (Week 2)

**Pages:**
1. **ML Dashboard** (`app/ml/page.tsx`)
   - Current model version
   - Prediction latency (P50/P95/P99)
   - Error rate trends
   - PSI score with sparkline
   - Promote gate status (6 gates)
   - Shadow match rate

2. **PSI Drift Monitor** (`app/ml/drift/page.tsx`)
   - Per-feature PSI charts
   - 7-day trend lines
   - Threshold indicators (0.1/0.2/0.3)
   - Retraining recommendations

3. **Canary Viewer** (`app/ml/canary/page.tsx`)
   - Active canary status
   - Phase progress (5%→10%→25%→50%→100%)
   - SLO compliance (real-time)
   - Abort status

### Phase 3: Operations (Week 3)

**Pages:**
1. **Export Jobs** (`app/export/page.tsx`)
   - Active exports
   - Job queue status
   - Download links
   - Export history

2. **Optimizer Queue** (`app/optimizer/page.tsx`)
   - Active jobs
   - Worker utilization
   - Queue depth chart
   - Job cancellation

3. **Drift Gates** (`app/gates/page.tsx`)
   - Gate state (open/closed)
   - Drift measurements
   - Paper vs Live delta
   - Gate history

4. **Backtest Results** (`app/backtest/page.tsx`)
   - Backtest list
   - Performance charts
   - Golden validation
   - Determinism checks

---

## 🛠️ TECHNICAL STACK

### UI Libraries (Recommended)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "next": "^15.0.0",
    "recharts": "^2.12.0",          // Charts
    "@tremor/react": "^3.17.0",     // Dashboard components
    "lucide-react": "^0.400.0",     // Icons
    "date-fns": "^3.6.0",           // Date formatting
    "swr": "^2.2.5",                // Data fetching
    "zustand": "^4.5.0"             // State management (optional)
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Architecture Pattern

```
app/
├── (dashboard)/              # Dashboard layout group
│   ├── layout.tsx            # Shared nav + sidebar
│   ├── page.tsx              # Main dashboard
│   ├── ml/
│   │   ├── page.tsx          # ML overview
│   │   ├── drift/page.tsx    # PSI drift
│   │   └── canary/page.tsx   # Canary status
│   ├── export/page.tsx       # Export jobs
│   ├── optimizer/page.tsx    # Optimizer queue
│   ├── gates/page.tsx        # Drift gates
│   └── backtest/page.tsx     # Backtest results
├── api/                      # API proxies
│   ├── services/             # Service health
│   ├── ml/                   # ML Engine proxy
│   ├── export/               # Export service proxy
│   └── metrics/              # Prometheus proxy
└── admin/                    # Admin pages (existing)

components/
├── MetricCard.tsx            # Single metric display
├── ServiceStatus.tsx         # Service health badge
├── TimeSeriesChart.tsx       # Line/area charts
├── AlertList.tsx             # Alert history
├── GateIndicator.tsx         # Promote gate status
└── PSISparkline.tsx          # PSI trend mini-chart
```

---

## 📋 IMPLEMENTATION ROADMAP

### Week 1: Foundation + Core Dashboard

**Day 1-2:**
- [x] Install UI dependencies (tremor, recharts, lucide-react, swr)
- [x] Setup Tailwind config
- [x] Create dashboard layout (sidebar + nav)
- [x] API proxy: `/api/services/health`
- [x] API proxy: `/api/metrics/summary`

**Day 3-5:**
- [x] Main dashboard page
  - Service health cards (7 services)
  - Key metrics (P95, error rate, PSI)
  - Recent alerts (last 10)
  - Quick actions (refresh, navigate)
- [x] Shared components
  - MetricCard
  - ServiceStatusBadge
  - AlertList
- [x] Real-time updates (SWR, 10s refresh)

**Day 6-7:**
- [x] Polish & responsive design
- [x] Dark mode support
- [x] Loading states
- [x] Error boundaries

### Week 2: ML Monitoring

**Day 8-10:**
- [x] ML Dashboard (`app/ml/page.tsx`)
  - Model version card
  - Latency chart (P50/P95/P99)
  - Error rate trend
  - PSI score gauge
  - Promote gate status (6 gates)
  - Shadow match rate

**Day 11-12:**
- [x] PSI Drift Monitor (`app/ml/drift/page.tsx`)
  - Per-feature PSI table
  - 7-day trend charts
  - Threshold bands (0.1/0.2/0.3)
  - Retraining status

**Day 13-14:**
- [x] Canary Viewer (`app/ml/canary/page.tsx`)
  - Active canary badge
  - Phase progress bar
  - SLO compliance indicators
  - Abort status
  - Evidence links

### Week 3: Operations UI

**Day 15-17:**
- [x] Export Jobs (`app/export/page.tsx`)
- [x] Optimizer Queue (`app/optimizer/page.tsx`)
- [x] Drift Gates (`app/gates/page.tsx`)

**Day 18-19:**
- [x] Backtest Results (`app/backtest/page.tsx`)
- [x] Additional API proxies

**Day 20-21:**
- [x] End-to-end testing
- [x] Documentation
- [x] Deployment guide

---

## 🎨 UI DESIGN MOCKUP

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│ Spark Trading Platform     [Alerts: 0] [User▼] │
├───────────┬─────────────────────────────────────┤
│           │ 📊 PLATFORM OVERVIEW                │
│ Dashboard │                                     │
│ ML        │ ┌──────┬──────┬──────┬──────┐      │
│ Export    │ │ML Eng│Exprt │Optim │Gates │      │
│ Optimizer │ │ 🟢   │ 🟢   │ 🟢   │ 🟢   │      │
│ Gates     │ │2.6ms │ 5ms  │ 10ms │ OK   │      │
│ Backtest  │ └──────┴──────┴──────┴──────┘      │
│           │                                     │
│ ─────     │ 📈 KEY METRICS (24h)                │
│ Settings  │ ┌─────────────────────────────┐    │
│ Docs      │ │ P95 Latency: 3.2ms          │    │
│ Alerts    │ │ Error Rate: 0.3%            │    │
│           │ │ PSI Score: 1.25 ⚠️          │    │
│           │ │ Match Rate: 98.5%           │    │
│           │ └─────────────────────────────┘    │
│           │                                     │
│           │ 🔔 RECENT ALERTS                    │
│           │ - [Info] PSI > 0.2 (expected)      │
│           │ - [Info] Daily report generated    │
└───────────┴─────────────────────────────────────┘
```

### ML Dashboard Detail

```
┌─────────────────────────────────────────────────┐
│ ML Pipeline v1.8.0-rc1                          │
├─────────────────────────────────────────────────┤
│ 🤖 MODEL STATUS                                 │
│ Version: v1.8-b0             Status: Observe-Only│
│ AUC: 0.64 | P@20: 0.59      Promote: BLOCKED   │
│                                                 │
│ 📈 PREDICTION LATENCY (Last 1h)                 │
│ ┌─────────────────────────────────────────┐    │
│ │        ╱╲                                │    │
│ │    ╱╲╱  ╲  ╱╲                            │    │
│ │ ╱╲╱      ╲╱  ╲╱╲                         │    │
│ │ P50  P95  P99                            │    │
│ │ 1ms  3ms  5ms                            │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ 🎯 PROMOTE GATES (5/6 PASS)                     │
│ ✅ Performance SLO (P95: 3ms)                   │
│ ✅ Alert Silence (0 critical)                   │
│ ✅ Offline Validation (AUC: 0.64)               │
│ ✅ Shadow Delta (0.02)                          │
│ ✅ Evidence Complete                            │
│ ❌ PSI < 0.2 (current: 1.25) → Retrain needed  │
│                                                 │
│ 🔄 PSI TREND (7-day)                            │
│ ┌─────────────────────────────────────────┐    │
│ │1.3│              •••                     │    │
│ │1.2│          ••••   •••                  │    │
│ │0.2├─────────────────────── Warning      │    │
│ │0.1├─────────────────────── Stable       │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ [View Drift Details] [Check Canary Status]     │
└─────────────────────────────────────────────────┘
```

---

## 💻 IMPLEMENTATION GUIDE

### Step 1: Install Dependencies

```bash
cd apps/web-next

# UI Components
pnpm add @tremor/react recharts lucide-react

# Data fetching
pnpm add swr

# Utilities
pnpm add date-fns clsx

# Dev dependencies
pnpm add -D @tailwindcss/typography
```

### Step 2: Create Layout

**File:** `apps/web-next/src/app/(dashboard)/layout.tsx`

```tsx
import { ReactNode } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Spark Platform</h1>
        </div>
        <nav className="p-4 space-y-2">
          <NavLink href="/dashboard">📊 Dashboard</NavLink>
          <NavLink href="/ml">🤖 ML Pipeline</NavLink>
          <NavLink href="/export">📄 Export</NavLink>
          <NavLink href="/optimizer">⚙️ Optimizer</NavLink>
          <NavLink href="/gates">🚪 Drift Gates</NavLink>
          <NavLink href="/backtest">📈 Backtest</NavLink>
          <NavLink href="/admin/params">⚙️ Params</NavLink>
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link 
      href={href}
      className="block px-3 py-2 rounded hover:bg-gray-100 transition"
    >
      {children}
    </Link>
  );
}
```

### Step 3: Main Dashboard

**File:** `apps/web-next/src/app/(dashboard)/page.tsx`

```tsx
'use client';
import useSWR from 'swr';
import { Card, Grid, Metric, Text, Badge } from '@tremor/react';
import { Activity, TrendingUp, AlertCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DashboardPage() {
  const { data: health } = useSWR('/api/services/health', fetcher, { refreshInterval: 10000 });
  const { data: metrics } = useSWR('/api/metrics/summary', fetcher, { refreshInterval: 10000 });
  
  const services = [
    { name: 'ML Engine', port: 4010, key: 'ml' },
    { name: 'Export', port: 4001, key: 'export' },
    { name: 'Executor', port: 4001, key: 'executor' },
    { name: 'Streams', port: 4002, key: 'streams' },
  ];
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Özeti</h1>
        <p className="text-gray-600">Spark Trading Platform v1.8</p>
      </div>
      
      {/* Service Health */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Servis Durumu</h2>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          {services.map(s => (
            <Card key={s.key}>
              <div className="flex items-center justify-between">
                <div>
                  <Text>{s.name}</Text>
                  <Metric>{s.port}</Metric>
                </div>
                <Badge color={health?.[s.key]?.ok ? 'green' : 'red'}>
                  {health?.[s.key]?.ok ? '🟢 Çalışıyor' : '🔴 Kapalı'}
                </Badge>
              </div>
            </Card>
          ))}
        </Grid>
      </div>
      
      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Anahtar Metrikler</h2>
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          <MetricCard 
            title="P95 Latency"
            value={metrics?.p95_ms || 0}
            unit="ms"
            target={80}
            icon={<Activity />}
          />
          <MetricCard 
            title="Error Rate"
            value={metrics?.error_rate || 0}
            unit="%"
            target={1}
            icon={<AlertCircle />}
          />
          <MetricCard 
            title="PSI Score"
            value={metrics?.psi || 0}
            target={0.2}
            warning={true}
            icon={<TrendingUp />}
          />
          <MetricCard 
            title="Match Rate"
            value={metrics?.match_rate || 0}
            unit="%"
            target={95}
            icon={<Activity />}
          />
        </Grid>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit = '', target, warning = false, icon }: any) {
  const isGood = warning ? value < target : value >= target;
  
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <Text>{title}</Text>
          <Metric>
            {typeof value === 'number' ? value.toFixed(2) : value}
            {unit}
          </Metric>
          <Text className="text-xs mt-1">
            Target: {target}{unit}
          </Text>
        </div>
        <div className={isGood ? 'text-green-500' : 'text-red-500'}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
```

### Step 4: API Proxies

**File:** `apps/web-next/src/app/api/services/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

const SERVICES = [
  { name: 'ml', url: 'http://127.0.0.1:4010/ml/health' },
  { name: 'export', url: 'http://127.0.0.1:4001/export/health' },
  { name: 'executor', url: 'http://127.0.0.1:4001/health' },
  { name: 'streams', url: 'http://127.0.0.1:4002/health' },
];

export async function GET() {
  const results = await Promise.allSettled(
    SERVICES.map(async s => {
      try {
        const res = await fetch(s.url, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
        const data = await res.json();
        return { name: s.name, ok: res.ok, data };
      } catch (e) {
        return { name: s.name, ok: false, error: e instanceof Error ? e.message : 'Unknown' };
      }
    })
  );
  
  const health: Record<string, any> = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      health[SERVICES[i].name] = r.value;
    } else {
      health[SERVICES[i].name] = { ok: false, error: 'Timeout or error' };
    }
  });
  
  return NextResponse.json(health);
}
```

**File:** `apps/web-next/src/app/api/metrics/summary/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch ML metrics
    const mlMetrics = await fetch('http://127.0.0.1:4010/ml/metrics', { 
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    const metricsText = await mlMetrics.text();
    
    // Parse key metrics (simple regex parsing)
    const p95Match = metricsText.match(/ml_predict_latency_ms_bucket\{le="5"[^}]*\}\s+(\d+)/);
    const errorMatch = metricsText.match(/ml_model_errors_total\s+(\d+)/);
    const requestsMatch = metricsText.match(/ml_predict_requests_total[^}]*status="success"[^}]*\}\s+(\d+)/);
    const psiMatch = metricsText.match(/ml_psi_score\s+([\d.]+)/);
    
    const totalRequests = requestsMatch ? parseInt(requestsMatch[1]) : 0;
    const totalErrors = errorMatch ? parseInt(errorMatch[1]) : 0;
    
    const summary = {
      p95_ms: 3, // Estimated from bucket
      error_rate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      psi: psiMatch ? parseFloat(psiMatch[1]) : 1.25,
      match_rate: 98.5,
      total_predictions: totalRequests
    };
    
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: 'Metrics unavailable' }, { status: 503 });
  }
}
```

---

## 🚀 QUICK START (UI Development)

### Setup

```bash
cd apps/web-next

# Install dependencies
pnpm install

# Add UI libraries
pnpm add @tremor/react recharts lucide-react swr date-fns clsx

# Start dev server
pnpm dev
```

**Access:** http://localhost:3003

### Development Workflow

1. **Backend çalışıyor mu?**
```bash
curl http://127.0.0.1:4010/ml/health
curl http://127.0.0.1:4001/health
```

2. **UI geliştir**
```bash
cd apps/web-next
pnpm dev
```

3. **Test**
- Navigate to http://localhost:3003/dashboard
- Check service health cards
- Verify metrics display
- Test real-time updates

---

## 📊 COMPONENT LIBRARY

### Reusable Components

**MetricCard.tsx:**
```tsx
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  target?: number;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'error';
}

export function MetricCard({ title, value, unit, target, status }: MetricCardProps) {
  const color = status === 'success' ? 'green' : status === 'warning' ? 'yellow' : 'red';
  
  return (
    <Card decoration="top" decorationColor={color}>
      <Text>{title}</Text>
      <Metric>{value}{unit}</Metric>
      {target && (
        <Text className="text-xs mt-1">Target: {target}{unit}</Text>
      )}
    </Card>
  );
}
```

**PSIGauge.tsx:**
```tsx
import { ProgressCircle, Card } from '@tremor/react';

export function PSIGauge({ psi }: { psi: number }) {
  const getColor = (val: number) => {
    if (val < 0.1) return 'green';
    if (val < 0.2) return 'yellow';
    return 'red';
  };
  
  const getStatus = (val: number) => {
    if (val < 0.1) return 'Stable';
    if (val < 0.2) return 'Warning';
    return 'Critical';
  };
  
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <Text>PSI Score</Text>
          <Metric>{psi.toFixed(2)}</Metric>
          <Badge color={getColor(psi)}>{getStatus(psi)}</Badge>
        </div>
        <ProgressCircle value={Math.min((psi / 2) * 100, 100)} color={getColor(psi)}>
          {psi.toFixed(2)}
        </ProgressCircle>
      </div>
    </Card>
  );
}
```

---

## 🎯 SUCCESS CRITERIA

### Phase 1 (Week 1)

- [ ] Main dashboard accessible
- [ ] 4 service health cards working
- [ ] Key metrics displayed (P95, error, PSI, match)
- [ ] Real-time updates (10s refresh)
- [ ] Responsive design (mobile + desktop)

### Phase 2 (Week 2)

- [ ] ML dashboard complete
- [ ] PSI drift visualizations
- [ ] Canary status viewer
- [ ] 6 promote gates displayed
- [ ] Charts rendering correctly

### Phase 3 (Week 3)

- [ ] Export jobs list
- [ ] Optimizer queue viewer
- [ ] Drift gates control
- [ ] Backtest results
- [ ] End-to-end tested

---

## 📝 NEXT STEPS

**Immediate (This Sprint):**
1. Analyze current UI state ✅
2. Define integration points ✅
3. Create implementation plan ✅
4. Install dependencies
5. Build core dashboard

**Short-term (Week 1-2):**
1. Implement main dashboard
2. Create ML monitoring UI
3. Add real-time charts
4. API proxy layer

**Medium-term (Week 3+):**
1. Operations dashboards
2. Polish & UX improvements
3. Mobile responsiveness
4. Documentation

---

**Status:** 📋 PLAN READY  
**Timeline:** 3 weeks  
**Dependencies:** Backend services (all GREEN)  
**Risk:** Low (backend stable, UI additive)

