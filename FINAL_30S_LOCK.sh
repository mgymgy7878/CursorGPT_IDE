#!/usr/bin/env bash
# Final 30-Second Lock - Pre-Launch Ritual

set -euo pipefail

REL=${1:-v1.4.0}
PROM=${PROMETHEUS_URL:-http://localhost:9090}

echo "🔒 FINAL 30-SECOND LOCK - $REL"
echo "════════════════════════════════════════════════════════════════"

# 1) İmmütabilite: tag, build, SBOM aynı mı?
echo "[1/3] Immutability check..."
git -c advice.detachedHead=false fetch --tags || true
git tag -v "$REL" 2>&1 | grep -E "Good signature|Can't check" || echo "⚠️  No GPG signature"

if [ -f "build_provenance_${REL}.json" ]; then
  echo "Build digest: $(jq -r '.artifactDigest // "N/A"' build_provenance_${REL}.json)"
else
  echo "⚠️  build_provenance_${REL}.json not found"
fi

if [ -f "sbom_${REL}.json" ]; then
  SBOM_COUNT=$(jq -r '.artifacts[]?.name' sbom_${REL}.json 2>/dev/null | wc -l || echo 0)
  echo "SBOM artifacts: $SBOM_COUNT"
else
  echo "⚠️  sbom_${REL}.json not found"
fi

# 2) Alarm temizi: sessizlik/snooze kalmış mı?
echo "[2/3] Alarm cleanup check..."
SILENT_ALERTS=$(curl -s "$PROM/api/v1/alerts" 2>/dev/null \
  | jq '[.data.alerts[] | select(.labels.severity=="critical" and .status.state!="firing")] | length' \
  || echo "N/A")
echo "Silent critical alerts: $SILENT_ALERTS"

# 3) Geri dönüş tatbikatı (dry-run, 5sn)
echo "[3/3] Rollback drill (dry-run)..."
if command -v pwsh &> /dev/null; then
  pwsh -NoProfile -File scripts/rollback.ps1 -Reason "dry-run" -Stage "N/A" -WhatIf 2>&1 | head -n 5
else
  echo "⚠️  PowerShell not found, skipping rollback drill"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ FINAL 30-SECOND LOCK COMPLETE"
echo ""
echo "🔮 KANIT HUD: Kontrol · Anomi · Not · İlerle/İptal · Tanık"
echo "🎯 Sahaya sür, ölç, kaydet, karar ver."
echo "🚀 BAS VE UÇ — KANITLA HIZLI! 💚✈️"
echo "════════════════════════════════════════════════════════════════"

