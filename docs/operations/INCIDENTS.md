# INCIDENTS - Operational Incident Log

## UI-RED-SCREENS (CLOSED)

**Date:** 2025-10-16 19:08:44
**Status:** CLOSED - GREEN
**Severity:** P1 (User-facing)

### Root Cause
ThemeToggle defaultâ†”named import mismatch in AppShell.tsx
- Component rendered as undefined
- React threw "Element type is invalid: expected a string... but got: undefined"

### Fix
1. Corrected import: `import ThemeToggle from "@/components/theme/ThemeToggle"`
2. Added must() guard for runtime undefined detection (dev-only)
3. Normalized shadcn imports to curly braces
4. Implemented App Shell architecture (single-scroll + single-bar)

### Evidence
- Location: `evidence/ui/ui-red-screens-closed_20251016_190249/`
- Files: incident-summary.txt, canary-dry-run.json, slo-health.json, alert-template.json

### Prevention
- ESLint: import/no-named-default:error, import/no-unresolved:error
- shadcn/ui: always direct + curly braces
- must() guard: dev-only undefined detection
- CI: lint+build gate

### Commit/Tag
- Commit: web-next: fix ThemeToggle default import + add must() guard
- Tag: v1.1.0-rc1 (UI stabilized; ready for Real Canary Evidence)

### Runbook
- Emergency: docs/operations/KIRMIZI_DUGME_RUNBOOK.md
- Post-mortem: This entry

---
