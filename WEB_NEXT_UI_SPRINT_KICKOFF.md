# Web-Next UI Sprint Kickoff — Status Bar & Dashboard Shell

**Date:** 2025-10-25  
**Status:** ✅ **FILES CREATED** — Ready for dev server test  
**Scope:** apps/web-next UI infrastructure

---

## 🎯 Amaç

Mock backend ile çalışan, status bar ve dashboard kabuğu oluşturmak. Backend hazır olmadan UI geliştirmesine başlamak.

---

## 📂 Oluşturulan Dosyalar

### 1. Configuration

**apps/web-next/.env.local** (Blocked by globalIgnore)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
```

**Note:** .env.local gitignored olduğu için manuel oluşturulmalı

### 2. API Mock

**apps/web-next/src/app/api/public/error-budget/route.ts** ✅
- Mock error budget endpoint
- Returns: `{ status, errorBudget: 0.98, updatedAt }`
- Force dynamic (no cache)

### 3. Utilities & Hooks

**apps/web-next/src/lib/health.ts** ✅
- `fetchJson(url)` helper
- No-cache fetch utility

**apps/web-next/src/hooks/useHeartbeat.ts** ✅
- SWR-based health check
- 5s refresh interval
- Fetches `/api/public/error-budget`

### 4. UI Components

**apps/web-next/src/components/status-dot.tsx** ✅
- Visual status indicator
- Colors: green (ok), red (fail), gray (loading)
- Pulse animation for loading

**apps/web-next/src/components/status-bar.tsx** ✅
- Top status bar component
- Shows: API, WS, Engine status dots
- Error Budget percentage
- Guard Validate link (right side)

**apps/web-next/src/components/left-nav.tsx** ✅
- Left sidebar navigation
- Links: Dashboard, Market Data, Strategy Lab, Backtest, Portfolio, Alerts
- Hover effects

### 5. Package.json Update

**apps/web-next/package.json** ✅
```json
"dev": "next dev -p 3003"  // Simplified from dev-auto.mjs
```

---

## 📊 Mevcut Dashboard Durumu

**Existing File:** `apps/web-next/src/app/dashboard/page.tsx`

**Current Features:**
- PageHeader with title
- StatusPills (env, feed, broker)
- Metric cards (p95, staleness)
- LiveMarketCard components
- ErrorBudgetBadge
- i18n support

**Status:** ✅ Already well-structured, no need to replace

---

## 🚀 Sonraki Adımlar

### Immediate (Manuel)

**1. Create .env.local**
```bash
cd apps/web-next
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
EOF
```

**2. Install Dependencies**
```bash
cd C:\dev
pnpm install
```

**3. Start Dev Server**
```bash
pnpm --filter web-next dev
# Expected: http://localhost:3003
```

### Testing

**4. Verify Components**
- Navigate to: http://localhost:3003
- Should redirect to: http://localhost:3003/dashboard
- Check status bar (top)
- Check left nav (sidebar)
- Verify error budget API call

**5. Check Console**
- No 404 errors
- SWR polling every 5s
- Error budget data loading

---

## 💡 Architecture Notes

### Current Layout Structure

**Root Layout** (`src/app/layout.tsx`):
- ThemeProvider
- MarketProvider
- Global components (Toaster, ErrorSink, etc.)

**Page Routes:**
- `/dashboard` — Existing, well-structured
- `/market-data`, `/strategy-lab`, etc. — Need routes

**New Components:**
- `status-bar.tsx` — Top status bar (created)
- `status-dot.tsx` — Visual indicator (created)
- `left-nav.tsx` — Sidebar navigation (created)

**Integration:**
- Status bar can be added to root layout
- Left nav can be added to root layout
- Or create new (app) route group

---

## 🔧 Integration Options

### Option 1: Add to Root Layout (Recommended)

```tsx
// apps/web-next/src/app/layout.tsx
import StatusBar from '@/src/components/status-bar'
import LeftNav from '@/src/components/left-nav'

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className="h-full">
      <body className="h-full bg-surface text-neutral-100 overflow-hidden">
        <ThemeProvider>
          <MarketProvider>
            <div className="h-screen flex flex-col">
              <StatusBar />
              <div className="flex flex-1">
                <LeftNav />
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
            </div>
            <ChunkGuard />
            <Toaster />
            {/* ... */}
          </MarketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Option 2: (app) Route Group (Current Structure)

Create: `apps/web-next/src/app/(app)/layout.tsx` with status bar + left nav

---

## 📋 Created Files Summary

| File | Status | Purpose |
|------|--------|---------|
| `src/app/api/public/error-budget/route.ts` | ✅ Created | Mock error budget API |
| `src/lib/health.ts` | ✅ Created | Fetch utility |
| `src/hooks/useHeartbeat.ts` | ✅ Created | Health check hook |
| `src/components/status-dot.tsx` | ✅ Created | Status indicator |
| `src/components/status-bar.tsx` | ✅ Created | Top status bar |
| `src/components/left-nav.tsx` | ✅ Created | Left navigation |
| `package.json` | ✅ Modified | Dev script simplified |
| `.env.local` | ⚠️ Blocked | Create manually |

**Total:** 6 files created, 1 modified, 1 manual

---

## 🎯 Status

**Files:** ✅ Created  
**Configuration:** ⚠️ .env.local needs manual creation  
**Integration:** ⏳ Pending (add to layout)  
**Dev Server:** ⏳ Ready to start

**Next:** Create .env.local manually → pnpm install → pnpm dev → test

---

*Generated: 2025-10-25*

