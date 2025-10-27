# Evidence Retention Policy (v1.8+)

**Purpose:** Maintain audit trail while managing storage  
**Scope:** All ML pipeline evidence files  
**Owner:** Platform Team

---

## 📊 RETENTION SCHEDULE

### Critical Evidence (90 Days)

**Files:**
- `offline_report*.json` - Training metrics
- `canary_run_*.json` - Canary execution logs
- `psi_snapshot*.json` - Drift detection snapshots
- `gates_*.json` - Promote gate validations

**Retention:** 90 days minimum  
**Archive:** After 90 days → S3/artifact store  
**Format:** Compressed (tar.gz / zip) with SHA256

**Automated Cleanup:**
```bash
# Cron: Weekly cleanup (Sunday 23:59)
0 23 * * 0 bash scripts/cleanup-evidence.sh --days 90 --archive s3://spark-ml-artifacts/evidence/
```

### Standard Evidence (30 Days)

**Files:**
- `daily/report_*.json` - Daily risk reports
- `smoke_*.json` - Smoke test results
- `metrics_baseline_*.txt` - Prometheus snapshots

**Retention:** 30 days  
**Archive:** After 30 days → Local archive (optional S3)  
**Cleanup:** Automated weekly

### Logs (7 Days)

**Files:**
- Application logs (stdout/stderr)
- Feature logger output (raw tick data)
- Temporary debug files

**Retention:** 7 days  
**Cleanup:** Daily rotation

---

## 🔄 AUTOMATED CLEANUP SCRIPT

**Create:** `scripts/cleanup-evidence.sh`

```bash
#!/usr/bin/env bash
# Evidence Cleanup & Archive

DAYS_CRITICAL="${DAYS_CRITICAL:-90}"
DAYS_STANDARD="${DAYS_STANDARD:-30}"
ARCHIVE_BUCKET="${ARCHIVE_BUCKET:-s3://spark-ml-artifacts/evidence}"

# Archive critical files older than 90 days
find evidence/ml -name "offline_report*.json" -mtime +$DAYS_CRITICAL -type f | while read f; do
    echo "Archiving: $f"
    tar -czf "$f.tar.gz" "$f"
    aws s3 cp "$f.tar.gz" "$ARCHIVE_BUCKET/" 2>/dev/null || true
    rm "$f" "$f.tar.gz"
done

# Delete standard files older than 30 days
find evidence/ml/daily -name "*.json" -mtime +$DAYS_STANDARD -type f -delete

# Rotate logs
find logs -name "*.log" -mtime +7 -type f -delete

echo "Cleanup complete"
```

**PowerShell Equivalent:**
```powershell
# Evidence cleanup (Windows)
$criticalDays = 90
$standardDays = 30

# Archive critical
Get-ChildItem evidence\ml\*_report*.json | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$criticalDays) } | ForEach-Object {
    Write-Host "Archiving: $($_.Name)"
    Compress-Archive -Path $_.FullName -DestinationPath "$($_.FullName).zip"
    # aws s3 cp "$($_.FullName).zip" s3://bucket/
    Remove-Item $_.FullName, "$($_.FullName).zip"
}

# Delete standard
Get-ChildItem evidence\ml\daily\*.json | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$standardDays) } | Remove-Item
```

---

## 📦 RELEASE BUNDLE STRUCTURE

```
releases/v1.8.0-rc1/
├── COMMIT.txt                   # Git commit hash
├── GIT_INFO.txt                 # Full git log
├── MANIFEST.json                # Release metadata
├── SHA256SUMS.txt               # File checksums
├── docs/                        # All documentation
│   ├── GO_NO_GO_v1.8.1.md
│   ├── RELEASE_GATE_v1.8.1.md
│   ├── ML_RETRAIN_STRATEGY_v1.8.1.md
│   ├── ML_AUTOMATION_ACTIONS_v1.8.md
│   ├── HARDENING_CHECKLIST_v1.8.md
│   ├── V1_8_1_QUICK_START.md
│   └── EVIDENCE_RETENTION_POLICY.md
├── rules/                       # Alert rules
│   ├── ml.yml
│   ├── ml-canary.yml
│   └── ml.test.yml
├── scripts/                     # Automation scripts
│   ├── ml-*.cjs (10+ scripts)
│   ├── canary-*.cjs (3 scripts)
│   ├── check-promote-gates.sh
│   ├── retrain-v1.8.1.ps1
│   ├── retrain-v1.8.1.sh
│   └── create-release-bundle.*
├── evidence/ml/                 # Evidence files
│   ├── offline_report.json
│   ├── eval_result.txt
│   ├── smoke_1k.json
│   ├── shadow_smoke_1k.json
│   ├── psi_snapshot.json
│   ├── canary_*.json (3 files)
│   └── daily/*.json (sample)
├── CHANGELOG.md                 # Release notes
├── GREEN_EVIDENCE_v1.8.md       # Complete evidence
└── grafana-ml-dashboard.json    # Dashboard template

Archive: releases/v1.8.0-rc1.zip (or .tar.gz)
Checksum: releases/v1.8.0-rc1.zip.sha256
```

---

## 🔐 INTEGRITY VERIFICATION

### Verify Bundle

**PowerShell:**
```powershell
# Verify archive checksum
$expected = (Get-Content releases\v1.8.0-rc1.zip.sha256).Split(' ')[0]
$actual = (Get-FileHash releases\v1.8.0-rc1.zip -Algorithm SHA256).Hash
if ($expected -eq $actual) { 
    Write-Host "✅ Archive integrity verified" -ForegroundColor Green 
} else { 
    Write-Host "❌ Checksum mismatch!" -ForegroundColor Red 
}

# Verify contents (after extraction)
cd releases\v1.8.0-rc1
Get-ChildItem -Recurse -File | Get-FileHash -Algorithm SHA256 | Sort-Object Path | 
    ForEach-Object { "$($_.Hash)  $($_.Path)" } > VERIFY.txt
Compare-Object (Get-Content SHA256SUMS.txt) (Get-Content VERIFY.txt)
# Should output nothing (identical)
```

**Bash:**
```bash
# Verify archive checksum
shasum -a 256 -c releases/v1.8.0-rc1.tar.gz.sha256

# Verify contents (after extraction)
cd releases/v1.8.0-rc1
shasum -a 256 -c SHA256SUMS.txt
```

---

## 🏷️ VERSION TAGGING

### Git Tag Strategy

**Tag:** `v1.8.0-rc1` (release candidate)  
**Type:** Annotated tag  
**Message:** Multi-line with metadata

```bash
git tag -a v1.8.0-rc1 -m "ML Pipeline v1.8.0-rc1 (Observe-Only)

Status: Canary complete, observe-only mode
Promote: BLOCKED (PSI 1.25 > 0.2)
Next: v1.8.1 retrain (15 days)

Gates:
- [x] Performance SLO (P95: 2.57-3.09ms)
- [x] Alert Silence (0 critical)
- [x] Offline Validation (AUC: 0.64)
- [x] Shadow Delta (0.02 avg)
- [x] Evidence Complete (19 files)
- [ ] PSI < 0.2 (currently: 1.25, retrain needed)

Components:
- ML Core (packages/ml-core)
- ML Engine (services/ml-engine)
- Shadow Plugin (services/executor/plugins/shadow.ts)
- Automation (17 alerts, daily reports)
- Documentation (8 docs, 1500+ lines)

Evidence: releases/v1.8.0-rc1.zip (SHA256 verified)
"
```

**Push Tags:**
```bash
# After verification
git push origin v1.8.0-rc1
```

### Tag Naming Convention

- `v1.8.0-rc1` - Release candidate (observe-only)
- `v1.8.1-rc1` - Next RC (after retrain)
- `v1.8.1` - Production release (after promote)

---

## 📋 WEEKLY EVIDENCE SUMMARY

**Schedule:** Every Sunday 23:59 UTC

**Script:** `scripts/weekly-summary.sh`

```bash
#!/usr/bin/env bash
# Weekly Evidence Summary

WEEK=$(date +%Y-W%V)
SUMMARY_FILE="evidence/ml/weekly/summary_$WEEK.json"

# Collect weekly metrics
PSI_AVG=$(cat evidence/ml/daily/ml_daily_reports.csv | tail -7 | cut -d, -f4 | awk '{sum+=$1} END {print sum/NR}')
ERROR_AVG=$(cat evidence/ml/daily/ml_daily_reports.csv | tail -7 | cut -d, -f3 | awk '{sum+=$1} END {print sum/NR}')

# Generate summary
cat > "$SUMMARY_FILE" << EOF
{
  "week": "$WEEK",
  "period": "$(date -d '7 days ago' +%Y-%m-%d) to $(date +%Y-%m-%d)",
  "metrics": {
    "psi_avg_7d": $PSI_AVG,
    "error_rate_avg_7d": $ERROR_AVG,
    "daily_reports": 7
  },
  "trend": "$([ $(echo "$PSI_AVG < 1.0" | bc -l) -eq 1 ] && echo "improving" || echo "stable")",
  "action": "$([ $(echo "$PSI_AVG > 0.2" | bc -l) -eq 1 ] && echo "retrain recommended" || echo "monitor")"
}
EOF

echo "Weekly summary: $SUMMARY_FILE"
```

---

## 🚨 EMERGENCY ROLLBACK KIT

**Quick Access:** `docs/EMERGENCY_ROLLBACK.md`

```markdown
# Emergency Rollback (< 5 min)

## Trigger
- P95 > 120ms sustained
- Error > 2% sustained
- Critical alert fired

## Steps

1. **Traffic Switch** (< 1 min)
   bash
   curl -X POST http://127.0.0.1:4001/canary/abort
   # Or
   node scripts/canary-observe-only.cjs --rollback --target 0%
   

2. **Disable Shadow** (< 1 min)
   bash
   curl -X POST http://127.0.0.1:4001/shadow/disable
   

3. **Snapshot Metrics** (< 2 min)
   bash
   curl -s http://127.0.0.1:4010/ml/metrics > evidence/ml/rollback_metrics_$(date +%s).txt
   

4. **Log Event** (< 1 min)
   bash
   echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ROLLBACK v1.8.1 → v1.8-b0 (reason: [FILL])" >> evidence/ml/rollback_log.txt
   

5. **Verify** (< 1 min)
   bash
   curl http://127.0.0.1:4010/ml/health
   # Should show baseline version
   

Total Time: < 5 minutes
```

---

## 📊 ARCHIVE MANIFEST

**Each Release Bundle Includes:**

1. **COMMIT.txt** - Git commit hash
2. **GIT_INFO.txt** - Full git log
3. **MANIFEST.json** - Release metadata
4. **SHA256SUMS.txt** - File checksums
5. **docs/** - Complete documentation
6. **rules/** - Alert rules + tests
7. **scripts/** - Automation scripts
8. **evidence/ml/** - Evidence files (selective)
9. **CHANGELOG.md** - Release notes
10. **GREEN_EVIDENCE_v1.8.md** - Audit trail

**Total Size:** ~5-10 MB (compressed)

---

## ✅ COMPLIANCE CHECKLIST

### Pre-Archive

- [x] All evidence files timestamped (ISO 8601)
- [x] SHA256 checksums generated
- [x] Git commit recorded
- [x] Version manifest complete
- [x] No sensitive data (PII, secrets)

### Post-Archive

- [ ] Archive uploaded to artifact store
- [ ] Checksum verified
- [ ] Git tag pushed
- [ ] Release notes published
- [ ] Stakeholders notified

---

**Generated:** 2025-10-08  
**Policy Version:** 1.0  
**Review Schedule:** Quarterly

