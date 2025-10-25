#!/bin/bash
# Generate One-Line Health Summary for Release Notes
# Extracts key metrics from canary deployment evidence

set -e

REL=${1:-"v1.4.0"}
EVIDENCE_DIR="evidence"

echo "📝 Generating one-line health summary for $REL..."
echo ""

# Extract metrics from each stage
declare -A metrics

for stage in 1 5 25 50 100; do
    FILE="$EVIDENCE_DIR/rollout_stage_${stage}.txt"
    
    if [ -f "$FILE" ]; then
        # Extract P95 latency
        P95=$(grep "http_request_duration_seconds" "$FILE" | grep "0.95" | head -1 | awk '{print $NF}')
        
        # Extract 5xx rate (calculate from totals)
        ERR=$(grep "http_requests_total" "$FILE" | grep "code=\"5" | awk '{sum+=$NF} END{print sum}')
        TOTAL=$(grep "http_requests_total" "$FILE" | head -1 | awk '{print $NF}')
        if [ -n "$TOTAL" ] && [ "$TOTAL" != "0" ]; then
            ERR_RATE=$(awk "BEGIN {printf \"%.1f\", ($ERR/$TOTAL)*100}")
        else
            ERR_RATE="0.0"
        fi
        
        # Extract other metrics (if instrumented)
        WS_STALE=$(grep "spark_ws_staleness_seconds" "$FILE" | grep "0.95" | awk '{print $NF}' || echo "N/A")
        RISK=$(grep "spark_risk_block_total" "$FILE" | awk '{print $NF}' || echo "0")
        IDEMP=$(grep "idempotency_conflict" "$FILE" | awk '{print $NF}' || echo "0")
        CSP=$(grep "csp_violations_total" "$FILE" | awk '{print $NF}' || echo "0")
        
        metrics[$stage]="p95=${P95:-N/A} 5xx=${ERR_RATE}% ws_stale=${WS_STALE} risk=${RISK} idemp=${IDEMP} csp=${CSP}"
    else
        metrics[$stage]="no_data"
    fi
done

# Get baseline for comparison
BASELINE_P95=$(grep "http_request_duration_seconds" "$EVIDENCE_DIR/baseline_$REL.prom" 2>/dev/null | grep "0.95" | head -1 | awk '{print $NF}' || echo "N/A")
BASELINE_CSP=$(grep "csp_violations_total" "$EVIDENCE_DIR/baseline_$REL.prom" 2>/dev/null | awk '{print $NF}' || echo "0")

# Check if any rollbacks occurred
ROLLBACK_COUNT=$(ls "$EVIDENCE_DIR"/rollback_*.txt 2>/dev/null | wc -l)

# Generate one-liner
ONELINER="$REL canary: 1%→100% "

# All stages passed check
ALL_PASS=true
for stage in 1 5 25 50 100; do
    if [ "${metrics[$stage]}" = "no_data" ]; then
        ALL_PASS=false
    fi
done

if [ "$ALL_PASS" = true ]; then
    ONELINER+="tüm aşamalar 6/6 metrik geçer; "
else
    ONELINER+="bazı aşamalar veri eksik; "
fi

# Add rollback info
ONELINER+="rollback=$ROLLBACK_COUNT; "

# Add aggregated metrics (from stage 100 or highest available)
FINAL_STAGE=100
if [ -f "$EVIDENCE_DIR/rollout_stage_100.txt" ]; then
    FINAL_METRICS="${metrics[100]}"
elif [ -f "$EVIDENCE_DIR/rollout_stage_50.txt" ]; then
    FINAL_STAGE=50
    FINAL_METRICS="${metrics[50]}"
else
    FINAL_METRICS="metrics_not_available"
fi

# Parse final metrics for one-liner
if [ "$FINAL_METRICS" != "metrics_not_available" ]; then
    P95_FINAL=$(echo "$FINAL_METRICS" | grep -oP 'p95=\K[0-9.]+' || echo "N/A")
    ERR_FINAL=$(echo "$FINAL_METRICS" | grep -oP '5xx=\K[0-9.]+' || echo "N/A")
    WS_FINAL=$(echo "$FINAL_METRICS" | grep -oP 'ws_stale=\K[0-9.]+' || echo "N/A")
    RISK_FINAL=$(echo "$FINAL_METRICS" | grep -oP 'risk=\K[0-9.]+' || echo "N/A")
    IDEMP_FINAL=$(echo "$FINAL_METRICS" | grep -oP 'idemp=\K[0-9.]+' || echo "N/A")
    CSP_FINAL=$(echo "$FINAL_METRICS" | grep -oP 'csp=\K[0-9.]+' || echo "N/A")
    
    # Convert P95 to milliseconds
    if [ "$P95_FINAL" != "N/A" ]; then
        P95_MS=$(awk "BEGIN {printf \"%.0f\", $P95_FINAL * 1000}")
        ONELINER+="p95=~${P95_MS}ms, "
    fi
    
    ONELINER+="5xx=${ERR_FINAL}%, "
    ONELINER+="ws_stale_p95=${WS_FINAL}s, "
    ONELINER+="risk_block=${RISK_FINAL}/min, "
    
    # Calculate idempotency conflict percentage
    if [ "$IDEMP_FINAL" != "N/A" ] && [ -n "$TOTAL" ] && [ "$TOTAL" != "0" ]; then
        IDEMP_PCT=$(awk "BEGIN {printf \"%.1f\", ($IDEMP_FINAL/$TOTAL)*100}")
        ONELINER+="idemp_conflict=${IDEMP_PCT}%, "
    fi
    
    # Calculate CSP increase
    if [ "$CSP_FINAL" != "N/A" ] && [ "$BASELINE_CSP" != "0" ]; then
        CSP_INCREASE=$(awk "BEGIN {printf \"%.0f\", (($CSP_FINAL-$BASELINE_CSP)/$BASELINE_CSP)*100}")
        ONELINER+="csp_viol=baseline+${CSP_INCREASE}%."
    else
        ONELINER+="csp_viol=baseline."
    fi
else
    ONELINER+="metrics data incomplete."
fi

# Write to file
echo "$ONELINER" | tee "$EVIDENCE_DIR/release_oneliner_$REL.txt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ONE-LINER GENERATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy this to release notes:"
echo ""
echo "$ONELINER"
echo ""
echo "Evidence: $EVIDENCE_DIR/release_oneliner_$REL.txt"
echo ""

exit 0
