#!/usr/bin/env bash
# Create Release Bundle (v1.8.0-rc1)
# Packages all artifacts with SHA256 checksums (Linux/macOS)

set -euo pipefail

VERSION="${1:-v1.8.0-rc1}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${CYAN}========================================"
echo -e "  RELEASE BUNDLE CREATOR"
echo -e "========================================${NC}"
echo ""
echo -e "${YELLOW}Version: $VERSION${NC}"
echo ""

# Create release directory
RELEASE_DIR="releases/$VERSION"
echo -e "${CYAN}[1/6] Creating release directory...${NC}"
mkdir -p "$RELEASE_DIR"

# Copy artifacts
echo -e "${CYAN}[2/6] Copying artifacts...${NC}"
for item in docs rules scripts grafana-ml-dashboard.json CHANGELOG.md GREEN_EVIDENCE_v1.8.md; do
    if [ -e "$item" ]; then
        cp -r "$item" "$RELEASE_DIR/"
        echo "   Copied: $item"
    fi
done

# Copy evidence (selective)
echo "   Copying evidence (selective)..."
mkdir -p "$RELEASE_DIR/evidence/ml"
cp evidence/ml/*.json "$RELEASE_DIR/evidence/ml/" 2>/dev/null || true
cp evidence/ml/*.txt "$RELEASE_DIR/evidence/ml/" 2>/dev/null || true

# Git commit hash
echo -e "${CYAN}[3/6] Recording git commit...${NC}"
git rev-parse HEAD 2>/dev/null > "$RELEASE_DIR/COMMIT.txt" || echo "unknown" > "$RELEASE_DIR/COMMIT.txt"
git log -1 --format="%H%n%an%n%ae%n%ai%n%s" 2>/dev/null > "$RELEASE_DIR/GIT_INFO.txt" || true

# Version manifest
echo -e "${CYAN}[4/6] Creating version manifest...${NC}"
cat > "$RELEASE_DIR/MANIFEST.json" << EOF
{
  "version": "$VERSION",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo unknown)",
  "platform": "Spark Trading Platform",
  "component": "ML Pipeline",
  "status": "observe-only",
  "promote_blocked": true,
  "promote_blocker": "PSI drift (1.25 > 0.2)",
  "gates": {
    "total": 6,
    "passed": 5,
    "failed": 1,
    "blocking": ["PSI"]
  },
  "evidence_files": $(find "$RELEASE_DIR/evidence" -type f | wc -l),
  "documentation_files": $(find "$RELEASE_DIR/docs" -type f | wc -l),
  "scripts": $(find "$RELEASE_DIR/scripts" -type f | wc -l)
}
EOF

# SHA256 checksums
echo -e "${CYAN}[5/6] Generating SHA256 checksums...${NC}"
cd "$RELEASE_DIR"
find . -type f -print0 | sort -z | xargs -0 shasum -a 256 > SHA256SUMS.txt
CHECKSUM_COUNT=$(wc -l < SHA256SUMS.txt)
echo "   Generated $CHECKSUM_COUNT checksums"
cd - > /dev/null

# Create archive
echo -e "${CYAN}[6/6] Creating release archive...${NC}"
ARCHIVE_PATH="releases/$VERSION.tar.gz"
tar -czf "$ARCHIVE_PATH" -C releases "$VERSION"
ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)
shasum -a 256 "$ARCHIVE_PATH" > "$ARCHIVE_PATH.sha256"
ARCHIVE_HASH=$(cut -d' ' -f1 "$ARCHIVE_PATH.sha256")

# Summary
echo ""
echo -e "${CYAN}========================================"
echo -e "  RELEASE BUNDLE COMPLETE"
echo -e "========================================${NC}"
echo ""
echo -e "${NC}Version:  $VERSION"
echo -e "Archive:  $ARCHIVE_PATH"
echo -e "Size:     $ARCHIVE_SIZE"
echo -e "Checksum: ${ARCHIVE_HASH:0:16}..."
echo ""
echo -e "${YELLOW}Contents:${NC}"
echo "  - Documentation: $(find "$RELEASE_DIR/docs" -type f | wc -l) files"
echo "  - Scripts: $(find "$RELEASE_DIR/scripts" -type f | wc -l) files"
echo "  - Rules: $(find "$RELEASE_DIR/rules" -type f | wc -l) files"
echo "  - Evidence: $(find "$RELEASE_DIR/evidence" -type f | wc -l) files"
echo ""
echo -e "${YELLOW}Files:${NC}"
echo "  $RELEASE_DIR/ (extracted)"
echo "  $ARCHIVE_PATH (archive)"
echo "  $ARCHIVE_PATH.sha256 (checksum)"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Verify: shasum -a 256 -c $ARCHIVE_PATH.sha256"
echo "  2. Archive: Upload to artifact store / S3"
echo "  3. Tag: git tag $VERSION -m 'ML Pipeline observe-only complete'"
echo ""
echo -e "${CYAN}========================================${NC}"
echo ""

