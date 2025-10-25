# Web-Next Dev

## Quickstart

1. **Setup environment:**
   ```bash
   cp .env.example .env.local
   ```

2. **Terminal A — Start dev WebSocket server (optional):**
   ```bash
   pnpm ws:dev
   # Output: [dev-ws] listening on ws://127.0.0.1:4001
   ```
   This makes the WS status dot green. Without it, WS dot will be red (expected).

3. **Terminal B — Start Next.js dev server:**
   ```bash
   pnpm dev
   # Opens at http://localhost:3003
   ```

## Status Dots

The top status bar shows three health indicators:

- **API:** `/api/public/error-budget` (5s poll)
- **WS:** `NEXT_PUBLIC_WS_URL` (20s ping)
- **Engine:** `/api/public/engine-health` (10s poll)

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

