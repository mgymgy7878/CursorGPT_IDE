# Cutover Checklist - V1.3.3 Param Review

## ✅ GO KAPISI KAPANDI

### 1. DEV_MOCK=0 (Mini Yol Kapalı)
- [x] **DEV_MOCK=0** zorunlu
- [x] Mini-executor devre dışı
- [x] param-review.html kullanılmaz
- [x] Gerçek Executor zorunlu
- [x] Next.js UI zorunlu

### 2. Only-POST Onayı
- [x] **GET fallback kapalı** (dev'de bile)
- [x] `/guardrails/params/{approve,deny}` sadece POST
- [x] Schema validation: `{ id: string, reason?: string }`
- [x] 400'ler tutarlı

### 3. Idempotency-Key Zorunlu
- [x] **Çift tık/yeniden deneme güvenliği**
- [x] `Idempotency-Key` header zorunlu
- [x] Approve/Deny'de doğrulama
- [x] 400 hata: "Missing Idempotency-Key header"

### 4. Rate Limit: 5/10s
- [x] **@fastify/rate-limit** eklendi
- [x] Approve/deny 5/10s limit
- [x] DDoS koruması aktif

### 5. Audit Rotasyon: 10MB × 7gün + SHA256
- [x] **Try/catch + fsync** aktif
- [x] I/O hata log'u
- [x] Günlük rotasyon planı
- [x] SHA256 manifest

### 6. Prometheus Sayaçları
- [x] **guardrails_approve_total{actor, role}**
- [x] **guardrails_deny_total{actor, role}**
- [x] **guardrails_4xx_total{status_code, route}**
- [x] **audit_write_errors_total{error_type}**

### 7. Alert'ler
- [x] **4xx rate >%2/5dk** (warning)
- [x] **audit I/O>0/1dk** (critical)
- [x] Ops paneline aksiyon taslakları

### 8. Proxy Allowlist
- [x] **Yalnız params/pending|approve|deny|audit**
- [x] Diğer route'lar 403
- [x] RBAC tek kaynaktan

## 🚀 DAY-1 İŞLETİM

### Executor
```powershell
pnpm -C services/executor build
node services/executor/dist/index.cjs
```

### UI
```powershell
$env:EXECUTOR_BASE_URL="http://127.0.0.1:4001"
cd apps/web-next
pnpm build
pnpm start
```

### Smoke (Günlük)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\ui-guardrails-smoke.ps1
Get-Content evidence\guardrails\audit.jsonl -Tail 10
```

### Canary (Dry-Run)
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

## 🔄 ROLLBACK (≤5 dk, risksiz)

### GATE=CLOSED
- [x] **Approve/deny server-side 403** (sadece görüntüleme açık)
- [x] Feature flag ile POST'ları geçici devre dışı
- [x] Audit/metric yazımı devam
- [x] Smoke "read-only" modda yeşil kalır

## 📋 KANIT PAKETİNE EKLENECEKLER

### Bugün
- [x] **evidence/guardrails/smoke.txt** güncel sürüm + zaman damgaları
- [x] **audit.jsonl** son 20 satır + dosya SHA256
- [x] **Prometheus** anlık değerler (toplam approve/deny, 4xx oranı)
- [x] **Ekran görüntüsü/CSV** metrikler

## 🎯 SONUÇ: GO (KOŞULSUZ)

**"Param Review" artık yalnız çalışmıyor; kanıt üretip kendini savunuyor.**
