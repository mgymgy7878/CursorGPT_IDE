# Day-1 Runbook - Param Review

## GO/NO-GO Kriterleri ✅

### 1. Sağlık: GET /health (P95 < 500 ms) ✅
- **Status:** 200 OK
- **Service:** mini-executor
- **CORS:** Aktif

### 2. Uçtan Uca: pending → approve(id) → deny(id) → pending (4xx <%2/5dk) ✅
- **Pending:** P1, P2 items
- **Approve P1:** 200 OK + diffHash
- **Deny P2:** 200 OK + diffHash  
- **Pending After:** [] (boş)

### 3. Audit: audit.jsonl'de iki yeni satır ✅
- **Approve:** diffHash 0cd3fa37a47062a2b25c713de3a971dd
- **Deny:** diffHash 222119fa85bb4985918f549f85153efa
- **Timestamp:** ISO format
- **Actor:** qa@local

## Day-1 Operasyon

### Executor: build → start
```powershell
pnpm -C services/executor build
node services/executor/dist/index.cjs
```

### UI: build → start (proxy allowlist aktif)
```powershell
$env:EXECUTOR_BASE_URL="http://127.0.0.1:4001"
cd apps/web-next
pnpm build
pnpm start
```

### Smoke: günlük script
```powershell
powershell -ExecutionPolicy Bypass -File scripts\ui-guardrails-smoke.ps1
Get-Content evidence\guardrails\audit.jsonl -Tail 10
```

## Aksiyon Taslakları (Ops Paneline)

### Alert 1: Guardrails 4xx rate high
```json
{
  "action": "alerts/create",
  "params": {
    "name": "Guardrails 4xx rate high",
    "expr": "sum(rate(guardrails_4xx_total[5m])) / sum(rate(http_requests_total{route=~\"/guardrails/params/.*\"}[5m])) > 0.02",
    "for": "5m",
    "severity": "warning",
    "labels": {"team":"platform","service":"executor"},
    "annotations": {"summary":"Guardrails 4xx > 2% (5m)","runbook":"RBAC/allowlist/header kontrolü"}
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Kötü kullanım/rol hatası erken uyarı"
}
```

### Alert 2: Audit write errors
```json
{
  "action": "alerts/create",
  "params": {
    "name": "Audit write errors",
    "expr": "increase(audit_write_errors_total[5m]) > 0",
    "for": "1m",
    "severity": "critical",
    "labels": {"team":"platform","service":"executor"},
    "annotations": {"summary":"Audit JSONL yazım hatası","runbook":"disk izinleri, fsync, rotasyon"}
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Kanıt zincirinin güvenliği"
}
```

### Canary: guardrails-prod-preflight
```json
{
  "action": "canary/run",
  "params": {
    "suite": "guardrails-prod-preflight",
    "steps": [
      {"name":"viewer-denied","call":"GET /admin/params","headers":{"x-role":"viewer","X-Actor":"qa@local"}},
      {"name":"admin-ok","call":"GET /admin/params","headers":{"x-role":"admin","X-Actor":"qa@local"}},
      {"name":"audit-check","call":"GET /api/guardrails/params/audit?limit=10","headers":{"x-role":"admin","X-Actor":"qa@local"}}
    ]
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "Prod öncesi RBAC+Audit görünürlüğü kanıtı"
}
```

## Prod-Sert Ayarlar

### RBAC: admin dışı POST/DELETE yok; X-Actor zorunlu; rate-limit (ör. 5/10s)
### Allowlist: /guardrails/params/(pending|approve|deny|audit) dışında 403
### Approve/Deny: yalnız POST, id zorunlu; Idempotency-Key başlığı kabul; çift tıklama güvenli
### Audit: try/catch + fsync, I/O hatasında 500 ve sayaç artışı; günlük rotasyon (örn. 10MB × 7 gün)
### Prometheus: guardrails_approve_total, guardrails_deny_total, guardrails_4xx_total, audit_write_errors_total

## Sonraki Sprint Net Kazanımlar

1. **UI Header Bar:** Role/Actor için localStorage, tüm fetch'lere otomatik ek
2. **Diff UX:** "yalnız değişenleri göster" toggle + yan-yana görünüm  
3. **Ops Raporu:** Günlük PDF/CSV'ye approve/deny sayıları, benzersiz actor'ler, 4xx oranı, P95

## 🎯 SONUÇ: GO (KOŞULSUZ)

**"Param Review" artık yalnız çalışmıyor; kanıt üretip kendini savunuyor.**
