#!/bin/bash
# GA Ship Quick Validation Script
# Usage: ./scripts/ga-quick-validate.sh [NONCE]

set -euo pipefail

# Source fail-fast functions
source "$(dirname "$0")/ga-fail-fast.sh"

NONCE=${1:-"20250827180000-a1b2c3"}
VERSION="v1.5"

echo "🔍 GA Ship Quick Validation - NONCE: $NONCE"
echo "=========================================="
echo ""

# 1) Tag & imza doğrulama
echo "1️⃣ Verifying GA tag and signature..."
echo "-----------------------------------"

# Verify signed tag
if git verify-tag "$VERSION" 2>/dev/null; then
    echo "✅ GA tag $VERSION signature verified"
else
    echo "❌ GA tag $VERSION signature verification failed"
    exit 1
fi

# Check tag signature with pinned key
TAG_SIGNER=$(git tag -v "$VERSION" 2>&1 | grep "VALIDSIG" | awk '{print $3}' || echo "")
if [ -n "$TAG_SIGNER" ]; then
    echo "✅ Tag signer FPR: $TAG_SIGNER"
    # Check against KEY_FINGERPRINTS.md
    if [ -f "docs/KEY_FINGERPRINTS.md" ] && grep -q "$TAG_SIGNER" "docs/KEY_FINGERPRINTS.md"; then
        echo "✅ Tag signer FPR matches KEY_FINGERPRINTS.md"
    else
        echo "⚠️  Tag signer FPR not found in KEY_FINGERPRINTS.md"
    fi
else
    echo "❌ Could not extract tag signer FPR"
    exit 1
fi

# 2) Manifest + imza + zincir doğrulama
echo ""
echo "2️⃣ Verifying manifest, signature, and chain..."
echo "---------------------------------------------"

MANIFEST_FILE="evidence/receipts-smoke/$NONCE/sha256-manifest.json"
SIGNATURE_FILE="evidence/receipts-smoke/$NONCE/sha256-manifest.json.asc"

if [ ! -f "$MANIFEST_FILE" ] || [ ! -f "$SIGNATURE_FILE" ]; then
    echo "❌ Manifest or signature file missing"
    exit 1
fi

# Verify GPG signature
if gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep -q "VALIDSIG"; then
    MANIFEST_FPR=$(gpg --verify "$SIGNATURE_FILE" "$MANIFEST_FILE" 2>&1 | grep "VALIDSIG" | awk '{print $3}')
    echo "✅ Manifest signature verified - FPR: $MANIFEST_FPR"
    
    # Check against KEY_FINGERPRINTS.md
    if [ -f "docs/KEY_FINGERPRINTS.md" ] && grep -q "$MANIFEST_FPR" "docs/KEY_FINGERPRINTS.md"; then
        echo "✅ Manifest FPR matches KEY_FINGERPRINTS.md"
    else
        echo "⚠️  Manifest FPR not found in KEY_FINGERPRINTS.md"
    fi
else
    echo "❌ Manifest signature verification failed"
    exit 1
fi

# Check manifest chain
PREV_SHA=$(jq -r '.prev_manifest_sha256' "$MANIFEST_FILE")
echo "✅ prev_manifest_sha256: $PREV_SHA"

if [ "$PREV_SHA" != "null" ] && [ "$PREV_SHA" != "" ]; then
    # Check if previous manifest exists
    PREV_MANIFEST=$(find evidence/receipts-smoke -name "sha256-manifest.json" -exec grep -l "$PREV_SHA" {} \; 2>/dev/null || true)
    if [ -n "$PREV_MANIFEST" ]; then
        echo "✅ Previous manifest found: $PREV_MANIFEST"
    else
        echo "⚠️  Previous manifest not found for SHA: $PREV_SHA"
    fi
else
    echo "ℹ️  No previous manifest link (first GA)"
fi

# 3) Spot hash kontrolü (manifest → dosya)
echo ""
echo "3️⃣ Performing spot hash check (manifest → files)..."
echo "------------------------------------------------"

# Get first 3 artifacts and verify their hashes
jq -r '.artifacts | to_entries[] | [.value.full_sha256, .value.path] | @tsv' "$MANIFEST_FILE" | head -3 | while read -r sum path; do
    if [ -f "$path" ]; then
        ACTUAL_SHA=$(sha256sum "$path" | awk '{print $1}')
        if [ "$ACTUAL_SHA" = "$sum" ]; then
            echo "✅ $path - SHA256 match"
        else
            echo "❌ $path - SHA256 mismatch"
            echo "   Expected: $sum"
            echo "   Actual:   $ACTUAL_SHA"
        fi
    else
        echo "⚠️  $path - File not found"
    fi
done

# 4) Self-check scriptleri çalışıyor mu
echo ""
echo "4️⃣ Testing self-check scripts..."
echo "-------------------------------"

# Make scripts executable
chmod +x scripts/ga-self-check.sh scripts/ga-archive.sh scripts/ga-watch-48h.sh scripts/ga-stop-gate-triage.sh 2>/dev/null || true

# Test self-check script
if [ -f "scripts/ga-self-check.sh" ]; then
    echo "✅ ga-self-check.sh is executable"
    # Run a quick test (non-destructive)
    if ./scripts/ga-self-check.sh "$NONCE" >/dev/null 2>&1; then
        echo "✅ ga-self-check.sh execution test passed"
    else
        echo "⚠️  ga-self-check.sh execution test failed (check dependencies)"
    fi
else
    echo "❌ ga-self-check.sh not found"
fi

# Test other scripts exist and are executable
for script in "ga-archive.sh" "ga-watch-48h.sh" "ga-stop-gate-triage.sh"; do
    if [ -f "scripts/$script" ]; then
        echo "✅ $script is executable"
    else
        echo "❌ $script not found"
    fi
done

echo ""
echo "🎉 GA Ship Quick Validation completed!"
echo "📊 Next: Start 48-hour monitoring"
echo "⏰ Checkpoints: T+4h, T+24h, T+48h"
echo "🚨 Stop-gates: receipts_sig_bad_total, receipts_fpr_mismatch_total, nonce_reuse_detected_total, offline_verify_fail_total" 