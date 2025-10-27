#!/bin/bash
# GA Ship Archive & Tagging Script
# Usage: ./scripts/ga-archive.sh [NONCE] [VERSION]

set -e

NONCE=${1:-"20250827180000-a1b2c3"}
VERSION=${2:-"v1.5"}
SOURCE_DIR="evidence/receipts-smoke/$NONCE"
ARCHIVE_DIR="evidence/ga/$VERSION"
TARGET_DIR="$ARCHIVE_DIR/$NONCE"

echo "📦 GA Ship Archive & Tagging - Version: $VERSION"
echo "=============================================="
echo "NONCE: $NONCE"
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
echo ""

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Create archive directory structure
echo "📁 Creating archive directory structure..."
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$TARGET_DIR"

# Copy files to archive
echo "📋 Copying files to archive..."
rsync -av "$SOURCE_DIR/" "$TARGET_DIR/"

# Create latest symlink
echo "🔗 Creating latest symlink..."
ln -sfn "$TARGET_DIR" "$ARCHIVE_DIR/latest"

# Optional compression
echo "🗜️  Creating compressed archive..."
cd "$ARCHIVE_DIR"
tar -czf "${VERSION}-${NONCE}.tgz" "$NONCE"

# GPG signature for compressed archive
echo "🔐 Signing compressed archive..."
gpg --detach-sign --armor "${VERSION}-${NONCE}.tgz"

# SHA256 checksum
echo "📊 Generating SHA256 checksum..."
sha256sum "${VERSION}-${NONCE}.tgz" > "${VERSION}-${NONCE}.tgz.sha256"

# Verify archive integrity
echo "✅ Verifying archive integrity..."
if sha256sum -c "${VERSION}-${NONCE}.tgz.sha256"; then
    echo "✅ Archive integrity verified"
else
    echo "❌ Archive integrity check failed"
    exit 1
fi

# Create archive manifest
echo "📝 Creating archive manifest..."
cat > "$TARGET_DIR/archive-manifest.json" << EOF
{
  "version": "$VERSION",
  "nonce": "$NONCE",
  "archive_timestamp": "$(date -u -Iseconds)",
  "archive_files": {
    "compressed_archive": "${VERSION}-${NONCE}.tgz",
    "gpg_signature": "${VERSION}-${NONCE}.tgz.asc",
    "sha256_checksum": "${VERSION}-${NONCE}.tgz.sha256"
  },
  "archive_metadata": {
    "total_size": "$(du -sh "$TARGET_DIR" | awk '{print $1}')",
    "file_count": "$(find "$TARGET_DIR" -type f | wc -l)",
    "directory_count": "$(find "$TARGET_DIR" -type d | wc -l)"
  },
  "archive_chain": {
    "prev_manifest_sha256": "$(jq -r '.prev_manifest_sha256 // "null"' "$TARGET_DIR/sha256-manifest.json")",
    "current_manifest_sha256": "$(sha256sum "$TARGET_DIR/sha256-manifest.json" | awk '{print $1}')"
  }
}
EOF

# Create archive index
echo "📋 Updating archive index..."
cat > "$ARCHIVE_DIR/archive-index.json" << EOF
{
  "version": "$VERSION",
  "latest_nonce": "$NONCE",
  "latest_timestamp": "$(date -u -Iseconds)",
  "archives": [
    {
      "nonce": "$NONCE",
      "timestamp": "$(date -u -Iseconds)",
      "directory": "$TARGET_DIR",
      "compressed": "${VERSION}-${NONCE}.tgz",
      "manifest_sha256": "$(sha256sum "$TARGET_DIR/sha256-manifest.json" | awk '{print $1}')"
    }
  ],
  "archive_metadata": {
    "total_archives": 1,
    "total_size": "$(du -sh "$ARCHIVE_DIR" | awk '{print $1}')",
    "created_by": "$(whoami)",
    "hostname": "$(hostname)"
  }
}
EOF

echo ""
echo "📦 Archive Summary:"
echo "=================="
echo "Version: $VERSION"
echo "NONCE: $NONCE"
echo "Archive Directory: $TARGET_DIR"
echo "Latest Symlink: $ARCHIVE_DIR/latest"
echo "Compressed Archive: $ARCHIVE_DIR/${VERSION}-${NONCE}.tgz"
echo "GPG Signature: $ARCHIVE_DIR/${VERSION}-${NONCE}.tgz.asc"
echo "SHA256 Checksum: $ARCHIVE_DIR/${VERSION}-${NONCE}.tgz.sha256"
echo "Archive Manifest: $TARGET_DIR/archive-manifest.json"
echo "Archive Index: $ARCHIVE_DIR/archive-index.json"

echo ""
echo "🔍 Archive Verification:"
echo "======================="
echo "Archive size: $(du -sh "$TARGET_DIR" | awk '{print $1}')"
echo "File count: $(find "$TARGET_DIR" -type f | wc -l)"
echo "Directory count: $(find "$TARGET_DIR" -type d | wc -l)"
echo "Latest symlink: $(readlink "$ARCHIVE_DIR/latest")"

echo ""
echo "✅ Archive & Tagging completed successfully!"
echo "📁 Archive location: $TARGET_DIR"
echo "🔗 Latest symlink: $ARCHIVE_DIR/latest"
echo "🗜️  Compressed: $ARCHIVE_DIR/${VERSION}-${NONCE}.tgz" 