#!/bin/bash
# Micro Blast Radius Test
# Tests critical paths on canary pod BEFORE opening 1% traffic
# Detects "high P95 + low CPU" situations immediately

set -e

TARGET=${1:-"https://prod-canary.example.com"}
REL=${2:-"v1.4.0"}
DURATION=${3:-30}
EVIDENCE_DIR="evidence"

mkdir -p "$EVIDENCE_DIR"

echo "🧪 MICRO BLAST RADIUS TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: $TARGET"
echo "Duration: ${DURATION}s"
echo "Release: $REL"
echo ""

# Initialize counters
ok=0
err=0
total=0

# Test file
TEST_LOG="$EVIDENCE_DIR/micro_blast_${REL}.log"
API_LOG="$EVIDENCE_DIR/micro_api_${REL}.log"
WS_LOG="$EVIDENCE_DIR/micro_ws_${REL}.log"

: > "$TEST_LOG"
: > "$API_LOG"
: > "$WS_LOG"

# Start time
START=$SECONDS
END=$((SECONDS + DURATION))

echo "Testing for ${DURATION}s..."
echo ""

# Test loop
while [ $SECONDS -lt $END ]; do
    total=$((total + 1))
    
    # Test 1: API health endpoint
    API_RESULT=$(curl -s -o /dev/null -w 'code=%{http_code} time=%{time_total}' "$TARGET/api/healthz" 2>&1)
    echo "$API_RESULT" >> "$API_LOG"
    
    if echo "$API_RESULT" | grep -q "code=200"; then
        ok=$((ok + 1))
        printf "✅"
    else
        err=$((err + 1))
        printf "❌"
    fi
    
    # Test 2: WebSocket ping (HTTP fallback)
    WS_RESULT=$(curl -s -o /dev/null -w 'code=%{http_code} time=%{time_total}' -m 2 "$TARGET/api/ws/ping" 2>&1)
    echo "$WS_RESULT" >> "$WS_LOG"
    
    # Small delay between requests
    sleep 1
    
    # Progress indicator every 10 requests
    if [ $((total % 10)) -eq 0 ]; then
        echo " [${total}/${DURATION}]"
    fi
done

echo ""
echo ""

# Calculate statistics
SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($ok/$total)*100}")
ERROR_RATE=$(awk "BEGIN {printf \"%.2f\", ($err/$total)*100}")

# Extract latency statistics from logs
API_P95=$(awk -F'time=' '{print $2}' "$API_LOG" | sort -n | awk '{a[NR]=$1} END{print a[int(NR*0.95)]}')
API_P50=$(awk -F'time=' '{print $2}' "$API_LOG" | sort -n | awk '{a[NR]=$1} END{print a[int(NR*0.50)]}')

# Summary
{
    echo "MICRO BLAST RADIUS TEST RESULTS"
    echo "════════════════════════════════════════"
    echo "Release: $REL"
    echo "Target: $TARGET"
    echo "Duration: ${DURATION}s"
    echo "Timestamp: $TS"
    echo ""
    echo "Request Statistics:"
    echo "  Total: $total"
    echo "  Success: $ok"
    echo "  Errors: $err"
    echo "  Success Rate: ${SUCCESS_RATE}%"
    echo "  Error Rate: ${ERROR_RATE}%"
    echo ""
    echo "Latency Statistics:"
    echo "  API P50: ${API_P50}s"
    echo "  API P95: ${API_P95}s"
    echo ""
    echo "Pass Criteria:"
    echo "  ✅ Success Rate > 95%: $([ $(echo "$SUCCESS_RATE > 95" | bc) -eq 1 ] && echo "PASS" || echo "FAIL")"
    echo "  ✅ API P95 < 0.5s: $([ $(echo "$API_P95 < 0.5" | bc) -eq 1 ] && echo "PASS" || echo "FAIL")"
    echo ""
} | tee "$TEST_LOG"

# Now query Prometheus for CPU during test
echo "Querying Prometheus for CPU usage during test..."
if curl -f -s http://localhost:9090/api/v1/query > /dev/null 2>&1; then
    # Get current CPU rate
    CPU_RATE=$(curl -s "http://localhost:9090/api/v1/query?query=avg(rate(process_cpu_seconds_total[2m]))" | \
        jq -r '.data.result[0].value[1] // "0"')
    
    echo "cpu_rate=${CPU_RATE}" | tee -a "$TEST_LOG"
    
    # Check for "high latency + low CPU" pattern
    if [ $(echo "$API_P95 > 0.2" | bc) -eq 1 ] && [ $(echo "$CPU_RATE < 0.6" | bc) -eq 1 ]; then
        echo "⚠️  WARNING: High latency ($API_P95 s) with low CPU ($CPU_RATE)" | tee -a "$TEST_LOG"
        echo "   Possible backpressure or lock contention" | tee -a "$TEST_LOG"
    fi
else
    echo "⚠️  Prometheus not available for CPU check"
fi

# PromQL queries for evidence
cat > "$EVIDENCE_DIR/micro_prom_$REL.promql" <<'EOF'
# P95 latency (last 2 minutes)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="spark"}[2m]))

# 5xx rate (last 2 minutes)
rate(http_requests_total{job="spark",code=~"5.."}[2m]) / rate(http_requests_total{job="spark"}[2m])

# Idempotency conflicts (last 2 minutes)
rate(idempotency_conflict_total[2m])

# CPU usage
avg(rate(process_cpu_seconds_total[2m]))

# Memory usage
process_resident_memory_bytes
EOF

echo "✅ PromQL queries saved"

# Final verdict
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $(echo "$SUCCESS_RATE > 95" | bc) -eq 1 ] && [ $(echo "$API_P95 < 0.5" | bc) -eq 1 ]; then
    echo "✅ MICRO BLAST RADIUS: PASS"
    echo "   Canary pod is healthy, ready for 1% traffic"
    EXIT_CODE=0
else
    echo "❌ MICRO BLAST RADIUS: FAIL"
    echo "   Success Rate: ${SUCCESS_RATE}% (need >95%)"
    echo "   API P95: ${API_P95}s (need <0.5s)"
    echo ""
    echo "🚨 DO NOT PROCEED WITH CANARY DEPLOYMENT"
    EXIT_CODE=1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Evidence Files:"
echo "  • $TEST_LOG"
echo "  • $API_LOG"
echo "  • $WS_LOG"
echo "  • $EVIDENCE_DIR/micro_prom_$REL.promql"
echo ""

exit $EXIT_CODE
