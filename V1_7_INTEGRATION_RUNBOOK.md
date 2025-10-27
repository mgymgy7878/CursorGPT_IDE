# v1.7 Export@Scale - Integration & Validation Runbook

## Status: CODE COMPLETE → AWAITING INTEGRATION

**Date**: 2025-10-08  
**Version**: v1.7.0-export-scale  
**Phase**: Implementation Complete, Integration Pending

---

## ✅ Completed Implementation

### Code Components
- [x] `packages/exporter-core/src/csvWriter.ts` - Stream-based CSV with chunking (1000 rows/chunk)
- [x] `packages/exporter-core/src/pdfWriter.ts` - Memory-safe PDF with pagination (50 records/page)
- [x] `packages/exporter-core/src/metrics.ts` - 9 Prometheus metrics
- [x] `services/executor/plugins/export.ts` - Full export plugin with rate limiting (max 5 concurrent)
- [x] `scripts/seed-export.js` - Test data seeding (single + batch mode)
- [x] `scripts/assert-export.js` - Metrics validation (6 assertions)
- [x] `rules/export.yml` - 5 operational alerts
- [x] `grafana-export-dashboard.json` - 5-panel dashboard

### Integration Steps
- [x] Export plugin registered in `services/executor/src/index.ts` (line 253-260)
- [x] Executor src directory copied from nested structure
- [x] Export output directory created (`./exports/`)
- [x] Package built successfully (exporter-core)

---

## 🔄 Manual Integration Steps

### Step 1: Install Dependencies

```bash
cd CursorGPT_IDE

# Using pnpm (preferred) [[memory:8673930]]
pnpm -w install

# OR using npm
npm install --workspaces
```

### Step 2: Build Packages

```bash
# Build exporter-core package (already done)
cd packages/exporter-core
pnpm build  # or npm run build

# Verify build output
ls -la dist/
# Should see: csvWriter.js, pdfWriter.js, metrics.js, index.js
```

### Step 3: Start Executor

```bash
cd CursorGPT_IDE

# Start executor with ts-node
node services/executor/run-dev.cjs

# Expected output:
# [BOOT] listened { address: '127.0.0.1', family: 'IPv4', port: 4001 }
# v1.7 Export@Scale plugin registered
# --- ROUTE TREE ---
# ... (should include /export/run, /export/status, /export/metrics)
```

**Troubleshooting**:
- If `ts-node` not found: `npm install -g ts-node` or `pnpm add -g ts-node`
- If port 4001 in use: `netstat -ano | findstr :4001` (Windows) or `lsof -i :4001` (Linux/Mac)
- If module errors: Check that `packages/exporter-core/dist/` contains compiled JS files

### Step 4: Verify Endpoints

```bash
# Health check
curl http://127.0.0.1:4001/health
# Expected: {"ok":true,"ts":...}

# Export status
curl http://127.0.0.1:4001/export/status
# Expected: {"status":"ready","concurrentExports":0,"queueDepth":0,...}

# Export metrics (should show all 9 metrics)
curl http://127.0.0.1:4001/export/metrics | grep "export_"
# Expected: export_requests_total, export_latency_ms_bucket, export_bytes_total, etc.
```

---

## 🧪 Integration Tests

### Smoke Tests (1k Records)

```bash
# CSV export - 1000 records
node scripts/seed-export.js --records=1000 --format=csv

# Expected output:
# Seeding 1000 records in csv format...
# ✅ Export successful: { format: 'csv', records: 1000, bytes: ~15000, processingTime: <500ms }

# PDF export - 1000 records
node scripts/seed-export.js --records=1000 --format=pdf

# Verify files created
ls -la exports/
# Should see: export_<timestamp>_<random>.csv, export_<timestamp>_<random>.pdf
```

**Success Criteria**:
- ✅ HTTP 200 responses
- ✅ Files created in `./exports/`
- ✅ Processing time < 1s for 1k records
- ✅ No errors in executor logs

### Load Tests (10k Records)

```bash
# Large CSV export - 10,000 records
node scripts/seed-export.js --records=10000 --format=csv

# Expected output:
# Seeding 10000 records in csv format...
# ✅ Export successful: { format: 'csv', records: 10000, bytes: ~150000, processingTime: <5000ms }
```

**Success Criteria**:
- ✅ Processing time < 10s (P95 target)
- ✅ Memory usage stable (no leaks)
- ✅ File size ~150KB for 10k records

### Batch Tests (Multiple Scenarios)

```bash
# Run 5 scenarios: 1k, 5k, 10k CSV + 1k, 5k PDF
node scripts/seed-export.js --batch

# Expected output:
# Running batch export tests...
# ✅ Export successful: { format: 'csv', records: 1000, ... }
# ✅ Export successful: { format: 'csv', records: 5000, ... }
# ✅ Export successful: { format: 'csv', records: 10000, ... }
# ✅ Export successful: { format: 'pdf', records: 1000, ... }
# ✅ Export successful: { format: 'pdf', records: 5000, ... }
# ✅ All batch tests completed
```

**Success Criteria**:
- ✅ 5/5 exports successful
- ✅ No 429 errors (within rate limit)
- ✅ Total time < 30s

### Metrics Validation

```bash
# Run assertions on collected metrics
node scripts/assert-export.js

# Expected output:
# === Export Metrics Assertions ===
# Latency Avg: XX.XXms (count: N)
# Success Rate: 100.0%
# Concurrent Exports: 0 / 5 max
# Queue Depth: 0
# Bytes Exported: XX.XX KB
# Metrics Found: 9/9
#
# === Assertions ===
# ✅ Metrics Coverage
# ✅ Latency P95 < 10s
# ✅ Success Rate >= 95%
# ✅ Concurrent <= 5
# ✅ Queue Depth <= 100
# ✅ Bytes Exported > 0
# ✅ All export metrics assertions passed!
```

**Success Criteria**:
- ✅ 6/6 assertions pass
- ✅ All 9 metrics present
- ✅ Success rate >= 95%

---

## 📊 Performance Validation

### Expected Performance Targets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **Latency P95** | < 10s for 10k | < 30s | histogram_quantile(0.95, ...) |
| **Throughput** | >= 0.05 jobs/sec | - | rate(export_requests_total[1m]) |
| **Success Rate** | >= 95% | >= 90% | export_success_rate |
| **Concurrency** | <= 5 | - | export_concurrent_running |
| **Memory** | < 100MB/export | < 500MB | export_memory_bytes |

### Manual Performance Check

```bash
# Fetch current metrics
curl http://127.0.0.1:4001/export/metrics > metrics_snapshot.txt

# Parse key metrics
cat metrics_snapshot.txt | grep -E "export_latency_ms_bucket_sum|export_latency_ms_bucket_count"

# Calculate avg latency
# latency_avg = sum / count

# Check success rate
cat metrics_snapshot.txt | grep "export_success_rate"
```

---

## 🚨 Alert Rules Testing

### Using promtool

```bash
# Test alert rules (if promtool installed)
promtool test rules rules/export.test.yml

# Expected output:
# Unit Testing: rules/export.test.yml
#   SUCCESS
```

### Alert Rules Coverage

1. **ExportLatencyP95High** - Triggers if P95 > 10s (warning) or > 30s (critical)
2. **ExportFailSpike** - Triggers if failures > 5 in 10m or > 10 in 5m
3. **ExportBytesAnomaly** - Triggers if bytes > 1GB in 1h
4. **ExportConcurrentHigh** - Triggers if concurrent > 10
5. **ExportSuccessRateLow** - Triggers if success rate < 95%

---

## 📈 Grafana Dashboard Import

### Dashboard Import Steps

1. Open Grafana UI (typically http://localhost:3000)
2. Go to **Dashboards** → **Import**
3. Upload `grafana-export-dashboard.json`
4. Select Prometheus datasource
5. Click **Import**

### Expected Panels

1. **Export Latency P95 (ms)** - Shows P95 latency trending over time
2. **Export Success Rate (%)** - Shows success rate gauge
3. **Export Bytes Total (MB)** - Shows cumulative bytes exported
4. **Concurrent Exports** - Shows current concurrent export count
5. **Export Throughput (ops/sec)** - Shows operations per second

---

## ✅ GREEN Status Criteria

### Code Completeness
- [x] All source files implemented
- [x] Package built successfully
- [x] Plugin registered in executor
- [x] Tests scripts ready

### Integration Readiness
- [ ] Executor starts without errors
- [ ] All 3 endpoints accessible (/status, /run, /metrics)
- [ ] Smoke tests pass (1k CSV/PDF)
- [ ] Load tests pass (10k CSV)
- [ ] Metrics validation passes (6/6 assertions)

### Performance Targets
- [ ] P95 latency < 10s for 10k records
- [ ] Success rate >= 95%
- [ ] Memory usage < 100MB
- [ ] No resource leaks detected

### Observability
- [ ] All 9 metrics present and updating
- [ ] Alert rules validated with promtool
- [ ] Grafana dashboard rendering correctly

---

## 🎯 Final Validation Checklist

```markdown
## v1.7 Export@Scale - Final Validation

### Prerequisites
- [ ] Dependencies installed (`pnpm install`)
- [ ] Exporter-core built (`pnpm build`)
- [ ] Executor running (port 4001)

### Smoke Tests
- [ ] 1k CSV export successful
- [ ] 1k PDF export successful
- [ ] Files created in ./exports/
- [ ] Processing time < 1s

### Load Tests
- [ ] 10k CSV export successful
- [ ] Processing time < 10s
- [ ] Memory usage stable

### Batch Tests
- [ ] 5 scenarios completed
- [ ] No 429 errors
- [ ] Total time < 30s

### Metrics
- [ ] All 9 metrics present
- [ ] Latency buckets populated
- [ ] Success rate >= 95%
- [ ] Assert script passes (6/6)

### Monitoring
- [ ] Alert rules tested (promtool)
- [ ] Grafana dashboard imported
- [ ] Panels rendering with live data

### Documentation
- [ ] GREEN_EVIDENCE_v1.7.md updated
- [ ] Test results documented
- [ ] Performance metrics recorded
```

---

## 📝 Evidence Collection

### Required Artifacts

1. **Test Logs**
   ```bash
   node scripts/seed-export.js --batch > evidence/export/seed_batch.log 2>&1
   node scripts/assert-export.js > evidence/export/assert.log 2>&1
   ```

2. **Metrics Snapshot**
   ```bash
   curl http://127.0.0.1:4001/export/metrics > evidence/export/metrics_snapshot.txt
   ```

3. **Export Samples**
   ```bash
   cp exports/export_*.csv evidence/export/sample_1k.csv
   cp exports/export_*.pdf evidence/export/sample_1k.pdf
   ```

4. **Promtool Results**
   ```bash
   promtool test rules rules/export.test.yml > evidence/export/promtool_results.txt
   ```

---

## 🚀 Next Steps After GREEN

1. **CI Integration**: Trigger `.github/workflows/export-ci.yml`
2. **Performance Profiling**: 50k+ record stress tests
3. **Production Deployment**: Docker containerization
4. **v1.8 Planning**: Advanced Analytics + ML Pipeline

---

**Status**: CODE COMPLETE → READY FOR MANUAL INTEGRATION  
**Last Updated**: 2025-10-08 09:50 UTC  
**Next**: Executor startup → Tests → GREEN validation

