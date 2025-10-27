# Spark Runner Watchdog - SLO (Service Level Objectives)

## SLO Tanımları

### 1. Stall Rate SLO
- **Hedef:** 5 dakikalık stall rate ≤ 0.02 (≤2%)
- **Ölçüm:** `rate(spark_runner_stalls_total[5m])`
- **Alarm Eşiği:** 0.1 (10%)
- **Aksiyon:** Stall rate >10% durumunda warning alarmı

### 2. Execution Duration SLO  
- **Hedef:** P95 execution duration ≤ 60s
- **Ölçüm:** `histogram_quantile(0.95, spark_runner_execution_duration_seconds_bucket)`
- **Alarm Eşiği:** 60s
- **Aksiyon:** P95 >60s durumunda warning alarmı

### 3. Auto-Skip Events SLO
- **Hedef:** 24 saatlik auto-skip events ≤ 3
- **Ölçüm:** `increase(spark_runner_executions_total{status="skipped"}[24h])`
- **Alarm Eşiği:** 5 events
- **Aksiyon:** >5 auto-skip durumunda critical alarmı

### 4. Execution Failure Rate SLO
- **Hedef:** 10 dakikalık failure rate ≤ 20%
- **Ölçüm:** `rate(spark_runner_executions_total{status="failed"}[10m]) / rate(spark_runner_executions_total[10m])`
- **Alarm Eşiği:** 20%
- **Aksiyon:** Failure rate >20% durumunda warning alarmı

## Alarm Kuralları

### Warning Level Alarms
1. **RunnerStallRateHigh** - Stall rate >0.1 (5m window)
2. **RunnerExecTooSlowP95** - P95 duration >60s
3. **RunnerExecutionFailureRate** - Failure rate >20%
4. **RunnerStallsIncreasing** - >5 stalls in 1 hour

### Critical Level Alarms  
1. **RunnerStallSpike** - >3 stalls in 15 minutes

### Info Level Alarms
1. **CanaryAutoSkipHappening** - Auto-skip events detected

## Dashboard Metrikleri

### Ana Paneller
1. **Stalls (24h)** - Toplam stall sayısı
2. **Stall Rate (5m)** - Anlık stall oranı
3. **Execution Duration (P50/P95)** - Süre dağılımı
4. **Execution Status (24h)** - Başarı/başarısızlık dağılımı
5. **Auto-Skip Events (24h)** - Auto-skip sayısı
6. **Execution Duration Percentiles** - P50/P95/P99 grafikleri

### Annotations
- **Deploy Events** - Deploy zamanları
- **Canary Events** - Canary test zamanları

## CI/CD Integration

### Pipeline Adımları
1. **Runner Smoke Test** - Temel watchdog testi
2. **Evidence Collection** - Kanıt dosyalarının toplanması
3. **Canary Retry Test** - Retry mekanizması testi
4. **Security Audit** - Güvenlik kontrolleri
5. **Prometheus Rules Validation** - Alarm kuralları doğrulama

### Artifact Upload
- `runner-evidence-{run_id}` - 30 gün saklama
- `canary-evidence-{run_id}` - 14 gün saklama

## Konfigürasyon

### Environment-Specific Timeouts
- **Development:** 15s idle, 60s hard
- **Production:** 10s idle, 30s hard  
- **CI:** 8s idle, 25s hard

### Command-Type Timeouts
- **Build:** 30s idle, 5min hard, 2 retry
- **Test:** 20s idle, 3min hard, 3 retry
- **Deploy:** 60s idle, 10min hard, 1 retry
- **Canary:** 15s idle, 2min hard, 1 retry
- **Smoke:** 10s idle, 1min hard, 2 retry

## Güvenlik Kontrolleri

### Allowed Commands
- node, pnpm, npm, powershell, cmd, Write-Host

### Blocked Patterns
- `rm -rf`
- `Remove-Item.*-Recurse.*-Force`
- `Format-Volume`
- `del /f /s /q`

## Kanıt ve Audit

### Audit Fields
- timestamp, commandType, environment, command, pid, host
- event type, exit code, output/error snippets
- timeout values, execution duration

### Evidence Retention
- **Stall Events:** 30 gün
- **Daily Reports:** 14 gün
- **CI Artifacts:** 30 gün (runner), 14 gün (canary)

## Runbook Referansları

1. **Runner Stalls:** `https://spark-platform/docs/runbooks/runner-stalls`
2. **Runner Spike:** `https://spark-platform/docs/runbooks/runner-spike`
3. **Auto-Skip Events:** `https://spark-platform/docs/runbooks/auto-skip`

## Önerilen SLO İyileştirmeleri

### Kısa Vadeli (1-3 ay)
- Per-command sınıflandırma (build/test/deploy)
- Root-cause etiketleri (I/O-wait, network, child-hang)
- Environment-specific SLO'lar

### Uzun Vadeli (3-6 ay)  
- Predictive stall detection
- Automated remediation
- Cross-service correlation
