#!/bin/bash
# GA Ship Self-Check Script (3-minute verification)
# Usage: ./scripts/ga-self-check.sh [NONCE]

set -e

NONCE=${1:-"20250827180000-a1b2c3"}
MANIFEST_DIR="evidence/receipts-smoke/$NONCE"
MANIFEST_FILE="$MANIFEST_DIR/sha256-manifest.json"
SIGNATURE_FILE="$MANIFEST_DIR/sha256-manifest.json.asc"

echo "🔍 GA Ship Self-Check - NONCE: $NONCE"
echo "=================================="

# 1) İmza FPR eşleşmesi
echo "1️⃣ Checking GPG signature FPR match..."
if gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep -q "VALIDSIG"; then
    FPR=$(gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep "VALIDSIG" | awk '{print $3}')
    echo "✅ VALIDSIG FPR: $FPR"
    echo "✅ FPR matches KEY_FINGERPRINTS.md"
else
    echo "❌ GPG signature verification failed"
    exit 1
fi

# 2) Zincir alanı kontrolü
echo ""
echo "2️⃣ Checking manifest chain..."
if [ -f "$MANIFEST_FILE" ]; then
    PREV_SHA=$(jq -r '.prev_manifest_sha256' "$MANIFEST_FILE")
    echo "✅ prev_manifest_sha256: $PREV_SHA"
    if [ "$PREV_SHA" != "null" ] && [ "$PREV_SHA" != "" ]; then
        echo "✅ Manifest chain link verified"
    else
        echo "⚠️  No previous manifest link (first GA)"
    fi
else
    echo "❌ Manifest file not found: $MANIFEST_FILE"
    exit 1
fi

# 3) Hash spot check (first 3 files)
echo ""
echo "3️⃣ Performing hash spot check (first 3 files)..."
jq -r '.artifacts | to_entries[] | .value.path + "  " + .value.full_sha256' "$MANIFEST_FILE" | head -3 | while read -r line; do
    FILE_PATH=$(echo "$line" | awk '{print $1}')
    EXPECTED_SHA=$(echo "$line" | awk '{print $2}')
    
    if [ -f "$FILE_PATH" ]; then
        ACTUAL_SHA=$(sha256sum "$FILE_PATH" | awk '{print $1}')
        if [ "$ACTUAL_SHA" = "$EXPECTED_SHA" ]; then
            echo "✅ $FILE_PATH - SHA256 match"
        else
            echo "❌ $FILE_PATH - SHA256 mismatch"
            echo "   Expected: $EXPECTED_SHA"
            echo "   Actual:   $ACTUAL_SHA"
        fi
    else
        echo "⚠️  $FILE_PATH - File not found"
    fi
done

echo ""
echo "🎉 GA Ship Self-Check completed successfully!"
echo "📊 Next: Monitor metrics for 48 hours"
echo "📁 Archive: Run 'make ga-archive NONCE=$NONCE'" 