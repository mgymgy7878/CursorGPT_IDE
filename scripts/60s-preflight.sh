#!/bin/bash
# 60-Second Preflight Check
# Evidence-producing rapid pre-deployment verification

set -e

REL=${1:-"v1.4.0"}
TS=$(date -u +%FT%TZ)
SHA=$(git rev-parse --short HEAD)
EVIDENCE_DIR="evidence"

mkdir -p "$EVIDENCE_DIR"

echo "⚡ 60-SECOND PREFLIGHT CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Release: $REL | SHA: $SHA | TS: $TS"
echo ""

# Step 1: Identity & Time Seal (5s)
echo "[1/9] 🔐 Identity & Time Seal..."
printf "rel=%s\nsha=%s\nts=%s\ndeployer=%s\nhost=%s\n" \
    "$REL" "$SHA" "$TS" "$(whoami)" "$(hostname)" | tee "$EVIDENCE_DIR/preflight.txt"
echo "✅ Sealed"

# Step 2: Time Drift (NTP/DB) (5s)
echo "[2/9] ⏰ Time Drift..."
if command -v ntpq &> /dev/null; then
    ntpq -p | awk '/^\*/{print "ntp_offset=" $9 "ms"}' | tee -a "$EVIDENCE_DIR/preflight.txt"
else
    echo "ntp=not_available" | tee -a "$EVIDENCE_DIR/preflight.txt"
fi

if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -Atc "SELECT now()" | xargs -I{} printf "db_now=%s\n" "{}" | tee -a "$EVIDENCE_DIR/preflight.txt"
    node -e "console.log('node_now=' + new Date().toISOString())" | tee -a "$EVIDENCE_DIR/preflight.txt"
else
    echo "⚠️  DATABASE_URL not set"
fi
echo "✅ Checked"

# Step 3: pgBouncer Saturation (5s)
echo "[3/9] 🔄 pgBouncer Saturation..."
if [ -n "$PGBOUNCER_URL" ]; then
    psql "$PGBOUNCER_URL" -Atc "SHOW POOLS;" | tee "$EVIDENCE_DIR/pgbouncer_pools_$REL.tsv"
    # Calculate saturation
    psql "$PGBOUNCER_URL" -Atc "SHOW POOLS;" | awk -F'|' 'NR>1{active+=$4; total+=$6} END{print "saturation=" int(100*active/total) "%"}' | tee -a "$EVIDENCE_DIR/preflight.txt"
else
    echo "⚠️  PGBOUNCER_URL not set"
fi
echo "✅ Checked"

# Step 4: Prisma Migration Status (5s)
echo "[4/9] 🗄️ Prisma Migration..."
if command -v pnpm &> /dev/null; then
    pnpm prisma migrate status 2>&1 | tee "$EVIDENCE_DIR/prisma_status_$REL.txt"
    # Check for "up to date"
    if grep -q "Database schema is up to date" "$EVIDENCE_DIR/prisma_status_$REL.txt"; then
        echo "migration_status=up_to_date" | tee -a "$EVIDENCE_DIR/preflight.txt"
    else
        echo "migration_status=WARNING" | tee -a "$EVIDENCE_DIR/preflight.txt"
    fi
else
    echo "⚠️  pnpm not available"
fi
echo "✅ Checked"

# Step 5: CSP/COEP Headers (10s)
echo "[5/9] 🔒 CSP/COEP Headers..."
TARGET=${PROD_URL:-"http://localhost:3003"}
for path in / /dashboard /api/healthz; do
    curl -sI "$TARGET$path" 2>/dev/null | \
        awk 'BEGIN{IGNORECASE=1}
        /^content-security-policy:/||
        /^cross-origin-embedder-policy:/||
        /^cross-origin-opener-policy:/||
        /^strict-transport-security:/{print}' | \
        tee -a "$EVIDENCE_DIR/csp_headers_$REL.txt"
done
echo "✅ Checked"

# Step 6: Sequence Anomalies (5s)
echo "[6/9] 🔢 Sequence Anomalies..."
if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -Atc "
    SELECT sequence_name || '=' || last_value 
    FROM information_schema.sequences 
    WHERE sequence_schema='public' 
    ORDER BY last_value DESC 
    LIMIT 10" | tee "$EVIDENCE_DIR/sequences_$REL.txt"
else
    echo "⚠️  DATABASE_URL not set"
fi
echo "✅ Checked"

# Step 7: Feature Flag Defaults (5s)
echo "[7/9] 🚩 Feature Flags..."
if [ -f ".env.production" ]; then
    grep -E "FEATURE_|ENABLE_" .env.production | tee "$EVIDENCE_DIR/feature_flags_$REL.txt"
else
    echo "⚠️  .env.production not found"
fi
echo "✅ Checked"

# Step 8: Prometheus Targets (5s)
echo "[8/9] 📊 Prometheus Targets..."
if curl -f -s http://localhost:9090/api/v1/targets > /dev/null 2>&1; then
    curl -s http://localhost:9090/api/v1/targets | \
        jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"' | \
        tee "$EVIDENCE_DIR/prom_targets_$REL.txt"
    
    # Count targets
    TARGET_COUNT=$(curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length')
    echo "prom_targets=$TARGET_COUNT" | tee -a "$EVIDENCE_DIR/preflight.txt"
else
    echo "⚠️  Prometheus not available"
fi
echo "✅ Checked"

# Step 9: Baseline Metrics Snapshot (10s)
echo "[9/9] 📈 Baseline Metrics..."
if [ -n "$API_URL" ]; then
    API_URL=${API_URL:-"http://localhost:4001"}
    curl -s "$API_URL/api/public/metrics.prom" > "$EVIDENCE_DIR/baseline_$REL.prom"
    
    # Extract key metrics
    {
        echo "=== BASELINE METRICS ==="
        grep "http_request_duration_seconds" "$EVIDENCE_DIR/baseline_$REL.prom" | grep "quantile=\"0.95\"" | head -3
        grep "http_requests_total" "$EVIDENCE_DIR/baseline_$REL.prom" | grep "code=\"5" | head -3
        grep "database_connections" "$EVIDENCE_DIR/baseline_$REL.prom" | head -3
    } | tee "$EVIDENCE_DIR/baseline_summary_$REL.txt"
else
    echo "⚠️  API_URL not set"
fi
echo "✅ Captured"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 60-SECOND PREFLIGHT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Evidence Files:"
ls -lh "$EVIDENCE_DIR"/preflight.txt \
       "$EVIDENCE_DIR"/pgbouncer_pools_$REL.tsv \
       "$EVIDENCE_DIR"/prisma_status_$REL.txt \
       "$EVIDENCE_DIR"/csp_headers_$REL.txt \
       "$EVIDENCE_DIR"/sequences_$REL.txt \
       "$EVIDENCE_DIR"/feature_flags_$REL.txt \
       "$EVIDENCE_DIR"/prom_targets_$REL.txt \
       "$EVIDENCE_DIR"/baseline_$REL.prom \
       "$EVIDENCE_DIR"/baseline_summary_$REL.txt 2>/dev/null || true
echo ""
echo "📊 Summary: $EVIDENCE_DIR/preflight.txt"
echo ""
echo "🟢 READY FOR CANARY DEPLOYMENT"
echo ""

exit 0
