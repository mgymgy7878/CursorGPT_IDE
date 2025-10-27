#!/bin/bash
# GA Ship 48-Hour Watch Script
# Usage: ./scripts/ga-watch-48h.sh [PROMETHEUS_URL]

set -e

PROMETHEUS_URL=${1:-"http://localhost:9090"}
NONCE=${2:-"20250827180000-a1b2c3"}
CHECKPOINT=${3:-"T0"}

echo "📊 GA Ship 48-Hour Watch - Checkpoint: $CHECKPOINT"
echo "================================================"

# PromQL queries for monitoring
QUERIES=(
    "sum(rate(receipts_gate_fail_total[5m]))"
    "sum(increase(nonce_reuse_detected_total[48h]))"
    "max_over_time(receipts_gate_duration_ms_p95[1h])"
    "sum(increase(receipts_fpr_mismatch_total[48h]))"
    "topk(5, increase(receipts_artifacts_missing_total[24h]))"
    "sum(receipts_sig_bad_total)"
    "sum(receipts_fpr_mismatch_total)"
    "sum(nonce_reuse_detected_total)"
    "sum(offline_verify_fail_total)"
)

echo "🔍 Checking critical metrics..."
echo ""

# Critical metrics check (T0, T+4h, T+24h, T+48h)
CRITICAL_METRICS=(
    "receipts_sig_bad_total"
    "receipts_fpr_mismatch_total"
    "nonce_reuse_detected_total"
    "offline_verify_fail_total"
)

for metric in "${CRITICAL_METRICS[@]}"; do
    VALUE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$metric" | jq -r '.data.result[0].value[1] // "0"')
    if [ "$VALUE" = "0" ]; then
        echo "✅ $metric = $VALUE"
    else
        echo "❌ $metric = $VALUE (STOP-GATE TRIGGERED!)"
        echo "🚨 IMMEDIATE ACTION REQUIRED - Check stop-gate triage procedures"
    fi
done

echo ""
echo "📈 Performance metrics..."

# Performance metrics
DURATION_P95=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=max_over_time(receipts_gate_duration_ms_p95[1h])" | jq -r '.data.result[0].value[1] // "0"')
if (( $(echo "$DURATION_P95 < 1000" | bc -l) )); then
    echo "✅ receipts_gate_duration_ms_p95 = ${DURATION_P95}ms (< 1s)"
else
    echo "⚠️  receipts_gate_duration_ms_p95 = ${DURATION_P95}ms (>= 1s)"
fi

FAIL_RATE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(rate(receipts_gate_fail_total[5m]))" | jq -r '.data.result[0].value[1] // "0"')
echo "📊 receipts_gate_fail_total rate = $FAIL_RATE / 5m"

echo ""
echo "🔗 Quick PromQL shortcuts:"
echo "------------------------"
echo "Fail rate (5m): sum(rate(receipts_gate_fail_total[5m]))"
echo "Nonce reuse (48h): sum(increase(nonce_reuse_detected_total[48h]))"
echo "Duration P95 (1h): max_over_time(receipts_gate_duration_ms_p95[1h])"
echo "FPR mismatch (48h): sum(increase(receipts_fpr_mismatch_total[48h]))"
echo "Missing artifacts (24h): topk(5, increase(receipts_artifacts_missing_total[24h]))"

echo ""
echo "📋 Checkpoint $CHECKPOINT completed"
echo "⏰ Next checkpoint: T+4h, T+24h, T+48h"
echo "📁 Daily export check: CSV/PDF with manifest SHA links"
echo "🔄 Weekly chaos CRON: Check for intentional FAIL (expected red)" 