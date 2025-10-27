# DEV_MOCK Bayrağı - Prod Kapısı

## Mock Modu (DEV_MOCK=1)
- **Mini-executor:** `services/executor/tmp/mini-executor.cjs`
- **Mini UI:** `param-review.html`
- **Evidence:** `evidence/guardrails/audit.jsonl`
- **Smoke:** `scripts/ui-guardrails-smoke.ps1`

## Prod Modu (DEV_MOCK=0)
- **Gerçek Executor:** `services/executor/dist/index.cjs`
- **Next.js UI:** `apps/web-next`
- **Gerçek route'lar:** `/guardrails/params/*`
- **Build:** TypeScript + Fastify + Next.js

## Kullanım
```bash
# Mock modu (demo) - DEV_MOCK=1
$env:DEV_MOCK="1"
node services/executor/tmp/mini-executor.cjs
Start-Process "param-review.html"

# Prod modu (gerçek) - DEV_MOCK=0
$env:DEV_MOCK="0"
node services/executor/dist/index.cjs
cd apps/web-next && pnpm dev
```

## ⚠️ PROD CUTOVER: DEV_MOCK=0 ZORUNLU
- **Mini-executor:** DEV_MOCK=0'da devre dışı
- **param-review.html:** DEV_MOCK=0'da kullanılmaz
- **Gerçek Executor:** DEV_MOCK=0'da zorunlu
- **Next.js UI:** DEV_MOCK=0'da zorunlu

## GO/NO-GO Kriterleri
- ✅ /health 200, P95 < 500ms
- ✅ Pending→Approve→Deny→Pending zinciri 200
- ✅ audit.jsonl her işlemde artıyor
- ✅ UI proxy allowlist 403'te doğru davranıyor
- ✅ Sayaçlar artıyor: guardrails_approve_total, guardrails_deny_total