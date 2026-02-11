# Gate C + Gate D: Commit Commands (Copy-Paste Ready)

**Date:** 2026-01-07
**Strategy:** 2 commits (code + evidence)

---

## Pre-Commit Verification

```powershell
# 1. Check git status
git status

# 2. Typecheck & Lint (optional but recommended)
pnpm -r typecheck
pnpm -r lint

# 3. Quick sanity tests (if server running)
# Browser: http://127.0.0.1:3003/dashboard?debugLive=1&mock=1
# Metrics: http://127.0.0.1:3003/api/public/metrics.prom
```

---

## Commit 1: Code + Debug Fix

```powershell
# Stage code files (exclude evidence pack)
git add apps/
git add tools/
git add config/
git add deploy/
git add packages/
git add docs/
git add *.md

# Verify what's staged (evidence pack should NOT be in list)
git status

# Commit
git commit -m "P1.2: Close Gate C/D (live session + metrics) with request-based mock + debug fix

Gate D (Prometheus Metrics):
- Implement all 7 SSE metrics (open/close/active/events/bytes/duration/invalid_drop)
- Request-based mock mode (?mock=1 or x-spark-mock:1) for deterministic testing
- Non-interactive smoke script with auto-trigger
- Grafana dashboard (8 panels)

Gate C (Live Session Manager):
- Zustand global store for state sync between components
- Debug trigger button for one-click testing
- T1/T2/T3 tests: PASS (single stream, abort determinism, limits)
- Extended telemetry (lastStartUrl, lastStartAt, errorCount, etc.)

Technical Debt Fixes:
- Prevent debug button double request
- Stream active check (button disabled when streaming)

Files:
- apps/web-next/src/server/copilotSseMetrics.ts (new)
- apps/web-next/src/app/api/copilot/chat/route.ts
- apps/web-next/src/app/api/public/metrics.prom/route.ts
- apps/web-next/src/components/copilot/CopilotDock.tsx
- apps/web-next/src/components/debug/LiveDebugBadge.tsx
- apps/web-next/src/lib/live-react/useLiveSession.ts
- tools/gate-d-smoke-metrics.ps1 (new)
- tools/gate-d-test-mock-sse.ps1 (new)

Test: pnpm -r typecheck && pnpm -r lint"
```

---

## Commit 2: Evidence Pack

```powershell
# Stage evidence pack only
git add evidence/p1.2_gateC_gateD_pack/

# Verify what's staged (should only be evidence pack)
git status

# Commit
git commit -m "evidence: P1.2 Gate C/D closure pack (artifacts, logs, metrics, summaries)

Evidence pack includes:
- Gate D: smoke metrics, Prometheus excerpts, Grafana dashboard
- Gate C: T1/T2/T3 test results, console logs, screenshots
- Technical debt documentation
- Final closure summary

Total: 32 files, 477.68 KB

This evidence pack serves as permanent proof of Gate C/D closure
and can be referenced for future debugging or verification."
```

---

## Tag (Optional)

```powershell
# Create annotated tag
git tag -a p1.2-gateC-gateD-closed -m "P1.2: Gate C & D closed with evidence pack

- Gate C: Live Session Manager (single stream, abort determinism, limits)
- Gate D: Prometheus Metrics (7 metrics, Grafana dashboard, mock mode)
- Evidence pack: 32 files, 477.68 KB in evidence/p1.2_gateC_gateD_pack/

Closes P1.2 milestone."

# Push tags (if remote exists)
git push --follow-tags
```

---

## Release Note (Optional)

If creating a release:

```
## P1.2: Gate C & D Closure

### Gate C: Live Session Manager
- ✅ Single stream guarantee (dual panel support)
- ✅ Abort determinism (no error events on cancel)
- ✅ Limits enforcement (duration/tokens/chars)
- ✅ Zustand global store for state sync

### Gate D: Prometheus Metrics
- ✅ 7 SSE metrics (open/close/active/events/bytes/duration/invalid_drop)
- ✅ Request-based mock mode (`?mock=1` or `x-spark-mock:1`)
- ✅ Grafana dashboard (8 panels)
- ✅ Non-interactive smoke testing

### Technical Debt Fixes
- ✅ Debug button double request prevention
- ✅ Stream active check (button disabled when streaming)

### Evidence
- Full evidence pack: `evidence/p1.2_gateC_gateD_pack/` (32 files, 477.68 KB)
- All test artifacts (screenshots, logs, metrics)
- Technical debt documentation

### Usage
- Test URL: `http://127.0.0.1:3003/dashboard?debugLive=1&mock=1`
- Metrics: `http://127.0.0.1:3003/api/public/metrics.prom`
```

---

## Post-Commit Verification

```powershell
# 1. Verify commits
git log --oneline -2

# 2. Verify tag (if created)
git tag -l "p1.2-*"

# 3. Quick diff check
git show HEAD --stat  # Commit 2 (evidence)
git show HEAD~1 --stat  # Commit 1 (code)
```

---

## Alternative: Single Commit (If Preferred)

If your repo culture prefers single commits:

```powershell
# Stage everything
git add apps/ tools/ config/ deploy/ packages/ docs/ *.md evidence/p1.2_gateC_gateD_pack/

# Single commit
git commit -m "P1.2: Close Gate C/D (live session + metrics) with evidence

[Same message as Commit 1]

Evidence pack added in evidence/p1.2_gateC_gateD_pack/ (32 files, 477.68 KB)"
```

---

## Notes

- **Evidence Pack Location:** `evidence/p1.2_gateC_gateD_pack/`
- **Total Size:** 477.68 KB (32 files)
- **Binary Files:** Screenshots (PNG) and Grafana dashboard (JSON)
- **Recommendation:** Keep in repo for evidential discipline (can move to release assets later if needed)

