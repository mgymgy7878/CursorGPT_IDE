#!/bin/bash
# GA Ship Closeout Script (T+48h Final Assessment)
# Usage: ./scripts/ga-closeout.sh [NONCE] [PROMETHEUS_URL]

set -euo pipefail

# Source fail-fast functions
source "$(dirname "$0")/ga-fail-fast.sh"

NONCE=${1:-"20250827180000-a1b2c3"}
PROMETHEUS_URL=${2:-"http://localhost:9090"}
VERSION="v1.5"

echo "📋 GA Ship Closeout - T+48h Final Assessment"
echo "==========================================="
echo "NONCE: $NONCE"
echo "Version: $VERSION"
echo "Timestamp: $(date -u)"
echo ""

# Create closeout report directory
CLOSEOUT_DIR="evidence/closeout/$(date -u +%Y%m%d%H%M%S)-$NONCE"
mkdir -p "$CLOSEOUT_DIR"

echo "📁 Closeout report directory: $CLOSEOUT_DIR"
echo ""

# 1) Metrikler: 48h toplam ↑; p95; fail sayaçları
echo "1️⃣ Metrics Analysis (48h totals)..."
echo "--------------------------------"

# Critical metrics
CRITICAL_METRICS=(
    "receipts_sig_bad_total"
    "receipts_fpr_mismatch_total"
    "nonce_reuse_detected_total"
    "offline_verify_fail_total"
    "receipts_gate_fail_total"
)

echo "Critical Metrics (48h totals):"
for metric in "${CRITICAL_METRICS[@]}"; do
    VALUE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(increase(${metric}[48h]))" | jq -r '.data.result[0].value[1] // "0"')
    if [ "$VALUE" = "0" ]; then
        echo "✅ $metric = $VALUE"
    else
        echo "❌ $metric = $VALUE (STOP-GATE TRIGGERED!)"
    fi
done

# Performance metrics
echo ""
echo "Performance Metrics:"
DURATION_P95=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=max_over_time(receipts_gate_duration_ms_p95[48h])" | jq -r '.data.result[0].value[1] // "0"')
if (( $(echo "$DURATION_P95 < 1000" | bc -l) )); then
    echo "✅ receipts_gate_duration_ms_p95 = ${DURATION_P95}ms (< 1s)"
else
    echo "⚠️  receipts_gate_duration_ms_p95 = ${DURATION_P95}ms (>= 1s)"
fi

FAIL_RATE_48H=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(rate(receipts_gate_fail_total[48h]))" | jq -r '.data.result[0].value[1] // "0"')
echo "📊 receipts_gate_fail_total rate (48h) = $FAIL_RATE_48H / 48h"

# 2) Offline verify: PASS/FAIL, FPR
echo ""
echo "2️⃣ Offline Verification Status..."
echo "-------------------------------"

MANIFEST_FILE="evidence/receipts-smoke/$NONCE/sha256-manifest.json"
SIGNATURE_FILE="evidence/receipts-smoke/$NONCE/sha256-manifest.json.asc"

if [ -f "$MANIFEST_FILE" ] && [ -f "$SIGNATURE_FILE" ]; then
    if gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep -q "VALIDSIG"; then
        FPR=$(gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep "VALIDSIG" | awk '{print $3}')
        echo "✅ Offline verification: PASS"
        echo "✅ FPR: $FPR"
        
        # Check against KEY_FINGERPRINTS.md
        if [ -f "docs/KEY_FINGERPRINTS.md" ] && grep -q "$FPR" "docs/KEY_FINGERPRINTS.md"; then
            echo "✅ FPR matches KEY_FINGERPRINTS.md"
        else
            echo "⚠️  FPR not found in KEY_FINGERPRINTS.md"
        fi
    else
        echo "❌ Offline verification: FAIL"
        echo "Offline verification failed" > "$CLOSEOUT_DIR/offline_verify_fail.txt"
    fi
else
    echo "❌ Manifest or signature file missing"
    echo "Files missing" > "$CLOSEOUT_DIR/missing_files.txt"
fi

# 3) Chaos CRON: PASS + link
echo ""
echo "3️⃣ Chaos CRON Status..."
echo "---------------------"

# Check if chaos CRON configuration exists
if [ -f "ops/chaos/receipts-chaos.yml" ]; then
    echo "✅ Chaos CRON configuration found"
    
    # Check if chaos CRON is enabled
    if grep -q "enabled: true" "ops/chaos/receipts-chaos.yml" 2>/dev/null; then
        echo "✅ Chaos CRON enabled"
    else
        echo "⚠️  Chaos CRON not enabled"
    fi
    
    # Check for intentional FAIL configuration
    if grep -q "intentional_fail" "ops/chaos/receipts-chaos.yml" 2>/dev/null; then
        echo "✅ Intentional FAIL configuration found"
    else
        echo "⚠️  Intentional FAIL configuration not found"
    fi
else
    echo "❌ Chaos CRON configuration not found"
    echo "Chaos CRON configuration missing" > "$CLOSEOUT_DIR/chaos_cron_missing.txt"
fi

# 4) Final karar: GREEN/AMBER/RED + varsa hotfix NONCE/SHA
echo ""
echo "4️⃣ Final Decision Assessment..."
echo "-----------------------------"

# Count issues
ISSUES=0
if [ -f "$CLOSEOUT_DIR"/*.txt ]; then
    ISSUES=$(ls "$CLOSEOUT_DIR"/*.txt 2>/dev/null | wc -l || echo "0")
fi

# Check for any non-zero critical metrics
CRITICAL_ISSUES=0
for metric in "${CRITICAL_METRICS[@]}"; do
    VALUE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(increase(${metric}[48h]))" | jq -r '.data.result[0].value[1] // "0"')
    if [ "$VALUE" != "0" ]; then
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
done

# Determine final status
if [ "$CRITICAL_ISSUES" -eq 0 ] && [ "$ISSUES" -eq 0 ]; then
    FINAL_STATUS="GREEN"
    echo "🎉 Final Status: GREEN"
    echo "✅ All critical metrics at 0"
    echo "✅ No issues detected"
    echo "✅ GA Ship successful"
elif [ "$CRITICAL_ISSUES" -eq 0 ] && [ "$ISSUES" -gt 0 ]; then
    FINAL_STATUS="AMBER"
    echo "⚠️  Final Status: AMBER"
    echo "✅ All critical metrics at 0"
    echo "⚠️  $ISSUES non-critical issues detected"
    echo "ℹ️  GA Ship successful with minor issues"
else
    FINAL_STATUS="RED"
    echo "❌ Final Status: RED"
    echo "❌ $CRITICAL_ISSUES critical issues detected"
    echo "❌ $ISSUES total issues detected"
    echo "🚨 GA Ship requires attention"
fi

# Check for hotfix requirements
if [ "$FINAL_STATUS" = "RED" ]; then
    echo ""
    echo "🚨 Hotfix Assessment..."
    echo "---------------------"
    
    # Generate hotfix NONCE
    HOTFIX_NONCE="$(date -u +%Y%m%d%H%M%S)-$(openssl rand -hex 3)-hotfix"
    echo "Hotfix NONCE: $HOTFIX_NONCE"
    echo "Hotfix NONCE: $HOTFIX_NONCE" > "$CLOSEOUT_DIR/hotfix_nonce.txt"
    
    # Create hotfix manifest
    HOTFIX_DIR="evidence/receipts-smoke/$HOTFIX_NONCE"
    mkdir -p "$HOTFIX_DIR"
    
    # Copy issues to hotfix directory
    cp "$CLOSEOUT_DIR"/*.txt "$HOTFIX_DIR/" 2>/dev/null || true
    
    echo "Hotfix directory: $HOTFIX_DIR"
    echo "Hotfix directory: $HOTFIX_DIR" >> "$CLOSEOUT_DIR/hotfix_nonce.txt"
fi

# 5) Generate closeout report
echo ""
echo "5️⃣ Generating Closeout Report..."
echo "------------------------------"

cat > "$CLOSEOUT_DIR/closeout-report.json" << EOF
{
  "closeout_timestamp": "$(date -u -Iseconds)",
  "nonce": "$NONCE",
  "version": "$VERSION",
  "final_status": "$FINAL_STATUS",
  "metrics_48h": {
    "receipts_sig_bad_total": "$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(increase(receipts_sig_bad_total[48h]))" | jq -r '.data.result[0].value[1] // "0"')",
    "receipts_fpr_mismatch_total": "$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(increase(receipts_fpr_mismatch_total[48h]))" | jq -r '.data.result[0].value[1] // "0"')",
    "nonce_reuse_detected_total": "$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(increase(nonce_reuse_detected_total[48h]))" | jq -r '.data.result[0].value[1] // "0"')",
    "offline_verify_fail_total": "$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(increase(offline_verify_fail_total[48h]))" | jq -r '.data.result[0].value[1] // "0"')",
    "receipts_gate_fail_total": "$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(increase(receipts_gate_fail_total[48h]))" | jq -r '.data.result[0].value[1] // "0"')",
    "receipts_gate_duration_ms_p95": "$DURATION_P95"
  },
  "offline_verification": {
    "status": "$(if gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep -q "VALIDSIG"; then echo "PASS"; else echo "FAIL"; fi)",
    "fpr": "$(gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep "VALIDSIG" | awk '{print $3}' || echo "unknown")"
  },
  "chaos_cron": {
    "configuration_exists": "$(if [ -f "ops/chaos/receipts-chaos.yml" ]; then echo "true"; else echo "false"; fi)",
    "enabled": "$(if [ -f "ops/chaos/receipts-chaos.yml" ] && grep -q "enabled: true" "ops/chaos/receipts-chaos.yml" 2>/dev/null; then echo "true"; else echo "false"; fi)"
  },
  "issues": {
    "critical_issues": $CRITICAL_ISSUES,
    "total_issues": $ISSUES,
    "issue_files": $(ls "$CLOSEOUT_DIR"/*.txt 2>/dev/null | wc -l || echo "0")
  },
  "hotfix": {
    "required": "$(if [ "$FINAL_STATUS" = "RED" ]; then echo "true"; else echo "false"; fi)",
    "nonce": "$(if [ "$FINAL_STATUS" = "RED" ]; then echo "$HOTFIX_NONCE"; else echo "null"; fi)",
    "directory": "$(if [ "$FINAL_STATUS" = "RED" ]; then echo "$HOTFIX_DIR"; else echo "null"; fi)"
  }
}
EOF

echo "✅ Closeout report generated: $CLOSEOUT_DIR/closeout-report.json"

# 6) Summary
echo ""
echo "📋 Closeout Summary:"
echo "==================="
echo "Final Status: $FINAL_STATUS"
echo "Critical Issues: $CRITICAL_ISSUES"
echo "Total Issues: $ISSUES"
echo "Closeout Directory: $CLOSEOUT_DIR"
echo "Report: $CLOSEOUT_DIR/closeout-report.json"

if [ "$FINAL_STATUS" = "RED" ]; then
    echo ""
    echo "🚨 HOTFIX REQUIRED:"
    echo "Hotfix NONCE: $HOTFIX_NONCE"
    echo "Hotfix Directory: $HOTFIX_DIR"
    echo "Next Steps:"
    echo "1. Review issues in $CLOSEOUT_DIR"
    echo "2. Generate new manifest with hotfix NONCE"
    echo "3. Re-sign and verify"
    echo "4. Update monitoring"
else
    echo ""
    echo "🎉 GA SHIP SUCCESSFUL!"
    echo "All critical metrics at 0"
    echo "No critical issues detected"
    echo "Production deployment validated"
fi 