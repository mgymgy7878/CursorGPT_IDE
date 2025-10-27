#!/bin/bash
# GA Ship Enhanced Quick Validation Script
# Usage: ./scripts/ga-quick-validate-enhanced.sh [NONCE]

set -euo pipefail

# Source fail-fast functions
source "$(dirname "$0")/ga-fail-fast.sh"

NONCE=${1:-"20250827180000-a1b2c3"}
VERSION="v1.5"

echo "🔍 GA Ship Enhanced Quick Validation - NONCE: $NONCE"
echo "=================================================="
echo ""

# 1) Tag imzası (FPR pinned)
echo "1️⃣ Verifying GA tag and signature (FPR pinned)..."
echo "------------------------------------------------"

# Check if tag exists
if ! git tag -l | grep -q "^$VERSION$"; then
    echo "EXECUTION_RECEIPTS: FAILED - GA tag $VERSION not found" >&2
    exit 1
fi

# Verify signed tag
if git verify-tag "$VERSION" 2>/dev/null; then
    echo "✅ GA tag $VERSION signature verified"
else
    echo "EXECUTION_RECEIPTS: FAILED - GA tag $VERSION signature verification failed" >&2
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
    echo "EXECUTION_RECEIPTS: FAILED - Could not extract tag signer FPR" >&2
    exit 1
fi

# 2) Manifest + imza + zincir
echo ""
echo "2️⃣ Verifying manifest, signature, and chain..."
echo "---------------------------------------------"

MANIFEST_FILE="evidence/receipts-smoke/$NONCE/sha256-manifest.json"
SIGNATURE_FILE="evidence/receipts-smoke/$NONCE/sha256-manifest.json.asc"

if [ ! -f "$MANIFEST_FILE" ] || [ ! -f "$SIGNATURE_FILE" ]; then
    echo "EXECUTION_RECEIPTS: FAILED - Manifest or signature file missing" >&2
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
    echo "EXECUTION_RECEIPTS: FAILED - Manifest signature verification failed" >&2
    exit 1
fi

# Check manifest chain
PREV_SHA=$(jq -r '.prev_manifest_sha256' "$MANIFEST_FILE")
echo "✅ prev_manifest_sha256: $PREV_SHA"

# Enhanced chain validation
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

# 3) Rastgele 3 dosyada spot SHA kontrolü
echo ""
echo "3️⃣ Performing random spot hash check (3 files)..."
echo "------------------------------------------------"

# Get random 3 artifacts and verify their hashes
jq -r '.artifacts | to_entries[] | [.value.full_sha256, .value.path] | @tsv' "$MANIFEST_FILE" | shuf -n 3 | while read -r sum path; do
    if [ -f "$path" ]; then
        ACTUAL_SHA=$(sha256sum "$path" | awk '{print $1}')
        if [ "$ACTUAL_SHA" = "$sum" ]; then
            echo "✅ $path - SHA256 match"
        else
            echo "EXECUTION_RECEIPTS: FAILED - SHA256 mismatch for $path" >&2
            echo "   Expected: $sum" >&2
            echo "   Actual:   $ACTUAL_SHA" >&2
            exit 1
        fi
    else
        echo "EXECUTION_RECEIPTS: FAILED - File not found: $path" >&2
        exit 1
    fi
done

# 4) Hardening checks
echo ""
echo "4️⃣ Running hardening checks..."
echo "-----------------------------"

# Idempotency check
check_idempotency "$NONCE"

# Symlink/traversal protection
check_symlink_traversal "$MANIFEST_FILE"

# CRLF check for manifest file
check_crlf "$MANIFEST_FILE"

# Digest-pinned check (if inputs.json exists)
INPUTS_FILE="evidence/receipts-smoke/$NONCE/inputs.json"
if [ -f "$INPUTS_FILE" ]; then
    check_digest_pinned "$INPUTS_FILE"
else
    echo "ℹ️  inputs.json not found, skipping digest-pinned check"
fi

# 5) Alarm E2E test
echo ""
echo "5️⃣ Running alarm E2E test..."
echo "---------------------------"

test_alarm_e2e

# 6) Transparency log entry
echo ""
echo "6️⃣ Adding transparency log entry..."
echo "----------------------------------"

CURRENT_MANIFEST_SHA=$(sha256sum "$MANIFEST_FILE" | awk '{print $1}')
add_transparency_log "$VERSION" "$NONCE" "$CURRENT_MANIFEST_SHA" "$MANIFEST_FPR" "VALIDATION_PASS"

# 7) Release notes chain update
echo ""
echo "7️⃣ Updating release notes chain..."
echo "--------------------------------"

update_release_notes_chain "$VERSION" "$PREV_SHA" "$CURRENT_MANIFEST_SHA"

echo ""
echo "🎉 GA Ship Enhanced Quick Validation completed successfully!"
echo "📊 All hardening checks passed"
echo "📁 Transparency log updated"
echo "📝 Release notes chain updated"
echo "🚨 Alarm E2E test completed" 