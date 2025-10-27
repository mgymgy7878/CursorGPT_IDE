# v1.7 Export@Scale - Integration Test Plan

## Test Execution Plan

### Phase 1: Build & Setup
```bash
cd CursorGPT_IDE
pnpm -w install
pnpm -w build
```

### Phase 2: Start Executor
```bash
node CursorGPT_IDE/services/executor/run-dev.cjs
```

### Phase 3: Smoke Tests (1k records)
```bash
node scripts/seed-export.js --records=1000 --format=csv
node scripts/seed-export.js --records=1000 --format=pdf
```

### Phase 4: Load Tests (10k/50k records)
```bash
node scripts/seed-export.js --records=10000 --format=csv
node scripts/seed-export.js --batch
```

### Phase 5: Metrics Validation
```bash
node scripts/assert-export.js
curl http://127.0.0.1:4001/export/metrics
```

### Phase 6: Alert Rules
```bash
promtool test rules rules/export.test.yml
```

## Expected Results

### Smoke Tests
- ✅ HTTP 200 responses
- ✅ Export files created in ./exports/
- ✅ export_requests_total increments
- ✅ export_success_rate = 1.0

### Load Tests
- ✅ 10k CSV P95 < 10s
- ✅ 50k CSV P95 < 30s
- ✅ No OOM errors
- ✅ Steady memory usage

### Metrics
- ✅ All 9 metrics present
- ✅ Latency buckets populated
- ✅ Success rate >= 95%
- ✅ Concurrent exports <= 5

## Test Started
Date: 2025-10-08
Time: 09:35 UTC
Status: IN_PROGRESS

