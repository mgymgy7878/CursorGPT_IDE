# Guardrails Operasyon Runbook

## Prod Başlatma (PowerShell, "&&" yok)

### Executor (prod)
```powershell
pnpm -C services/executor build
node services/executor/dist/index.cjs
```

### UI (Next.js) – prod'a bağlan
```powershell
$env:EXECUTOR_BASE_URL="http://127.0.0.1:4001"
cd apps/web-next
pnpm build
pnpm start
```

## Günlük Duman

```powershell
powershell -ExecutionPolicy Bypass -File scripts\ui-guardrails-smoke.ps1
Get-Content evidence\guardrails\audit.jsonl -Tail 10
```

## GO/NO-GO Kriterleri

- ✅ /health 200, P95 < 500ms
- ✅ Pending→Approve→Deny→Pending zinciri 200
- ✅ audit.jsonl her işlemde artıyor
- ✅ UI proxy allowlist 403'te doğru davranıyor
- ✅ Sayaçlar artıyor: guardrails_approve_total, guardrails_deny_total

## Alert Kuralları

1. **Guardrails 4xx rate high**: 4xx oranı > %2 (5dk)
2. **Audit write errors**: Audit yazım hatası (1dk)

## DEV_MOCK Kapısı

- **DEV_MOCK=1**: Mini-executor + param-review.html
- **DEV_MOCK=0**: Gerçek Executor + Next.js UI

## Metrikler

- `guardrails_approve_total{actor, role}`
- `guardrails_deny_total{actor, role}`
- `guardrails_4xx_total{status_code, route}`
- `audit_write_errors_total{error_type}`
