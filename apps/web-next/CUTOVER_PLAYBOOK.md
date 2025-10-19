# Mock → Prod Cutover Playbook

## Durum: HAZIR (Kod Katmanı)

**Build:** ✅ 61 routes + /healthz + middleware  
**TypeScript:** ✅ 0 errors (strict mode)  
**Adapters:** ✅ Postgres, S3, Redis (commented implementations)  
**Security:** ✅ Middleware (CSP, HSTS, trace propagation)

---

## ÖNKOŞULLAR

### 1. Environment Variables (Secrets Manager)

```bash
# Required
NEXT_PUBLIC_EXECUTOR_URL=https://executor.prod.yourdomain.com
AUDIT_DB_URL=postgresql://user:pass@pg-prod:5432/audit
REDIS_URL=redis://redis-prod:6379/0
S3_BUCKET=spark-evidence-prod
S3_REGION=eu-central-1
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
BUILD_SHA=${CI_COMMIT_SHA}

# Optional (Feature Flags)
FEATURE_AUTO_PAUSE=0.1          # Canary %10
FEATURE_BATCH_PROMOTE=1.0       # Full rollout
EVIDENCE_CLEANUP_RETENTION_DAYS=30
```

**Kabul Kriteri:**
```bash
printenv | grep -E '(KEY|SECRET|PASSWORD)' | wc -l
# Output: 0 (secrets dosyada değil, vault'tan enjekte)
```

### 2. Database Setup (Postgres)

**Schema (idempotent):**

```sql
-- apps/web-next/migrations/001_audit_log.sql
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('ok', 'err')),
  strategy_id TEXT,
  trace_id TEXT,
  details JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_trace ON audit_log (trace_id);

-- Partition by month (optional, for scale)
CREATE TABLE IF NOT EXISTS audit_log_2025_10 PARTITION OF audit_log
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

**Migration:**
```bash
psql $AUDIT_DB_URL < apps/web-next/migrations/001_audit_log.sql
```

**Kabul Kriteri:**
```sql
SELECT COUNT(*) FROM audit_log; -- 0 rows initially
\d audit_log; -- Schema matches
```

### 3. S3 Bucket + Lifecycle

**Bucket Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "EvidenceUpload",
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::ACCOUNT:role/web-next-prod"},
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::spark-evidence-prod/*"
  }]
}
```

**Lifecycle Rule:**

```json
{
  "Rules": [{
    "ID": "evidence-retention-30d",
    "Status": "Enabled",
    "Expiration": {"Days": 30},
    "Filter": {"Prefix": "evidence/"}
  }]
}
```

**Kabul Kriteri:**
```bash
aws s3 ls s3://spark-evidence-prod/
aws s3api get-bucket-lifecycle-configuration --bucket spark-evidence-prod
```

### 4. Redis Cluster

**Queues:**
```
alerts:deliver  (main queue)
alerts:dlq      (dead letter queue)
```

**Config:**
```yaml
# BullMQ settings
concurrency: 5
retryPolicy:
  maxAttempts: 3
  backoff:
    type: exponential
    delay: 1000  # 1s, 4s, 16s
```

**Kabul Kriteri:**
```bash
redis-cli -u $REDIS_URL PING
# Output: PONG
redis-cli -u $REDIS_URL KEYS "bull:alerts:*" | wc -l
# Output: > 0 (after first webhook)
```

### 5. Nginx Rate Limiting

**nginx.conf:**

```nginx
http {
  limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
  
  server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;
    
    location /api/ {
      limit_req zone=api burst=10 nodelay;
      limit_req_status 429;
      
      proxy_pass http://web-next:3003;
      proxy_set_header X-Trace-ID $request_id;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }
}
```

**Kabul Kriteri:**
```bash
for i in {1..65}; do curl -s -o /dev/null -w "%{http_code}\n" https://app/api/healthz; done | sort | uniq -c
# Output: 60× 200, 5× 429
```

---

## CUTOVER ADIMLAR

### Adım 1: Postgres Audit Aktifleştir

**Dosya:** `apps/web-next/src/lib/audit/postgres.ts`

1. Uncomment production implementation
2. Install dependency: `pnpm add pg`
3. Test connection:
   ```bash
   psql $AUDIT_DB_URL -c "SELECT 1"
   ```

**Kod Değişikliği:**

```typescript
// apps/web-next/src/app/api/audit/push/route.ts
import { writeAudit } from "@/lib/audit/postgres";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  
  // Try Postgres first
  const pgResult = await writeAudit({
    action: body.action,
    result: body.result,
    strategyId: body.strategyId,
    traceId: body.traceId,
    timestamp: body.timestamp,
    details: body.details
  });
  
  if (pgResult.ok) {
    return NextResponse.json({ ok: true, id: pgResult.id }, { status: 200 });
  }
  
  // Fallback to executor proxy
  const url = `${EXECUTOR_BASE}/audit/push`;
  const res = await fetchSafe(url, { method: "POST", body });
  return NextResponse.json(res.data ?? { ok: res.ok }, { status: 200 });
}
```

**Kabul:** RecentActions'ta `_mock` chip yok, audit kayıtları PG'den geliyor.

### Adım 2: S3 Evidence Upload

**Dosya:** `apps/web-next/src/lib/storage/s3.ts`

1. Uncomment production implementation
2. Install dependencies: `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
3. Test credentials:
   ```bash
   aws s3 ls s3://$S3_BUCKET
   ```

**Kod Değişikliği:**

```typescript
// apps/web-next/src/app/api/evidence/zip/route.ts
import { generatePresignedUpload } from "@/lib/storage/s3";

export async function POST(req: Request) {
  const { runId, jobId } = await req.json();
  
  // Generate S3 presigned URL
  const s3Result = await generatePresignedUpload(runId || jobId);
  
  if (!s3Result.ok) {
    // Fallback to executor
    const res = await fetchSafe(`${EXECUTOR_BASE}/evidence/zip`, { method: "POST", body: { runId, jobId } });
    return NextResponse.json(res.data, { status: 200 });
  }
  
  return NextResponse.json({
    ok: true,
    uploadUrl: s3Result.url,
    downloadUrl: s3Result.url.replace('PutObject', 'GetObject'), // Simplification
    key: s3Result.key,
    expiresAt: s3Result.expiresAt
  }, { status: 200 });
}
```

**Kabul:** Evidence ZIP indirme → S3 pre-signed URL, `_mock: false`.

### Adım 3: Redis Queue

**Dosya:** `apps/web-next/src/lib/queue/redis.ts`

1. Uncomment production implementation
2. Install dependencies: `pnpm add bullmq ioredis`
3. Test connection:
   ```bash
   redis-cli -u $REDIS_URL PING
   ```

**Kod Değişikliği:**

```typescript
// apps/web-next/src/app/api/alerts/queue/route.ts
import { getQueueStats, retryJob, purgeDLQ } from "@/lib/queue/redis";

export async function GET(req: Request) {
  const stats = await getQueueStats();
  return NextResponse.json(stats, { status: 200 });
}

export async function POST(req: Request) {
  const { action, jobId } = await req.json();
  
  if (action === "retry") {
    const result = await retryJob(jobId);
    return NextResponse.json(result, { status: 200 });
  }
  
  if (action === "purge_dlq") {
    const result = await purgeDLQ();
    return NextResponse.json(result, { status: 200 });
  }
  
  return NextResponse.json({ _err: "invalid action" }, { status: 400 });
}
```

**Kabul:** `/api/alerts/queue` gerçek Redis sayılarını döndürüyor.

### Adım 4: Guardrails Production Data

**Executor bağlantısı:** `/api/guardrails/read` mock'tan gerçeğe geçer.

**Kod (halihazırda hazır):**
```typescript
// apps/web-next/src/app/api/guardrails/read/route.ts
// Executor'dan gerçek veri geldiğinde _mock: false dönecek
```

**Kabul:** RiskGuardrailsWidget'ta `_mock` chip yok, `lastBreach` gerçek.

### Adım 5: Security Headers (Aktif)

**Dosya:** `apps/web-next/src/middleware.ts` (zaten yazıldı ✅)

**Doğrulama:**
```bash
curl -I https://app/dashboard | grep -E '(X-Content-Type|X-Frame|Strict-Transport)'
# Output:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000
```

**Kabul:** Security headers aktif, CSP violations yok.

---

## DUMAN TEST PAKETİ

### 1. Health Check

```bash
curl -s http://localhost:3003/api/healthz | jq '.'
# Expected:
# {
#   "ok": true,
#   "buildSha": "abc123...",
#   "environment": "production",
#   "uptimeSec": 3600,
#   "version": "1.5.0",
#   "checks": { "memory": true, "uptime": true }
# }
```

### 2. Audit Postgres Write/Read

```bash
# Write
curl -s -X POST http://localhost:3003/api/audit/push \
  -H 'Content-Type: application/json' \
  -d '{"action":"smoke.test","result":"ok","timestamp":'$(date +%s000)',"traceId":"smoke-'$(uuidgen)'"}' \
  | jq '.ok'
# Expected: true

# Read
curl -s -X POST http://localhost:3003/api/audit/list \
  -d '{"limit":5}' \
  | jq '._mock, .items[0].action'
# Expected: false (or null), "smoke.test"
```

### 3. Evidence ZIP (S3)

```bash
curl -s -X POST http://localhost:3003/api/evidence/zip \
  -H 'Content-Type: application/json' \
  -d '{"runId":"smoke-evidence-'$(date +%s)'"}' \
  | jq '._mock, .downloadUrl'
# Expected: false (or null), "https://s3.eu-central-1.amazonaws.com/..."
```

### 4. Rate Limit (Nginx)

```bash
for i in {1..65}; do 
  curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3003/api/healthz
done | sort | uniq -c
# Expected:
#  60 200
#   5 429
```

### 5. Guardrails Real Data

```bash
curl -s http://localhost:3003/api/guardrails/read | jq '._mock, .thresholds'
# Expected: false (or null), { "maxDrawdown": 0.15, ... }
```

### 6. Webhook Queue (Redis)

```bash
curl -s http://localhost:3003/api/alerts/queue | jq '.pending, .dlq, ._err'
# Expected: <number>, <number>, null (no error)
```

### 7. TraceId Copy (Manual)

1. Dashboard → RecentActions
2. Click TraceId rozet
3. Toast: "TraceId Kopyalandı"
4. Paste: `ui-1728...`

### 8. Snapshot Export (Build SHA)

```bash
curl -s -X POST http://localhost:3003/api/snapshot/export \
  -H 'Content-Type: application/json' \
  -d '{"format":"csv","hours":24}' \
  > snapshot.csv

head -n 5 snapshot.csv
# Expected:
# # Spark Trading Platform - Snapshot Export
# # Environment: production
# # Build SHA: abc123...
# # Exported At: 2025-10-14T...
# # Period: 24 hours
```

---

## KABUL KRİTERLERİ (Go/No-Go)

| Kriter | Test | Beklenen | Durum |
|--------|------|----------|-------|
| **Health OK** | `curl /api/healthz` | `ok: true` | ⛳ Test |
| **Audit Postgres** | `_mock` in `/api/audit/list` | `false` veya yok | ⛳ Test |
| **Evidence S3** | `downloadUrl` in `/api/evidence/zip` | `s3://...` veya CDN | ⛳ Test |
| **Rate Limit** | 65 requests | 60× 200, 5× 429 | ⛳ Test |
| **Guardrails** | `_mock` in `/api/guardrails/read` | `false` veya yok | ⛳ Test |
| **Queue Stats** | `/api/alerts/queue` | Real numbers, no `_err` | ⛳ Test |
| **Security Headers** | `curl -I /` | CSP, HSTS, X-Frame | ✅ Aktif |
| **TraceId Copy** | UI click | Toast + clipboard | ✅ Aktif |
| **Build SHA** | Snapshot CSV header | `# Build SHA: ...` | ✅ Aktif |

**Go Eşiği:** 6/9 kabul (Audit, S3, Rate, Guardrails, Queue, Health)

---

## ROLLOUT STRATEJİSİ

### Canary (%10, 30dk)

```bash
export FEATURE_AUTO_PAUSE=0.1
./scripts/deploy.sh --canary --wait 30m

# Monitoring
./scripts/health-check.sh --tail 30m
# Watch: P95 < 1500ms, Error < 2%, 429 < 5%
```

**Kabul:** P95 < 1500ms, Error < 2%, Audit insert hızı > 10/min

### Staged (%50, 1h)

```bash
export FEATURE_AUTO_PAUSE=0.5
./scripts/deploy.sh --staged --wait 1h
```

**Kabul:** Metrikler stabil, audit PG yazma gecikme < 100ms

### Production (%100, izleme 24h)

```bash
export FEATURE_AUTO_PAUSE=1.0
export FEATURE_BATCH_PROMOTE=1.0
./scripts/deploy.sh --production
```

**Kabul:** 24h boyunca P95 < 1200ms, error < 1%, breach auto-pause tetikleniyor

---

## ROLLBACK PLANI

### Hızlı Rollback (< 5dk)

```bash
# 1. Nginx upstream → previous revision
./scripts/deploy.sh --rollback

# 2. Feature flags OFF
export FEATURE_AUTO_PAUSE=0
export FEATURE_BATCH_PROMOTE=0

# 3. Evidence cleanup lock (önlem)
export EVIDENCE_CLEANUP_DRY_RUN=true

# 4. Reload
systemctl reload nginx
pm2 reload web-next
```

**Kabul:** UI eski revizyonda, `_mock` chip'leri geri geldi (graceful degradation)

### Veri Rollback (PG/S3 intact)

- **Audit log:** Postgres'te kalır (silinmez, sadece read executor proxy'ye döner)
- **Evidence:** S3'te kalır (lifecycle devam eder)
- **Queue:** Redis flush etmeyin, job'lar retry edecek

---

## PRODUCTION INTEGRATION CHECKLIST

### lib/audit/postgres.ts

- [ ] Uncomment production code
- [ ] Install: `pnpm add pg @types/pg`
- [ ] Test: `AUDIT_DB_URL` env var
- [ ] Migration: `001_audit_log.sql` çalıştırıldı
- [ ] Index verify: `\d audit_log`

### lib/storage/s3.ts

- [ ] Uncomment production code
- [ ] Install: `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] Test: `S3_BUCKET`, `S3_REGION` env var
- [ ] Bucket policy: upload/download izinleri
- [ ] Lifecycle rule: 30d expiration

### lib/queue/redis.ts

- [ ] Uncomment production code
- [ ] Install: `pnpm add bullmq ioredis`
- [ ] Test: `REDIS_URL` env var
- [ ] Queue init: `alerts:deliver`, `alerts:dlq`
- [ ] Worker: webhook delivery processor

### middleware.ts

- [x] Security headers aktif ✅
- [ ] CSP: `connect-src` executor URL güncelle
- [ ] HSTS: Production HTTPS verify
- [ ] Trace propagation: x-trace-id test

### API Routes (Integration Points)

- [ ] `/api/audit/push` → Postgres fallback executor
- [ ] `/api/audit/list` → Postgres read
- [ ] `/api/evidence/zip` → S3 presigned upload
- [ ] `/api/evidence/archive` → S3 metadata store
- [ ] `/api/alerts/queue` → Redis stats
- [ ] `/api/alerts/webhook` → BullMQ enqueue

---

## KABUL ONAY ŞABLONU

```markdown
## Cutover Approval: Mock → Prod

**Date:** 2025-10-14  
**Version:** v1.5.0 → v1.5.1 (production-ready)  
**Approver:** [DevOps Lead / Tech Lead]

### Kabul Kriterleri

- [x] TypeScript: 0 errors
- [x] Build: Clean, 61 routes
- [ ] Health: `/api/healthz` → 200 + buildSha
- [ ] Audit: Postgres write/read working, `_mock: false`
- [ ] Evidence: S3 upload working, presigned URLs
- [ ] Rate Limit: Nginx 60rpm enforced, UI countdown
- [ ] Security: Headers active (CSP, HSTS, X-Frame)
- [ ] Monitoring: Grafana dashboards live

### Go/No-Go

**Decision:** [ ] GO  [ ] NO-GO  [ ] GO with caveats

**Caveats:**
- Canary %10 first 30min
- Rollback script tested
- Oncall rotation active

**Signatures:**
- DevOps: ________________
- Backend: ________________
- Frontend: _______________
```

---

## SONRAKİ ADIMLAR (v2.0)

### 1. ML Signal Fusion Veri Sözleşmesi

```typescript
// lib/ml/signals.ts
export type SignalData = {
  timestamp: number;
  symbol: string;
  indicators: {
    ema_fast: number;
    ema_slow: number;
    rsi: number;
    atr: number;
  };
  features: {
    crossover: boolean;
    momentum: number;
    volatility: number;
  };
  audit: {
    traceId: string;
    buildSha: string;
  };
};
```

### 2. OpenTelemetry Trace Şema

```typescript
// lib/observability/otel.ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('web-next', process.env.BUILD_SHA);

export function traceAPICall(name: string, attributes: Record<string, any>) {
  return tracer.startActiveSpan(name, { attributes });
}
```

### 3. Veri Hijyeni (Schema Versioning)

```typescript
// lib/validation/schema.ts
import { z } from 'zod';

export const AuditEntryV1 = z.object({
  version: z.literal('1.0'),
  action: z.string(),
  result: z.enum(['ok', 'err']),
  timestamp: z.number(),
  traceId: z.string().optional(),
  details: z.string().optional()
});

export type AuditEntry = z.infer<typeof AuditEntryV1>;
```

---

## ÖZET

**Hazır Olanlar (Kod):**
- ✅ Adapter layer (Postgres, S3, Redis) - commented implementations
- ✅ Security middleware (CSP, HSTS, trace propagation)
- ✅ Health endpoint (/healthz)
- ✅ Build SHA metadata (snapshot/evidence)
- ✅ TraceId clipboard copy
- ✅ Graceful degradation (all routes)

**Bekleyen (Altyapı):**
- ⛳ Secrets Manager injection
- ⛳ Postgres migration
- ⛳ S3 bucket + lifecycle
- ⛳ Redis cluster
- ⛳ Nginx rate limiting
- ⛳ Prometheus/Grafana

**Cutover Süresi:** 2-4 saat (altyapı hazırsa)

**Rollback Süresi:** < 5 dakika

**Kabul Eşiği:** 6/9 kritik test PASS

---

**NOT:** Adapter'lar commented implementation olarak hazır. Production'da uncomment edip dependency'leri install edin. Graceful degradation sayesinde kısmi migration mümkün (örn: önce Postgres, sonra S3, sonra Redis).

