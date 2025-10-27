# GA Ship Quick Reference Guide

## Quick Commands

### Quick Validation (Immediate)
```bash
# Linux/macOS
./scripts/ga-quick-validate.sh 20250827180000-a1b2c3

# Makefile
make ga-quick-validate NONCE=20250827180000-a1b2c3
```

### Health Scan
```bash
# Linux/macOS
./scripts/ga-health-scan.sh

# Makefile
make ga-health-scan
```

### 3-Minute Self-Check
```bash
# Linux/macOS
./scripts/ga-self-check.sh 20250827180000-a1b2c3

# Windows
scripts\ga-self-check.cmd 20250827180000-a1b2c3

# Makefile
make ga-self-check NONCE=20250827180000-a1b2c3
```

### 48-Hour Monitoring
```bash
# Checkpoint monitoring
./scripts/ga-watch-48h.sh http://localhost:9090 20250827180000-a1b2c3 T0
./scripts/ga-watch-48h.sh http://localhost:9090 20250827180000-a1b2c3 T+4h
./scripts/ga-watch-48h.sh http://localhost:9090 20250827180000-a1b2c3 T+24h
./scripts/ga-watch-48h.sh http://localhost:9090 20250827180000-a1b2c3 T+48h

# Makefile
make ga-watch-48h PROM=http://localhost:9090 NONCE=20250827180000-a1b2c3 CHECKPOINT=T0
```

### Archive Operations
```bash
# Basic archive
make ga-archive NONCE=20250827180000-a1b2c3 VERSION=v1.5

# Complete archive with compression
./scripts/ga-archive.sh 20250827180000-a1b2c3 v1.5

# Makefile
make ga-archive-complete NONCE=20250827180000-a1b2c3 VERSION=v1.5
```

### Stop-Gate Triage
```bash
# Incident triage
./scripts/ga-stop-gate-triage.sh 20250827180000-a1b2c3 sig_verify_fail

# Makefile
make ga-stop-gate-triage NONCE=20250827180000-a1b2c3 INCIDENT=sig_verify_fail
```

### Verification
```bash
# Offline verification
make ga-verify NONCE=20250827180000-a1b2c3

# Status check
make ga-status VERSION=v1.5
```

### Closeout (T+48h)
```bash
# Final assessment
./scripts/ga-closeout.sh 20250827180000-a1b2c3 http://localhost:9090

# Makefile
make ga-closeout NONCE=20250827180000-a1b2c3 PROM=http://localhost:9090
```

### Manifest Generation
```bash
# Generate manifest
node scripts/make-manifest.mjs 20250827180000-a1b2c3

# With previous manifest link
node scripts/make-manifest.mjs 20250827180000-a1b2c3 --prev evidence/receipts-smoke/20250820094712-ae2c6e/sha256-manifest.json

# Makefile
make ga-manifest NONCE=20250827180000-a1b2c3
```

### GPG FPR Pin Control
```bash
# Validate FPR pin
node scripts/gpg-fpr-pin.mjs evidence/receipts-smoke/20250827180000-a1b2c3/sha256-manifest.json.asc evidence/receipts-smoke/20250827180000-a1b2c3/sha256-manifest.json

# Makefile
make ga-fpr-pin SIG=evidence/receipts-smoke/20250827180000-a1b2c3/sha256-manifest.json.asc MANIFEST=evidence/receipts-smoke/20250827180000-a1b2c3/sha256-manifest.json
```

### Chaos Probe
```bash
# Run chaos probe
node scripts/make-receipts-chaos.mjs --probe receipts_fail

# Makefile
make ga-chaos-probe PROBE_TYPE=receipts_fail
```

### Complete GREEN Workflow
```bash
# Complete GREEN workflow
make ga-green NONCE=20250827180000-a1b2c3
```

## PromQL Shortcuts

### Critical Metrics
```promql
# Fail rate (5m)
sum(rate(receipts_gate_fail_total[5m]))

# Nonce reuse (48h)
sum(increase(nonce_reuse_detected_total[48h]))

# Duration P95 (1h)
max_over_time(receipts_gate_duration_ms_p95[1h])

# FPR mismatch (48h)
sum(increase(receipts_fpr_mismatch_total[48h]))

# Missing artifacts (24h)
topk(5, increase(receipts_artifacts_missing_total[24h]))
```

### Stop-Gate Triggers
```promql
# All stop-gate metrics
receipts_sig_bad_total > 0
receipts_fpr_mismatch_total > 0
nonce_reuse_detected_total > 0
offline_verify_fail_total > 0
```

## File Locations

### Evidence Structure
```
evidence/
├── receipts-smoke/
│   └── 20250827180000-a1b2c3/
│       ├── sha256-manifest.json
│       ├── sha256-manifest.json.asc
│       └── inputs.json
├── ga/
│   └── v1.5/
│       ├── 20250827180000-a1b2c3/
│       ├── latest -> 20250827180000-a1b2c3/
│       ├── v1.5-20250827180000-a1b2c3.tgz
│       ├── v1.5-20250827180000-a1b2c3.tgz.asc
│       └── v1.5-20250827180000-a1b2c3.tgz.sha256
└── incidents/
    └── 20250827180000-sig_verify_fail/
```

### Key Files
- **Manifest**: `evidence/receipts-smoke/{NONCE}/sha256-manifest.json`
- **Signature**: `evidence/receipts-smoke/{NONCE}/sha256-manifest.json.asc`
- **Inputs**: `evidence/receipts-smoke/{NONCE}/inputs.json`
- **Archive**: `evidence/ga/{VERSION}/{NONCE}/`
- **Latest**: `evidence/ga/{VERSION}/latest`

## Monitoring Checkpoints

### T0 (Immediate)
- [ ] receipts_sig_bad_total = 0
- [ ] receipts_fpr_mismatch_total = 0
- [ ] nonce_reuse_detected_total = 0
- [ ] offline_verify_fail_total = 0
- [ ] receipts_gate_duration_ms_p95 < 1s

### T+4h
- [ ] All T0 checks
- [ ] "Receipts Gate" panel active
- [ ] Daily export with manifest SHA links

### T+24h
- [ ] All T0 checks
- [ ] Performance metrics stable
- [ ] Weekly chaos CRON executed

### T+48h
- [ ] All T0 checks
- [ ] Final assessment complete
- [ ] Archive operations finished

## Incident Response

### Stop-Gate Triggers
1. **receipts_sig_bad_total > 0**
   - Run: `./scripts/ga-stop-gate-triage.sh {NONCE} sig_verify_fail`
   - Check: GPG signature verification
   - Action: Verify key and re-sign if needed

2. **receipts_fpr_mismatch_total > 0**
   - Run: `./scripts/ga-stop-gate-triage.sh {NONCE} fpr_mismatch`
   - Check: FPR against KEY_FINGERPRINTS.md
   - Action: Key rotation if needed

3. **nonce_reuse_detected_total > 0**
   - Run: `./scripts/ga-stop-gate-triage.sh {NONCE} nonce_reuse`
   - Check: NONCE generation and uniqueness
   - Action: Security investigation

4. **offline_verify_fail_total > 0**
   - Run: `./scripts/ga-stop-gate-triage.sh {NONCE} offline_verify_fail`
   - Check: Air-gapped verification
   - Action: Manifest integrity check

### Hotfix Protocol
1. Generate new NONCE with hotfix suffix
2. Update manifest with incident details
3. Re-sign with GPG
4. Update prev_manifest_sha256
5. Archive new manifest
6. Update monitoring

## Archive Operations

### Basic Archive
```bash
make ga-archive NONCE=20250827180000-a1b2c3 VERSION=v1.5
```

### Complete Archive
```bash
./scripts/ga-archive.sh 20250827180000-a1b2c3 v1.5
```

### Archive Verification
```bash
# Check archive integrity
sha256sum -c evidence/ga/v1.5/v1.5-20250827180000-a1b2c3.tgz.sha256

# Verify GPG signature
gpg --verify evidence/ga/v1.5/v1.5-20250827180000-a1b2c3.tgz.asc evidence/ga/v1.5/v1.5-20250827180000-a1b2c3.tgz
```

## Help Commands

### Makefile Help
```bash
make ga-help
```

### Script Help
```bash
# Self-check
./scripts/ga-self-check.sh --help

# Watch monitoring
./scripts/ga-watch-48h.sh --help

# Stop-gate triage
./scripts/ga-stop-gate-triage.sh --help

# Archive
./scripts/ga-archive.sh --help
```

## Quick Status Check
```bash
make ga-status VERSION=v1.5
```

## Emergency Contacts
- **GA Ship Operator**: Internal team
- **Incident Response**: Escalation team
- **Documentation**: [GA Ship Documentation](docs/GA_SHIP.md)
- **Runbook**: [Incident Response Runbook](docs/INCIDENT_RESPONSE.md) 