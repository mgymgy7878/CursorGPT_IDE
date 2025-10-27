# Runner Watchdog Incident Runbook

## Hızlı Referans

### Alarm Tetikleme
**Fast Burn:** `rate(spark_runner_stalls_total[5m]) > 0.2` → 10m critical
**Slow Burn:** `rate(spark_runner_stalls_total[1h]) > 0.05` → 2h warning

### Panel Linkleri
- **Dashboard:** `/grafana/d/spark-runner-dashboard/spark-runner-watchdog`
- **Alerts:** `/grafana/alerting`
- **Metrics:** `/prometheus/graph`

## Incident Response Checklist

### 1. Alarm Doğrulama (0-5 dakika)
```bash
# Panel kontrolü
curl -s http://127.0.0.1:4001/metrics | rg 'spark_runner_stalls_total'

# Son stall events
Get-Content evidence/runner/stall-events.jsonl -Tail 10

# Root-cause analizi
Get-Content evidence/runner/stall-events.jsonl -Tail 20 | Where-Object { $_ -match '"rootCause"' } | ForEach-Object { ($_ | ConvertFrom-Json).rootCause } | Group-Object
```

### 2. Kapsam Belirleme (5-10 dakika)
```bash
# Environment breakdown
Get-Content evidence/runner/stall-events.jsonl -Tail 50 | Where-Object { $_ -match '"environment"' } | ForEach-Object { ($_ | ConvertFrom-Json).environment } | Group-Object

# Host breakdown  
Get-Content evidence/runner/stall-events.jsonl -Tail 50 | Where-Object { $_ -match '"host"' } | ForEach-Object { ($_ | ConvertFrom-Json).host } | Group-Object

# Command type breakdown
Get-Content evidence/runner/stall-events.jsonl -Tail 50 | Where-Object { $_ -match '"commandType"' } | ForEach-Object { ($_ | ConvertFrom-Json).commandType } | Group-Object
```

### 3. Kök Neden Analizi (10-15 dakika)
```bash
# Son 30 dakika root-cause dağılımı
$cutoff = (Get-Date).AddMinutes(-30).ToString("yyyy-MM-ddTHH:mm:ssZ")
Get-Content evidence/runner/stall-events.jsonl | Where-Object { $_ -match $cutoff -or [DateTime]::ParseExact((($_ | ConvertFrom-Json).ts -replace 'Z$', ''), 'yyyy-MM-ddTHH:mm:ss', $null) -gt [DateTime]::ParseExact($cutoff.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null) } | ForEach-Object { ($_ | ConvertFrom-Json).rootCause } | Group-Object

# Network sinyalleri
Get-Content evidence/runner/stall-events.jsonl -Tail 50 | Where-Object { $_ -match '"rootCause":"network"' }

# I/O sinyalleri  
Get-Content evidence/runner/stall-events.jsonl -Tail 50 | Where-Object { $_ -match '"rootCause":"io_wait"' }

# Child process sinyalleri
Get-Content evidence/runner/stall-events.jsonl -Tail 50 | Where-Object { $_ -match '"rootCause":"child_hang"' }
```

### 4. Acil Eylem (15-20 dakika)

#### Geçici Çözüm - Runtime Override
```bash
# Idle timeout +20%
$env:RUNNER_IDLE_MS = "14400"  # 12s → 14.4s
$env:RUNNER_HARD_MS = "54000"  # 45s → 54s

# Test komutu
node tools/runStepConfigurable.cjs "Write-Host 'Emergency test'; Start-Sleep -Seconds 15" "emergency" "production"
```

#### Config Değişikliği (PR Gerekli)
```bash
# config/runner.json düzenle
# production environment timeouts artır
# PR oluştur ve onay bekle
```

### 5. İzleme ve Doğrulama (20-30 dakika)
```bash
# Stall rate monitoring
watch -n 30 "curl -s http://127.0.0.1:4001/metrics | rg 'spark_runner_stalls_total'"

# Evidence collection
pnpm run report:daily

# Root-cause trend
Get-Content evidence/runner/stall-events.jsonl -Tail 10 | ForEach-Object { "$((($_ | ConvertFrom-Json).ts -split 'T')[1] -replace 'Z', ''): $(($_ | ConvertFrom-Json).rootCause)" }
```

## Kök Neden Kategorileri

### 1. io_wait
**Belirtiler:**
- Disk I/O yüksek
- ENOSPC errors
- EIO errors

**Çözümler:**
- Disk space kontrolü
- I/O bottleneck analizi
- Disk performance tuning

### 2. network
**Belirtiler:**
- Network timeout errors
- ENET errors
- ECONN errors

**Çözümler:**
- Network connectivity kontrolü
- DNS resolution test
- Firewall rules kontrolü

### 3. child_hang
**Belirtiler:**
- idle-timeout events
- hard-timeout events
- Process non-responsive

**Çözümler:**
- Process tree analizi
- Resource utilization kontrolü
- Child process optimization

### 4. lock
**Belirtiler:**
- Lock/mutex errors
- Deadlock indicators
- Resource contention

**Çözümler:**
- Lock contention analizi
- Resource pool tuning
- Deadlock detection

### 5. cpu_starve
**Belirtiler:**
- High CPU usage
- Load average yüksek
- Resource starvation

**Çözümler:**
- CPU utilization analizi
- Process priority tuning
- Resource allocation review

## Post-Incident Actions

### 1. Issue Oluşturma
```markdown
## Runner Watchdog Incident - [DATE]

**Alarm:** RunnerStallFastBurn/RunnerStallSlowBurn
**Süre:** [START_TIME] - [END_TIME]
**Etki:** [IMPACT_DESCRIPTION]

### Kök Neden
- Root-cause: [io_wait|network|child_hang|lock|cpu_starve]
- Evidence: evidence/runner/stall-events.jsonl
- Metrics: spark_runner_stalls_total

### Alınan Aksiyonlar
1. Geçici çözüm: Runtime timeout override
2. Kalıcı çözüm: Config değişikliği
3. İzleme: [MONITORING_ACTIONS]

### Takip Aksiyonları
- [ ] Config optimization
- [ ] Monitoring enhancement  
- [ ] Documentation update
- [ ] Chaos test scenario ekleme
```

### 2. Guardrail Güncelleme
```bash
# Yeni chaos test senaryosu ekle
powershell -ExecutionPolicy Bypass -File scripts/chaos-test.ps1 -TestType "custom" -Scenario "incident-reproduction"
```

### 3. Dashboard Güncelleme
- Yeni root-cause paneli ekle
- Alert correlation annotations
- Performance baseline güncelleme

## Escalation Matrix

### Level 1: Platform Team
- **Süre:** 0-30 dakika
- **Aksiyon:** Geçici çözüm, monitoring
- **Escalation:** Level 2 if no resolution

### Level 2: Senior Platform Team  
- **Süre:** 30-60 dakika
- **Aksiyon:** Config değişikliği, PR
- **Escalation:** Level 3 if critical

### Level 3: Engineering Leadership
- **Süre:** 60+ dakika
- **Aksiyon:** Architecture review, resource allocation
- **Escalation:** C-level if business impact

## Communication Templates

### Slack Notification
```
🚨 Runner Watchdog Incident
Alarm: RunnerStallFastBurn
Root-cause: [ROOT_CAUSE]
Affected: [ENV/HOST/COMMAND_TYPE]
ETA: [RESOLUTION_TIME]
Runbook: docs/RUNNER_INCIDENT_RUNBOOK.md
```

### Status Page Update
```
Runner Watchdog Service Degradation
Impact: Command execution timeouts
Root-cause: [ROOT_CAUSE]
Status: Investigating → Mitigating → Resolved
ETA: [RESOLUTION_TIME]
```

## Metrics ve SLO

### Incident SLO'lar
- **Detection Time:** ≤ 5 dakika
- **Response Time:** ≤ 15 dakika  
- **Resolution Time:** ≤ 60 dakika
- **MTTR:** ≤ 45 dakika

### Success Criteria
- Stall rate < 0.02 (5m window)
- P95 execution duration < 60s
- Auto-skip events < 3 (24h)
- Failure rate < 20% (10m window)

## Araçlar ve Komutlar

### Hızlı Komutlar
```bash
# Son stall events
Get-Content evidence/runner/stall-events.jsonl -Tail 10

# Root-cause breakdown
Get-Content evidence/runner/stall-events.jsonl | ForEach-Object { ($_ | ConvertFrom-Json).rootCause } | Group-Object

# Metrics snapshot
curl -s http://127.0.0.1:4001/metrics | rg 'spark_runner_'

# Emergency timeout override
$env:RUNNER_IDLE_MS = "14400"; $env:RUNNER_HARD_MS = "54000"

# Daily report
pnpm run report:daily
```

### Monitoring Links
- **Grafana Dashboard:** [DASHBOARD_URL]
- **Prometheus:** [PROMETHEUS_URL]
- **Alertmanager:** [ALERTMANAGER_URL]
- **Evidence:** evidence/runner/

Bu runbook, Runner Watchdog incident'lerinde hızlı ve etkili müdahale için tasarlanmıştır. Her incident sonrası güncellenmelidir.
