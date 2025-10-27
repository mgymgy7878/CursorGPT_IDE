# Runner Watchdog Hardening Guide

## Kalıcı Dayanıklılık Özellikleri

### 1. Burn-Rate Alarmları

**Hızlı Burn (Critical)**
```yaml
- alert: RunnerStallFastBurn
  expr: rate(spark_runner_stalls_total[5m]) > 0.2
  for: 10m
  severity: critical
```

**Yavaş Burn (Warning)**
```yaml
- alert: RunnerStallSlowBurn
  expr: rate(spark_runner_stalls_total[1h]) > 0.05
  for: 2h
  severity: warning
```

### 2. Evidence Rotasyonu

**Otomatik Rotasyon:**
- Günlük rotate: `*.jsonl` → `*.jsonl.YYYYMMDD`
- Size limit: 50MB per file, 1GB total
- Retention: 14 gün
- Manifest: `daily_report_manifest.json`

**Kullanım:**
```bash
pnpm run evidence:rotate
```

### 3. Config Freeze

**Şema Doğrulama:**
```bash
pnpm run config:validate
```

**Validasyon Kriterleri:**
- Required keys: timeouts, environments, command_types, metrics, logging, security
- Timeout values: positive integers
- Security: non-empty allowed_commands and blocked_patterns
- Consistency: environment timeouts vs base values

**Strict Mode:**
```bash
powershell -ExecutionPolicy Bypass -File scripts/config-schema-validate.ps1 -Strict
```

### 4. Chaos Testing

**Test Senaryoları:**
1. **I/O Wait Simulation** - Continuous read/write operations
2. **Child Process Hang** - Non-responsive child processes
3. **Stall Burst** - Multiple rapid stall events
4. **Metrics Integration** - Event logging verification
5. **Evidence Integrity** - File creation and validation

**Kullanım:**
```bash
# Tüm testler
pnpm run chaos:test

# Sadece burst testi
pnpm run chaos:burst

# Belirli test türü
powershell -ExecutionPolicy Bypass -File scripts/chaos-test.ps1 io
powershell -ExecutionPolicy Bypass -File scripts/chaos-test.ps1 hang
```

### 5. Grafana Enhancement

**Etiket Sistemi:**
- `service="runner"` - Runner servis etiketi
- `environment` - Ortam etiketi (dev/prod/ci)
- `host` - Host etiketi (çoklu host korelasyonu)
- `command_type` - Komut türü etiketi
- `burn_type` - Burn rate türü (fast/slow)

**Korelasyon Panelleri:**
- Multi-host stall comparison
- Environment-specific performance
- Command-type analysis
- Burn rate trends

### 6. Node Fetch Fix

**Native Fetch Integration:**
```javascript
// Node 18+ native fetch veya undici fallback
const fetch = globalThis.fetch || (await import('undici')).fetch;
```

**Dependency Removal:**
- `node-fetch` dependency kaldırıldı
- Native `globalThis.fetch` kullanımı
- Undici fallback desteği

## SLO Hedefleri

### Güncel SLO'lar
1. **Stall Rate (5m):** ≤ 0.02 (≤2%)
2. **P95 Execution Duration:** ≤ 60s
3. **Auto-Skip Events (24h):** ≤ 3
4. **Failure Rate (10m):** ≤ 20%

### Burn-Rate SLO'lar
1. **Fast Burn:** 5m rate > 0.2 → 10m critical alarm
2. **Slow Burn:** 1h rate > 0.05 → 2h warning alarm

## Güvenlik Kontrolleri

### Config Validation
- Schema enforcement
- Dangerous value detection
- Wildcard command blocking
- Timeout boundary checks

### Evidence Security
- File integrity (SHA256 hashing)
- Access control (evidence directory permissions)
- Retention policies (automatic cleanup)
- Manifest tracking

### Command Validation
- Allowed commands whitelist
- Blocked patterns blacklist
- Security risk detection
- Audit trail logging

## CI/CD Integration

### Pipeline Steps
1. **Config Schema Check** - PR validation
2. **Prometheus Rules Validation** - promtool check
3. **Chaos Testing** - Weekly automated tests
4. **Evidence Collection** - Artifact upload
5. **Security Audit** - Script analysis

### GitHub Actions
```yaml
# Weekly chaos testing
- name: Chaos: Weekly Tests
  if: github.event_name == 'schedule'
  run: pnpm run chaos:test

# Config validation on PR
- name: Config Schema Check
  run: pnpm run config:validate

# Evidence rotation
- name: Evidence Maintenance
  run: pnpm run evidence:rotate
```

## Monitoring ve Alerting

### Alarm Kanalları
- **Critical:** Slack/Discord/Email
- **Warning:** Slack channel
- **Info:** Dashboard notification

### Alertmanager Routing
```yaml
route:
  group_by: ['team', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  routes:
  - match:
      team: platform
      service: runner
    receiver: platform-team
```

### Runbook Integration
- **RunnerStallFastBurn:** `https://spark-platform/docs/runbooks/runner-fast-burn`
- **RunnerStallSlowBurn:** `https://spark-platform/docs/runbooks/runner-slow-burn`
- **Config Drift:** `https://spark-platform/docs/runbooks/config-validation`

## Bakım ve Operasyon

### Günlük Operasyonlar
```bash
# Evidence rotasyonu
pnpm run evidence:rotate

# Daily report
pnpm run report:daily

# Config validation
pnpm run config:validate
```

### Haftalık Operasyonlar
```bash
# Chaos testing
pnpm run chaos:test

# Prometheus rules validation
promtool check rules config/prometheus/rules/spark-runner.rules.yml

# Security audit
powershell -ExecutionPolicy Bypass -File scripts/security-audit.ps1
```

### Aylık Operasyonlar
- Evidence retention review
- SLO performance analysis
- Config optimization review
- Chaos test scenario updates

## Sorun Giderme

### Yaygın Sorunlar

**1. Metrics Gönderimi Başarısız**
```
Metrics gönderimi başarısız: fetch failed
```
- **Çözüm:** Metrics endpoint kontrolü, network connectivity
- **Geçici:** Metrics disabled mode ile çalışmaya devam

**2. Config Validation Hatası**
```
Schema validation failed: Missing required key
```
- **Çözüm:** Config dosyası şema kontrolü
- **Geçici:** Default config kullanımı

**3. Evidence Rotation Hatası**
```
Rotation failed: Access denied
```
- **Çözüm:** File permissions kontrolü
- **Geçici:** Manual cleanup

### Debug Komutları
```bash
# Evidence durumu
Get-Content evidence/runner/daily_report_manifest.json

# Son stall events
Get-Content evidence/runner/stall-events.jsonl -Tail 10

# Config doğrulama
pnpm run config:validate -Strict

# Chaos test (dry run)
powershell -ExecutionPolicy Bypass -File scripts/chaos-test.ps1 -DryRun
```

## Gelecek Geliştirmeler

### Kısa Vadeli (1-3 ay)
- Root-cause classification (I/O, network, child-hang)
- Per-command performance profiling
- Cross-service correlation

### Uzun Vadeli (3-6 ay)
- Predictive stall detection
- Automated remediation
- Machine learning integration
- Real-time anomaly detection

## Sonuç

Runner Watchdog sistemi artık **production-hardened** durumda:

1. **🔔 Burn-Rate Alarms** - Hızlı ve yavaş pencere alarmları
2. **🔄 Evidence Rotation** - Otomatik rotasyon ve retention
3. **🔒 Config Freeze** - Şema doğrulama ve güvenlik
4. **🧪 Chaos Testing** - Kapsamlı test senaryoları
5. **📊 Enhanced Monitoring** - Grafana etiketleri ve korelasyon
6. **⚡ Native Fetch** - Node 18+ optimizasyonu

**Sistem artık sadece stall'ları öldürmekle kalmıyor, sistemdeki sürtünmeyi görünür kılan bir erken uyarı ağına dönüşmüş durumda.**
