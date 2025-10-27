#!/bin/bash
# GA Ship Stop-Gate Triage Script
# Usage: ./scripts/ga-stop-gate-triage.sh [NONCE] [INCIDENT_TYPE]

set -e

NONCE=${1:-"20250827180000-a1b2c3"}
INCIDENT_TYPE=${2:-"unknown"}
MANIFEST_DIR="evidence/receipts-smoke/$NONCE"
MANIFEST_FILE="$MANIFEST_DIR/sha256-manifest.json"
SIGNATURE_FILE="$MANIFEST_DIR/sha256-manifest.json.asc"
INPUTS_FILE="$MANIFEST_DIR/inputs.json"

echo "🚨 GA Ship Stop-Gate Triage - Incident: $INCIDENT_TYPE"
echo "=================================================="
echo "NONCE: $NONCE"
echo "Timestamp: $(date -u)"
echo ""

# Create incident directory
INCIDENT_DIR="evidence/incidents/$(date -u +%Y%m%d%H%M%S)-$INCIDENT_TYPE"
mkdir -p "$INCIDENT_DIR"

echo "📁 Incident directory: $INCIDENT_DIR"
echo ""

# 1) FPR ve full SHA doğrulama
echo "1️⃣ Verifying FPR and full SHA..."
echo "--------------------------------"

if [ -f "$SIGNATURE_FILE" ] && [ -f "$MANIFEST_FILE" ]; then
    echo "Checking GPG signature..."
    if gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep -q "VALIDSIG"; then
        FPR=$(gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep "VALIDSIG" | awk '{print $3}')
        echo "✅ VALIDSIG FPR: $FPR"
        
        # Check against KEY_FINGERPRINTS.md
        if [ -f "docs/KEY_FINGERPRINTS.md" ]; then
            if grep -q "$FPR" "docs/KEY_FINGERPRINTS.md"; then
                echo "✅ FPR matches KEY_FINGERPRINTS.md"
            else
                echo "❌ FPR mismatch with KEY_FINGERPRINTS.md"
                echo "FPR: $FPR" > "$INCIDENT_DIR/fpr_mismatch.txt"
            fi
        fi
    else
        echo "❌ GPG signature verification failed"
        echo "GPG verification failed" > "$INCIDENT_DIR/sig_verify_fail.txt"
    fi
else
    echo "❌ Signature or manifest file missing"
    echo "Files missing" > "$INCIDENT_DIR/missing_files.txt"
fi

# 2) Air-gapped offline verification
echo ""
echo "2️⃣ Running air-gapped offline verification..."
echo "--------------------------------------------"

if [ -f "scripts/verify-offline.sh" ]; then
    echo "Running verify-offline.sh..."
    if ./scripts/verify-offline.sh "$MANIFEST_FILE" "$SIGNATURE_FILE"; then
        echo "✅ Offline verification PASS"
    else
        echo "❌ Offline verification FAIL"
        echo "Offline verification failed" > "$INCIDENT_DIR/offline_verify_fail.txt"
    fi
else
    echo "⚠️  verify-offline.sh not found"
fi

# 3) Inputs.json ile dosya eşleşmesi
echo ""
echo "3️⃣ Checking inputs.json file matches..."
echo "--------------------------------------"

if [ -f "$INPUTS_FILE" ]; then
    echo "Checking dashboard and alert files..."
    
    # Check dashboard file
    DASHBOARD_PATH=$(jq -r '.inputs["dashboards/trading-executor.json"].path // "dashboards/trading-executor.json"' "$INPUTS_FILE")
    DASHBOARD_SHA=$(jq -r '.inputs["dashboards/trading-executor.json"].full_sha256' "$INPUTS_FILE")
    
    if [ -f "$DASHBOARD_PATH" ]; then
        ACTUAL_SHA=$(sha256sum "$DASHBOARD_PATH" | awk '{print $1}')
        if [ "$ACTUAL_SHA" = "$DASHBOARD_SHA" ]; then
            echo "✅ Dashboard file SHA256 match"
        else
            echo "❌ Dashboard file SHA256 mismatch"
            echo "Dashboard SHA mismatch: expected=$DASHBOARD_SHA, actual=$ACTUAL_SHA" > "$INCIDENT_DIR/dashboard_sha_mismatch.txt"
        fi
    else
        echo "⚠️  Dashboard file not found: $DASHBOARD_PATH"
    fi
    
    # Check alert file
    ALERT_PATH=$(jq -r '.inputs["prometheus/alerts/receipts.rules.yml"].path // "prometheus/alerts/receipts.rules.yml"' "$INPUTS_FILE")
    ALERT_SHA=$(jq -r '.inputs["prometheus/alerts/receipts.rules.yml"].full_sha256' "$INPUTS_FILE")
    
    if [ -f "$ALERT_PATH" ]; then
        ACTUAL_SHA=$(sha256sum "$ALERT_PATH" | awk '{print $1}')
        if [ "$ACTUAL_SHA" = "$ALERT_SHA" ]; then
            echo "✅ Alert file SHA256 match"
        else
            echo "❌ Alert file SHA256 mismatch"
            echo "Alert SHA mismatch: expected=$ALERT_SHA, actual=$ACTUAL_SHA" > "$INCIDENT_DIR/alert_sha_mismatch.txt"
        fi
    else
        echo "⚠️  Alert file not found: $ALERT_PATH"
    fi
else
    echo "❌ inputs.json not found"
fi

# 4) Manifest zinciri kontrolü
echo ""
echo "4️⃣ Checking manifest chain integrity..."
echo "-------------------------------------"

if [ -f "$MANIFEST_FILE" ]; then
    PREV_SHA=$(jq -r '.prev_manifest_sha256' "$MANIFEST_FILE")
    CURRENT_SHA=$(sha256sum "$MANIFEST_FILE" | awk '{print $1}')
    
    echo "Current manifest SHA: $CURRENT_SHA"
    echo "Previous manifest SHA: $PREV_SHA"
    
    if [ "$PREV_SHA" != "null" ] && [ "$PREV_SHA" != "" ]; then
        # Check if previous manifest exists
        PREV_MANIFEST=$(find evidence/receipts-smoke -name "sha256-manifest.json" -exec grep -l "$PREV_SHA" {} \; 2>/dev/null || true)
        if [ -n "$PREV_MANIFEST" ]; then
            echo "✅ Previous manifest found: $PREV_MANIFEST"
        else
            echo "❌ Previous manifest not found for SHA: $PREV_SHA"
            echo "Previous manifest missing: $PREV_SHA" > "$INCIDENT_DIR/prev_manifest_missing.txt"
        fi
    else
        echo "⚠️  No previous manifest link (first GA)"
    fi
else
    echo "❌ Current manifest not found"
fi

# 5) Hotfix manifest üretimi (gerekirse)
echo ""
echo "5️⃣ Hotfix manifest generation (if needed)..."
echo "-------------------------------------------"

if [ -f "$INCIDENT_DIR"/*.txt ]; then
    echo "❌ Issues detected - Hotfix manifest required"
    echo "Generating hotfix manifest..."
    
    HOTFIX_NONCE="$(date -u +%Y%m%d%H%M%S)-$(openssl rand -hex 3)-hotfix"
    HOTFIX_DIR="evidence/receipts-smoke/$HOTFIX_NONCE"
    mkdir -p "$HOTFIX_DIR"
    
    # Generate hotfix manifest
    echo "Creating hotfix manifest: $HOTFIX_NONCE"
    echo "Hotfix NONCE: $HOTFIX_NONCE" > "$INCIDENT_DIR/hotfix_nonce.txt"
    echo "Hotfix directory: $HOTFIX_DIR" >> "$INCIDENT_DIR/hotfix_nonce.txt"
    
    # Copy incident details
    cp "$INCIDENT_DIR"/*.txt "$HOTFIX_DIR/" 2>/dev/null || true
else
    echo "✅ No issues detected - Hotfix not required"
fi

echo ""
echo "📋 Triage Summary:"
echo "================="
echo "Incident Type: $INCIDENT_TYPE"
echo "NONCE: $NONCE"
echo "Incident Directory: $INCIDENT_DIR"
echo "Issues Found: $(ls "$INCIDENT_DIR"/*.txt 2>/dev/null | wc -l || echo "0")"

if [ -f "$INCIDENT_DIR/hotfix_nonce.txt" ]; then
    echo "Hotfix Required: YES"
    echo "Hotfix NONCE: $(grep "Hotfix NONCE:" "$INCIDENT_DIR/hotfix_nonce.txt" | cut -d: -f2 | xargs)"
else
    echo "Hotfix Required: NO"
fi

echo ""
echo "🚨 Next Steps:"
echo "1. Review incident directory: $INCIDENT_DIR"
echo "2. If hotfix required, run GA ship with new NONCE"
echo "3. Update monitoring and alerting"
echo "4. Document incident in runbook" 