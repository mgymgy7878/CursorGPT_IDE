# Validation & Sign-off Checklist

**Geçme eşiği:** Komut çıktıları beklendiği gibi + CI yeşil + metrikler nominal.

---

## ✅ 1. Position Kısmi UNIQUE İndeks

**Amaç:** `strategyId` nullable iken tekilleşme.

### Doğrulama SQL

```sql
-- İndeksi gör
\d "Position"
-- Beklenen: uniq_pos_strategy (partial) USING btree (strategyId, symbol, exchange) WHERE strategyId IS NOT NULL

-- Pozitif test (tekillik)
BEGIN;
INSERT INTO "Position"(id,symbol,exchange,quantity,avgPrice) 
VALUES ('p_null_1','BTCUSDT','binance',0,0); -- strategyId NULL: birden çok satıra izin

INSERT INTO "Position"(id,symbol,exchange,quantity,avgPrice) 
VALUES ('p_null_2','BTCUSDT','binance',0,0); -- OK: NULL farklı değerlendirilir

INSERT INTO "Position"(id,strategyId,symbol,exchange,quantity,avgPrice) 
VALUES ('p_s1','s1','BTCUSDT','binance',0,0);

-- Negatif test (çatışma beklenir)
INSERT INTO "Position"(id,strategyId,symbol,exchange,quantity,avgPrice) 
VALUES ('p_s1_dup','s1','BTCUSDT','binance',0,0);
-- Beklenen: ERROR: duplicate key value violates unique constraint "uniq_pos_strategy"

ROLLBACK;
```

### Evidence Kaydı

```bash
# Test sonucunu kaydet
psql $DATABASE_URL -f scripts/validate-position-unique.sql > evidence/position_unique_validation.log 2>&1
```

### ✅ Geçme Kriterleri

- [ ] İndeks `uniq_pos_strategy` mevcut ve `WHERE strategyId IS NOT NULL` içeriyor
- [ ] NULL strategyId ile birden çok satır eklenebiliyor
- [ ] Aynı strategyId+symbol+exchange ile ikinci insert UNIQUE violation veriyor
- [ ] Evidence dosyası `evidence/position_unique_validation.log` oluşturuldu

---

## ✅ 2. Idempotency: ON CONFLICT + 409 Retry-After

**Amaç:** Aynı anahtarın yarışını kesmek, istemciye doğru sinyal vermek.

### Doğrulama Komutları

```bash
# İlk istek (gerçek yürütme)
curl -i -X POST http://localhost:3003/api/exec/order \
  -H "X-Idempotency-Key: smoke-123" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","type":"market","quantity":0.01,"strategyId":"s1"}' \
  | tee evidence/idempotency_first.log

# Paralel/tekrarlı (409 + Retry-After beklenir)
curl -i -X POST http://localhost:3003/api/exec/order \
  -H "X-Idempotency-Key: smoke-123" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","type":"market","quantity":0.01,"strategyId":"s1"}' \
  | tee evidence/idempotency_duplicate.log

# Beklenen: HTTP/1.1 409 + Retry-After: 2
```

### Database Kontrolü

```sql
-- Idempotency key durumunu kontrol et
SELECT key, status, operation, created_at, updated_at, ttl_at 
FROM "IdempotencyKey" 
WHERE key = 'smoke-123';

-- Beklenen: 1 satır, status = 'COMPLETED' veya 'PENDING'
```

### ✅ Geçme Kriterleri

- [ ] İlk istek 200 OK veya 201 Created dönüyor
- [ ] Duplicate istek 409 Conflict dönüyor
- [ ] Response header'da `Retry-After: 2` mevcut
- [ ] Database'de sadece 1 IdempotencyKey kaydı var
- [ ] Evidence dosyaları oluşturuldu

---

## ✅ 3. Decimal-Only Para Aritmetiği

**Amaç:** number sızıntısını yakalamak, tek noktadan tick/rounding.

### Test Suite

```typescript
// services/shared/lib/__tests__/money.test.ts
import { MoneyUtils } from '../money';

describe('Money Utils', () => {
  test('float hatası yok', () => {
    const result = MoneyUtils.multiply(
      MoneyUtils.fromString('0.1'), 
      MoneyUtils.fromString('0.2')
    );
    expect(result.toString()).toBe('0.02');
  });

  test('tick hizası', () => {
    const price = MoneyUtils.fromString('123.4567');
    const tick = MoneyUtils.fromString('0.01');
    const aligned = MoneyUtils.alignToTick(price, tick);
    expect(aligned.toString()).toBe('123.46');
  });

  test('P&L hesaplama', () => {
    const entryPrice = MoneyUtils.fromString('100.00');
    const currentPrice = MoneyUtils.fromString('105.50');
    const quantity = MoneyUtils.fromString('10');
    
    const pnl = MoneyUtils.profitLoss(entryPrice, currentPrice, quantity);
    expect(pnl.toString()).toBe('55.00');
  });

  test('commission calculation', () => {
    const amount = MoneyUtils.fromString('1000.00');
    const rate = MoneyUtils.fromString('0.001');
    
    const commission = MoneyUtils.commission(amount, rate);
    expect(commission.toString()).toBe('1.00');
    
    const net = MoneyUtils.netAmount(amount, rate);
    expect(net.toString()).toBe('999.00');
  });

  test('weighted average', () => {
    const values = [
      MoneyUtils.fromString('100'),
      MoneyUtils.fromString('110'),
      MoneyUtils.fromString('105'),
    ];
    const weights = [
      MoneyUtils.fromString('1'),
      MoneyUtils.fromString('2'),
      MoneyUtils.fromString('3'),
    ];
    
    const avg = MoneyUtils.weightedAverage(values, weights);
    expect(avg.toString()).toBe('106.666666666666666667');
  });
});
```

### ESLint Rule (Float Sızıntısı Önleme)

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "BinaryExpression[operator='*'][left.type='Identifier'][right.type='Identifier']",
        "message": "Use MoneyUtils.multiply() for financial calculations instead of * operator"
      },
      {
        "selector": "BinaryExpression[operator='/'][left.type='Identifier'][right.type='Identifier']",
        "message": "Use MoneyUtils.divide() for financial calculations instead of / operator"
      }
    ]
  }
}
```

### ✅ Geçme Kriterleri

- [ ] Tüm money tests geçiyor (`pnpm test money.test.ts`)
- [ ] ESLint float sızıntısı kuralı aktif
- [ ] Codebase'de `price * qty` gibi direkt number kullanımı yok
- [ ] Evidence: test coverage > 95%

---

## ✅ 4. CSP/COEP Ön-Prod Smoke

**Amaç:** İzolasyon açık, 3rd-party envanteri net, raporlama çalışıyor.

### Header Kontrolü

```bash
# Security headers
curl -I http://localhost:3003 | grep -i -E 'content-security-policy|cross-origin|strict-transport-security'

# Beklenen:
# Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...'; ...
# Cross-Origin-Embedder-Policy: require-corp
# Cross-Origin-Opener-Policy: same-origin
# Cross-Origin-Resource-Policy: same-origin
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CSP Rapor Uç Noktası

```bash
# CSP violation report test
curl -i -X POST http://localhost:3003/api/csp-report \
  -H "Content-Type: application/csp-report" \
  --data '{
    "csp-report": {
      "document-uri": "http://localhost:3003",
      "violated-directive": "img-src",
      "blocked-uri": "https://evil.com/image.png"
    }
  }'

# Beklenen: 204 No Content
# Evidence: evidence/csp_reports.log güncellenir
```

### PowerShell Smoke Test

```powershell
# Comprehensive security header test
.\scripts\csp-coep-smoke-test.ps1 -BaseUrl "http://localhost:3003" -Verbose
```

### ✅ Geçme Kriterleri

- [ ] CSP header mevcut ve nonce/hash içeriyor
- [ ] COEP: require-corp aktif
- [ ] COOP: same-origin aktif
- [ ] HSTS: max-age >= 15552000 (6 ay)
- [ ] CSP report endpoint 204 dönüyor ve logluyor
- [ ] PowerShell smoke test PASS
- [ ] Evidence: `evidence/csp_smoke_*.txt`

---

## ✅ 5. Postgres PITR + pgBouncer

**Amaç:** An'a kadar geri yükleme, bağlantı havuzu sağlıklı.

### PITR Parametreleri

```sql
-- PITR parametreleri
SHOW archive_mode;         -- on
SHOW archive_command;      -- wal-g / rsync hedefi
SHOW wal_level;            -- replica
SELECT now(), pg_current_wal_lsn();

-- Backup status
SELECT * FROM backup_status;
SELECT * FROM backup_dashboard;
SELECT * FROM check_backup_alerts();
```

### pgBouncer Sağlık

```bash
# Connect through pgBouncer
psql "postgresql://spark_user:password@localhost:6432/spark_trading"

# Check pools
SHOW POOLS;
SHOW STATS;
SHOW DATABASES;

# Expected output:
# database | user | cl_active | cl_waiting | sv_active | sv_idle | sv_used | sv_tested | sv_login | maxwait
# spark_trading | spark_user | 5 | 0 | 3 | 2 | 20 | 0 | 0 | 0
```

### Mini-Prova (Staging)

```bash
# 1. Note current LSN
psql -c "SELECT pg_current_wal_lsn();" > evidence/pitr_lsn_before.txt

# 2. Make a test change
psql -c "UPDATE \"Position\" SET quantity = quantity + 1 WHERE id = 'test_pos_1';"

# 3. Note LSN after change
psql -c "SELECT pg_current_wal_lsn();" > evidence/pitr_lsn_after.txt

# 4. Simulate restore to before change (see runbook)
# (In production, this would be a full restore procedure)

# 5. Verify application health after restore
curl -f http://localhost:4001/api/healthz
```

### ✅ Geçme Kriterleri

- [ ] `archive_mode = on`
- [ ] `wal_level = replica`
- [ ] WAL files archiving successfully (no failed archives)
- [ ] pgBouncer pools responding
- [ ] Connection pooling working (cl_active + cl_waiting < max_client_conn)
- [ ] Mini-prova successful (restore test)
- [ ] Evidence: `evidence/pitr_*.txt`, `evidence/pgbouncer_stats.txt`

---

## 🚨 İlk 48 Saat "Kırmızı Bayrak" Monitörü

### Critical Metrics to Watch

```promql
# Risk blocks (beklenmedik artış)
rate(spark_risk_block_total{reason=~"notional|exposure|drawdown"}[5m]) > 0.1

# pgBouncer pool saturation
pgbouncer_pools_server_active / pgbouncer_pools_server_total > 0.9

# HTTP latency P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.2

# CSP violations
rate(csp_violations_total[5m]) > 1

# Idempotency conflicts
rate(idempotency_conflict_total[5m]) / rate(http_requests_total[5m]) > 0.01
```

### Alert Configuration

```yaml
# alert.rules.yml additions
groups:
  - name: validation_alerts
    rules:
      - alert: RiskBlockRateHigh
        expr: rate(spark_risk_block_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Risk blocks increasing"
          description: "Risk block rate is {{ $value }}/s"

      - alert: PgBouncerPoolSaturation
        expr: pgbouncer_pools_server_active / pgbouncer_pools_server_total > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "pgBouncer pool saturation"
          description: "Pool utilization is {{ $value | humanizePercentage }}"

      - alert: HTTPLatencyHigh
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High HTTP latency"
          description: "P95 latency is {{ $value }}s"

      - alert: CSPViolationsHigh
        expr: rate(csp_violations_total[5m]) > 1
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "CSP violations detected"
          description: "CSP violation rate is {{ $value }}/s"

      - alert: IdempotencyConflictRateHigh
        expr: rate(idempotency_conflict_total[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High idempotency conflict rate"
          description: "Conflict rate is {{ $value | humanizePercentage }}"
```

---

## 📋 Final Sign-off Checklist

### Pre-Production

- [ ] All 5 validation tests PASS
- [ ] Evidence files collected in `evidence/` directory
- [ ] CI pipeline GREEN
- [ ] Metrics nominal (no red flags)
- [ ] Rollback plan documented and tested
- [ ] Runbook reviewed and accessible

### Production Deployment

- [ ] Feature flag ready (if applicable)
- [ ] Monitoring dashboard configured
- [ ] Alerts configured and tested
- [ ] On-call team notified
- [ ] Rollback window identified
- [ ] Backup verification completed

### Post-Deployment (First 48h)

- [ ] All metrics within expected ranges
- [ ] No critical alerts fired
- [ ] User feedback collected
- [ ] Performance baselines established
- [ ] Incident response tested
- [ ] Documentation updated

---

## 📊 Evidence Collection

All validation runs should produce evidence files:

```bash
evidence/
├── position_unique_validation.log
├── idempotency_first.log
├── idempotency_duplicate.log
├── money_test_coverage.txt
├── csp_smoke_*.txt
├── pitr_lsn_before.txt
├── pitr_lsn_after.txt
├── pgbouncer_stats.txt
└── validation_summary.md
```

### Generate Summary

```bash
# Create validation summary
cat > evidence/validation_summary.md << EOF
# Validation Summary - $(date +%Y-%m-%d)

## Test Results

1. Position Unique Index: ✅ PASS
2. Idempotency: ✅ PASS
3. Money Utils: ✅ PASS
4. CSP/COEP: ✅ PASS
5. PITR/pgBouncer: ✅ PASS

## Evidence Files

- Position unique: position_unique_validation.log
- Idempotency: idempotency_*.log
- Money tests: money_test_coverage.txt
- CSP smoke: csp_smoke_*.txt
- PITR: pitr_*.txt

## Metrics Baseline

- HTTP P95 latency: XXXms
- pgBouncer pool utilization: XX%
- Idempotency conflict rate: X.XX%
- CSP violation rate: X/min

## Sign-off

- Validated by: [Name]
- Date: $(date)
- Status: APPROVED FOR PRODUCTION
EOF
```

---

## 🔄 Rollback Triggers

Automatic rollback if:

1. **Error rate > 5%** for 5 consecutive minutes
2. **P95 latency > 2x baseline** for 10 minutes
3. **Database connection failures > 10** in 1 minute
4. **Critical alert fired** (severity: critical)
5. **Manual trigger** from on-call team

### Rollback Procedure

See: `scripts/runbook-db-restore.md`

Quick rollback:
```bash
# 1. Stop services
sudo systemctl stop spark-trading-api spark-trading-web

# 2. Restore previous version
git checkout v1.3.1
pnpm install
pnpm build

# 3. Restart services
sudo systemctl start spark-trading-api spark-trading-web

# 4. Verify health
curl -f http://localhost:4001/api/healthz
```

---

## 📚 References

- [Position Unique Migration](../prisma/migrations/20241024_add_partial_unique_position.sql)
- [Idempotency Service](../services/shared/lib/idempotency-enhanced.ts)
- [Money Utils](../services/shared/lib/money.ts)
- [CSP Smoke Test](../scripts/csp-coep-smoke-test.ps1)
- [PITR Setup](../deploy/postgres/pitr-setup.sql)
- [Database Restore Runbook](../scripts/runbook-db-restore.md)
