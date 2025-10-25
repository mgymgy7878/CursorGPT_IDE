# Web-Next Dev

## Quickstart

1. **Setup environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend URLs if available
   # Or keep defaults for mock mode
   ```

2. **Terminal A — Start dev WebSocket server (optional):**
   ```bash
   pnpm ws:dev
   # Output: [dev-ws] listening on ws://127.0.0.1:4001
   ```
   This makes WS status dot green. Without it, WS will show connecting/down (expected in mock mode).

3. **Terminal B — Start Next.js dev server:**
   ```bash
   pnpm dev
   # Opens at http://localhost:3003
   ```

**Expected Status Dots:**
- **Mock Mode** (no backend): API ✅, WS ⚠️, Engine ✅
- **With pnpm ws:dev**: API ✅, WS ✅, Engine ✅
- **With Real Backend**: All ✅ (from real services)

## Status Dots

The top status bar shows three health indicators:

- **API:** `/api/public/error-budget` (5s poll)
  - Tries: `PROMETHEUS_URL` → fallback mock
  - Source shown in response: `{ ..., source: 'prometheus' | 'mock' }`

- **WS:** Market store connection status
  - Uses: `useMarketStore(s => s.status === 'healthy')`
  - Dev fallback: pnpm ws:dev (local echo server)

- **Engine:** `/api/public/engine-health` (10s poll)
  - Tries: `ENGINE_URL/health` → fallback mock
  - Source shown in response: `{ ..., source: 'mock' }`

## Troubleshooting

**Port 3003 listen etmiyorsa:**
```bash
pnpm -F web-next dev
```

**WS kırmızı ise:**
```bash
pnpm -F web-next ws:dev
# Or check NEXT_PUBLIC_WS_URL in .env.local
```

**Build fails:**
```bash
pnpm -F web-next clean
pnpm -F web-next dev
```

## Development

### Scripts

```bash
pnpm dev         # Start Next.js on port 3003
pnpm ws:dev      # Start dev WebSocket server on port 4001
pnpm build       # Production build
pnpm test        # Jest tests
pnpm test:e2e    # Playwright E2E tests
pnpm typecheck   # TypeScript check
```

### Routes

**Working:**
- `/dashboard` — Main dashboard
- `/strategy-lab` — Strategy editor
- `/portfolio` — Portfolio management
- `/alerts` — Alert management
- `/market-data` — Placeholder (realtime feed coming soon)
- `/backtest` — Placeholder (backtest engine UI coming soon)

### Mock to Real Migration

**Error Budget:**
- Mock: `src/app/api/public/error-budget/route.ts`
- Real: Connect to Prometheus

**Engine Health:**
- Mock: `src/app/api/public/engine-health/route.ts`
- Real: Proxy to Strategy Engine service

**WebSocket:**
- Dev: `pnpm ws:dev` (local echo server)
- Real: Connect to market data WebSocket service

## Architecture

```
Layout Structure:
┌─────────────────────────────────────┐
│ Status Bar (API/WS/Engine + Badge) │
├──────────┬──────────────────────────┤
│          │                          │
│ Left Nav │  Main Content            │
│          │  (Route Pages)           │
│          │                          │
└──────────┴──────────────────────────┘
```

## Next Steps

1. Start backend services (executor, marketdata)
2. Update mock endpoints to real connections
3. Implement missing route content (market-data, backtest)
4. Add WebSocket real-time data subscriptions

