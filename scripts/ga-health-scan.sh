#!/bin/bash
# GA Ship Health Scan Script
# Usage: ./scripts/ga-health-scan.sh

set -euo pipefail

# Source fail-fast functions
source "$(dirname "$0")/ga-fail-fast.sh"

echo "🔍 GA Ship Health Scan - Potential Vulnerabilities"
echo "================================================="
echo ""

# 1) Saat senkronu kontrolü
echo "1️⃣ Checking time synchronization..."
echo "--------------------------------"

# Check NTP sync
if command -v timedatectl >/dev/null 2>&1; then
    NTP_STATUS=$(timedatectl status | grep "NTP synchronized" | awk '{print $3}')
    if [ "$NTP_STATUS" = "yes" ]; then
        echo "✅ NTP synchronized: yes"
    else
        echo "⚠️  NTP synchronized: no (potential NONCE collision risk)"
    fi
else
    echo "ℹ️  timedatectl not available (check NTP manually)"
fi

# Check system time drift
if command -v ntpq >/dev/null 2>&1; then
    TIME_OFFSET=$(ntpq -c "rv 0 offset" 2>/dev/null | awk '{print $3}' || echo "unknown")
    echo "ℹ️  Time offset: $TIME_OFFSET ms"
fi

# 2) CRLF/Windows satır sonları kontrolü
echo ""
echo "2️⃣ Checking line endings and file formats..."
echo "-------------------------------------------"

# Check git EOL configuration
GIT_EOL=$(git config core.autocrlf 2>/dev/null || echo "not set")
echo "ℹ️  Git autocrlf: $GIT_EOL"

# Check for CRLF in key files
CRLF_FILES=$(find scripts/ -name "*.sh" -exec file {} \; | grep "CRLF" | wc -l || echo "0")
if [ "$CRLF_FILES" -gt 0 ]; then
    echo "⚠️  Found $CRLF_FILES script files with CRLF line endings"
    find scripts/ -name "*.sh" -exec file {} \; | grep "CRLF" | head -3
else
    echo "✅ No CRLF line endings found in scripts"
fi

# Check manifest file format
MANIFEST_FILES=$(find evidence/ -name "*.json" -exec file {} \; | grep "CRLF" | wc -l || echo "0")
if [ "$MANIFEST_FILES" -gt 0 ]; then
    echo "⚠️  Found $MANIFEST_FILES JSON files with CRLF line endings"
else
    echo "✅ No CRLF line endings found in JSON files"
fi

# 3) Docker fallback kontrolü
echo ""
echo "3️⃣ Checking Docker fallback configuration..."
echo "------------------------------------------"

# Check if Docker is available
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker available"
    
    # Check Docker permissions
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker permissions OK"
        
        # Check network access
        if docker pull hello-world >/dev/null 2>&1; then
            echo "✅ Docker network access OK"
        else
            echo "⚠️  Docker network access failed (check firewall/proxy)"
        fi
    else
        echo "❌ Docker permissions failed (check user groups)"
    fi
else
    echo "ℹ️  Docker not available (fallback to local promtool)"
fi

# Check promtool availability
if command -v promtool >/dev/null 2>&1; then
    PROMTOOL_VERSION=$(promtool --version 2>&1 | head -1)
    echo "✅ Promtool available: $PROMTOOL_VERSION"
else
    echo "ℹ️  Promtool not available (will use Docker fallback)"
fi

# 4) Bağımlılıklar kontrolü
echo ""
echo "4️⃣ Checking dependencies..."
echo "---------------------------"

# Required tools
REQUIRED_TOOLS=("jq" "gpg" "sha256sum" "tar" "git" "find" "head" "tail" "grep" "awk")

for tool in "${REQUIRED_TOOLS[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "✅ $tool available"
    else
        echo "❌ $tool not found"
    fi
done

# Check specific versions if possible
if command -v jq >/dev/null 2>&1; then
    JQ_VERSION=$(jq --version 2>&1)
    echo "ℹ️  jq version: $JQ_VERSION"
fi

if command -v gpg >/dev/null 2>&1; then
    GPG_VERSION=$(gpg --version 2>&1 | head -1)
    echo "ℹ️  gpg version: $GPG_VERSION"
fi

# 5) Symlink/Traversal kontrolü
echo ""
echo "5️⃣ Checking symlink and path traversal security..."
echo "------------------------------------------------"

# Check for symlinks in evidence directory
SYMLINKS=$(find evidence/ -type l 2>/dev/null | wc -l || echo "0")
if [ "$SYMLINKS" -gt 0 ]; then
    echo "⚠️  Found $SYMLINKS symlinks in evidence directory"
    find evidence/ -type l 2>/dev/null | head -3
else
    echo "✅ No symlinks found in evidence directory"
fi

# Check for path traversal attempts in manifest paths
MANIFEST_PATHS=$(find evidence/ -name "sha256-manifest.json" -exec jq -r '.artifacts | to_entries[] | .value.path' {} \; 2>/dev/null || true)
TRAVERSAL_ATTEMPTS=$(echo "$MANIFEST_PATHS" | grep -E "\.\./|\.\.\\" | wc -l || echo "0")

if [ "$TRAVERSAL_ATTEMPTS" -gt 0 ]; then
    echo "⚠️  Found $TRAVERSAL_ATTEMPTS potential path traversal attempts"
    echo "$MANIFEST_PATHS" | grep -E "\.\./|\.\.\\" | head -3
else
    echo "✅ No path traversal attempts detected"
fi

# Check evidence/ prefix enforcement
EVIDENCE_PREFIX_VIOLATIONS=$(echo "$MANIFEST_PATHS" | grep -v "^evidence/" | wc -l || echo "0")
if [ "$EVIDENCE_PREFIX_VIOLATIONS" -gt 0 ]; then
    echo "⚠️  Found $EVIDENCE_PREFIX_VIOLATIONS paths outside evidence/ prefix"
    echo "$MANIFEST_PATHS" | grep -v "^evidence/" | head -3
else
    echo "✅ All manifest paths use evidence/ prefix"
fi

# 6) Dosya izinleri kontrolü
echo ""
echo "6️⃣ Checking file permissions..."
echo "------------------------------"

# Check script permissions
SCRIPT_PERMISSIONS=$(find scripts/ -name "*.sh" -exec ls -la {} \; 2>/dev/null | grep -v "^-rwx" | wc -l || echo "0")
if [ "$SCRIPT_PERMISSIONS" -gt 0 ]; then
    echo "⚠️  Found $SCRIPT_PERMISSIONS scripts without execute permissions"
else
    echo "✅ All scripts have proper execute permissions"
fi

# Check evidence directory permissions
EVIDENCE_PERMISSIONS=$(find evidence/ -type d -exec ls -ld {} \; 2>/dev/null | grep -v "^drwx" | wc -l || echo "0")
if [ "$EVIDENCE_PERMISSIONS" -gt 0 ]; then
    echo "⚠️  Found $EVIDENCE_PERMISSIONS directories with restrictive permissions"
else
    echo "✅ Evidence directories have proper permissions"
fi

# 7) Ağ erişimi kontrolü
echo ""
echo "7️⃣ Checking network access..."
echo "----------------------------"

# Check Prometheus access
PROMETHEUS_URL=${PROMETHEUS_URL:-"http://localhost:9090"}
if curl -s "$PROMETHEUS_URL/api/v1/query?query=up" >/dev/null 2>&1; then
    echo "✅ Prometheus accessible at $PROMETHEUS_URL"
else
    echo "⚠️  Prometheus not accessible at $PROMETHEUS_URL"
fi

# Check external dependencies
EXTERNAL_CHECKS=(
    "https://raw.githubusercontent.com/prometheus/prometheus/main/prometheus.yml"
    "https://golang.org/dl/"
)

for url in "${EXTERNAL_CHECKS[@]}"; do
    if curl -s --connect-timeout 5 "$url" >/dev/null 2>&1; then
        echo "✅ External access OK: $(echo "$url" | cut -d'/' -f3)"
    else
        echo "⚠️  External access failed: $(echo "$url" | cut -d'/' -f3)"
    fi
done

echo ""
echo "📋 Health Scan Summary:"
echo "======================"
echo "✅ Critical checks completed"
echo "⚠️  Review warnings above"
echo "🔧 Fix any issues before production deployment"
echo "📊 Monitor for environment changes" 