# Deployment Checklist

## Pre-Deployment Validation

### 1. Local CI Tests

```bash
# Build production
pnpm -F web-next build

# Start production server
pnpm -F web-next start -- -p 3003 &

# Wait for server warmup (critical for stable Lighthouse scores)
npx wait-on http://127.0.0.1:3003 --timeout 30000
sleep 20

# Run Lighthouse CI (5 pages)
npx @lhci/cli autorun --config=.lighthouserc.json

# Expected: All pages ≥0.90 for Performance and Accessibility

# Run Axe Accessibility Tests
pnpm exec playwright install --with-deps
pnpm exec playwright test tests/a11y/axe.spec.ts

# Expected: 0 critical violations

# Quick smoke test
pwsh scripts/smoke-ui.ps1

# Expected: All 5 pages return 200 OK
```

### 2. Collect Evidence for PR

- [ ] Lighthouse JSON report (from `.lighthouseci/` directory)
- [ ] Lighthouse screenshots (5 pages with scores visible)
- [ ] Axe test output (showing 0 critical violations)
- [ ] Page screenshots (before/after comparison if updating existing UI)
- [ ] Bundle size report (`pnpm -F web-next build` output)

---

## PR Template Requirements

### UX-ACK Section

Document which WCAG 2.1 and Nielsen Norman Group principles were followed:

**WCAG 2.1 Compliance:**
- ✅ **1.4.3 Contrast (Minimum)**: All text ≥4.5:1 contrast ratio
- ✅ **2.1.1 Keyboard**: All interactive elements keyboard accessible
- ✅ **3.3.2 Labels or Instructions**: Form inputs have proper `<label>` associations
- ✅ **4.1.2 Name, Role, Value**: ARIA attributes (`aria-pressed`, `aria-controls`, `scope="row"`)
- ✅ **4.1.3 Status Messages**: `role="status"` + `aria-live="polite"` for live regions

**Nielsen Norman Group:**
- ✅ **Visibility of System Status**: Status pills (Env, Feed, Broker) + staleness badges
- ✅ **Error Prevention**: Input validation + confirmation before destructive actions
- ✅ **Recognition Rather Than Recall**: Clear labels, visual hierarchy, contextual help

### Evidence Section

Attach to PR:
1. **Lighthouse Report**: Link to CI artifacts or paste JSON summary
2. **Axe DevTools Screenshot**: Showing "0 violations found"
3. **Page Screenshots**: All 5 pages (/, /portfolio, /strategies, /running, /settings)
4. **Bundle Analysis**: Confirm < 250KB initial load

### Rollback Plan

```
If issues arise:
1. Set environment variable: ENABLE_NEW_UI=false
2. Restart Next.js server: pnpm -F web-next start
3. Expected recovery time: < 5 minutes
4. No database migration required (safe rollback)
```

---

## Feature Flag Configuration

### Environment Variable

Add to `.env` or deployment config:

```env
# UI Feature Flags
ENABLE_NEW_UI=true
ENABLE_STRATEGY_LAB=false  # Future feature
```

### Usage in Code

```tsx
// app/layout.tsx or middleware
const isNewUIEnabled = process.env.ENABLE_NEW_UI === 'true';

export default function RootLayout({ children }) {
  if (!isNewUIEnabled) {
    return <LegacyLayout>{children}</LegacyLayout>;
  }
  return <NewLayout>{children}</NewLayout>;
}
```

---

## Definition of Done

- [ ] All 5 pages return 200 OK (smoke test passes)
- [ ] Lighthouse CI: 5/5 pages ≥0.90 (Performance + Accessibility)
- [ ] Axe A11y: 0 critical violations
- [ ] Bundle size: Initial load < 250KB gzipped
- [ ] PR includes: UX-ACK + Evidence + Rollback plan
- [ ] CI workflows pass (node_modules guard, lighthouse, axe)
- [ ] Manual testing on 3 browsers (Chrome, Firefox, Safari)
- [ ] Mobile responsive check (iPhone, Android)

---

## Troubleshooting

### Lighthouse Performance < 0.90

**Symptoms:** LCP > 2.5s, CLS > 0.1

**Fixes:**
1. Add `priority` to hero images: `<Image priority />`
2. Preload critical fonts: `<link rel="preload" href="/fonts/..." />`
3. Fixed dimensions on cards to prevent layout shift
4. Use `next/dynamic` for heavy components (charts, Monaco editor)

### Lighthouse Accessibility < 0.90

**Symptoms:** Missing labels, low contrast, keyboard trap

**Fixes:**
1. All buttons with icons must have `aria-label`
2. Form inputs must have `<label htmlFor>` association
3. Check color contrast with DevTools: ≥4.5:1 for text
4. Table headers must have `scope="row"` or `scope="col"`

### Axe Critical Violations

**Common Issues:**
- **Missing labels**: Add `aria-label` to icon-only buttons
- **Color-only information**: Add text/icon alongside color indicators
- **Keyboard trap**: Ensure Tab/Shift+Tab cycles through all elements
- **Missing live regions**: Use `aria-live="polite"` for dynamic content

### CI Timeout

**Symptoms:** Lighthouse or Axe test times out after 30s

**Fixes:**
1. Increase warmup time: `sleep 20` → `sleep 30`
2. Use specific host binding: `next start -H 127.0.0.1`
3. Check server logs for startup errors
4. Ensure mock APIs don't have infinite delays

---

## Next Sprint: Production Data Integration

### P0 - Real Data Sources

**Replace Mock APIs:**
```bash
/api/mock/portfolio    → /api/portfolio (Binance WebSocket)
/api/mock/running      → /api/strategies/running (PostgreSQL)
/api/mock/strategies   → /api/strategies (PostgreSQL)
/api/mock/market       → /api/market (BTCTurk/BIST WebSocket)
```

**Staleness Monitoring:**
- WebSocket heartbeat: if no update in 5s, show warning badge
- Reconnection logic: exponential backoff (1s, 2s, 4s, 8s)
- Status pills reflect real broker connection state

### P0 - Observability

**RUM Endpoint:**
```tsx
// app/api/vitals/route.ts
export async function POST(req: Request) {
  const { name, value, id, rating, navigationType } = await req.json();
  
  // Log to Prometheus or DataDog
  metrics.observe(name, value, { route: req.headers.get('referer') });
  
  return Response.json({ ok: true });
}
```

**Grafana Dashboard:**
- Web Vitals P95 (LCP, INP, CLS) by route
- Error budget: 99.9% uptime = 43.8 min/month downtime
- Real-time alerts: LCP > 3s or CLS > 0.2

### P1 - Security Hardening

**API Key Storage:**
- Never store in localStorage (XSS risk)
- Server-side only: Prisma + encrypted at rest
- Rotate keys every 90 days (compliance)

**CSP Headers (Already Configured):**

`next.config.mjs` already includes CSP headers:
```javascript
headers: async () => ({
  source: '/(.*)',
  headers: [
    { key: 'Content-Security-Policy', value: "default-src 'self'; connect-src 'self' ws: wss:" },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ]
})
```

**For production (Nginx/CDN):**
- Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Rate limiting: 100 req/min per IP
- DDoS protection: Cloudflare or AWS Shield

**Redirects (308 Permanent):**

Trailing slash redirects prevent CLS/LCP variance:
```javascript
redirects: async () => [
  { source: '/settings/', destination: '/settings', permanent: true },
  { source: '/portfolio/', destination: '/portfolio', permanent: true },
  // ... all core pages
]
```

---

## Success Metrics

**Day 1 Post-Deploy:**
- [ ] Error rate < 0.1% (< 1 error per 1000 requests)
- [ ] P95 LCP < 2.5s (measured via RUM)
- [ ] No user-reported critical bugs
- [ ] Rollback not required

**Week 1 Post-Deploy:**
- [ ] Lighthouse scores remain ≥0.90 (regression test)
- [ ] User engagement: time-on-page ≥ baseline
- [ ] Zero accessibility complaints
- [ ] Feature flag can be removed (fully rolled out)

---

**Maintainer:** Spark Trading Team  
**Last Updated:** 2025-10-27  
**Related Docs:** `CI_USAGE.md`, `UI_RECONSTRUCTION_PLAN.md`, `COMPONENT_INTERFACES.md`
