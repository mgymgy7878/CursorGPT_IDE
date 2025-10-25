#!/bin/bash
# Artifact Completeness Check
# Verifies all deployment artifacts are present

set -e

REQ=32
EVIDENCE_DIR="evidence"
mkdir -p "$EVIDENCE_DIR"

echo "🔍 ARTIFACT COMPLETENESS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Required: $REQ artifacts"
echo ""

# Count artifacts from index
if [ -f "DEPLOYMENT_ARTIFACTS_INDEX.md" ]; then
    FOUND=$(grep -c '✅' DEPLOYMENT_ARTIFACTS_INDEX.md 2>/dev/null || echo 0)
else
    FOUND=0
fi

# Verify critical files exist
CRITICAL_FILES=(
    "GO_NO_GO_CHECKLIST.md"
    "CANARY_DEPLOYMENT_PROTOCOL.md"
    "FIRST_NIGHT_MONITORING.md"
    "PRE_DEPLOYMENT_BLIND_SPOTS.md"
    "RED_TEAM_CHECKLIST.md"
    "CANARY_RUN_OF_SHOW.md"
    "CORNER_CASES_EXPENSIVE_MISTAKES.md"
    "scripts/60s-preflight.sh"
    "scripts/micro-blast-radius-test.sh"
    "scripts/generate-release-oneliner.sh"
    "scripts/rollback.ps1"
    "scripts/green-button-ritual.sh"
    "config/prometheus/signal-enrichment-rules.yml"
    "config/prometheus/enhanced-rollback-rules.yml"
)

MISSING=0
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ MISSING: $file"
        MISSING=$((MISSING + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Record results
cat > "$EVIDENCE_DIR/artifact_count.txt" << EOF
ARTIFACT COMPLETENESS CHECK
===========================
Timestamp: $(date -u +%FT%TZ)
Required: $REQ
Found: $FOUND
Missing: $MISSING
Critical Files: ${#CRITICAL_FILES[@]}
Critical Missing: $MISSING

Status: $([ "$FOUND" -ge "$REQ" ] && [ "$MISSING" -eq 0 ] && echo "COMPLETE ✅" || echo "INCOMPLETE ❌")
EOF

cat "$EVIDENCE_DIR/artifact_count.txt"

echo ""

# Exit code
if [ "$FOUND" -ge "$REQ" ] && [ "$MISSING" -eq 0 ]; then
    echo "✅ ARTIFACT COMPLETENESS: PASS ($FOUND/$REQ)"
    echo "✅ All critical files present"
    echo ""
    echo "🟢 READY FOR DEPLOYMENT"
    exit 0
else
    echo "❌ ARTIFACT COMPLETENESS: FAIL ($FOUND/$REQ)"
    echo "❌ Missing critical files: $MISSING"
    echo ""
    echo "🚨 DEPLOYMENT BLOCKED - Fix missing artifacts"
    exit 1
fi
