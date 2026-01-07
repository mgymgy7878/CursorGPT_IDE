# Gate C + Gate D: Commit Guide

**Date:** 2026-01-07
**Status:** ✅ READY FOR COMMIT

---

## Commit Strategy

### Option 1: Two Commits (Recommended)

**Commit 1: Code Changes**
```
P1.2: Close Gate C/D (live session + metrics) with request-based mock

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

Test: pnpm -r typecheck && pnpm -r lint
```

**Commit 2: Evidence Archive**
```
P1.2: Add Gate C/D evidence pack

Evidence pack includes:
- Gate D: smoke metrics, Prometheus excerpts, Grafana dashboard
- Gate C: T1/T2/T3 test results, console logs, screenshots
- Technical debt documentation
- Final closure summary

Total: 32 files, 477.68 KB

This evidence pack serves as permanent proof of Gate C/D closure
and can be referenced for future debugging or verification.
```

### Option 2: Single Commit

If your repo culture prefers single commits:
```
P1.2: Close Gate C/D (live session + metrics) with evidence

[Same as Commit 1 message above]

Evidence pack added in evidence/p1.2_gateC_gateD_pack/ (32 files, 477.68 KB)
```

---

## Pre-Commit Checklist

- [x] Code changes complete
- [x] Tests passing (T1/T2/T3 + verify)
- [x] Evidence pack created
- [x] Technical debt documented
- [x] Debug button fixes applied
- [ ] `pnpm -r typecheck` passes
- [ ] `pnpm -r lint` passes
- [ ] Git status clean (no untracked files)

---

## Post-Commit Actions

1. Create tag (optional):
   ```bash
   git tag -a p1.2-gateC-gateD-closed -m "Gate C/D closure with evidence"
   ```

2. Create release note (if applicable):
   - Reference evidence pack location
   - Highlight key improvements (mock mode, Zustand store, debug button)
   - Note technical debt fixes

3. Update project documentation:
   - Add evidence pack location to project README
   - Document mock mode usage for future tests

---

## Evidence Pack Location

```
evidence/p1.2_gateC_gateD_pack/
├── FINAL_CLOSURE_SUMMARY.md
├── TECHNICAL_DEBT.md
├── COMMIT_GUIDE.md (this file)
├── gateC_*.txt
├── gateD_*.txt
├── gateD_grafana_dashboard.json
└── artifacts/
    ├── gateC/ (screenshots, logs)
    └── gateD/ (metrics, summaries)
```

---

## Gate E Starter Kit (Future)

When ready for Gate E (Prod Debugability):
- `prometheus_rules.yml` (3 low-noise alerts)
- Grafana import runbook (1-page guide)
- Prod-safe debugability checklist (ops + dev)

Ready to generate on request.

