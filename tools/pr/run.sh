#!/bin/bash
# PR Review Request Tool - Wrapper Script
# 
# This script provides a convenient way to run the PR review request tool
# Usage: ./tools/pr/run.sh <pr-number> [dry-run]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse arguments
PR_NUMBER=${1:-}
DRY_RUN=${2:-false}

if [ -z "$PR_NUMBER" ]; then
    echo "Usage: $0 <pr-number> [dry-run]"
    echo ""
    echo "Examples:"
    echo "  $0 25              # Process PR #25"
    echo "  $0 25 true         # Dry-run for PR #25"
    echo ""
    exit 1
fi

# Check if config file exists for this PR
CONFIG_FILE="$SCRIPT_DIR/pr-${PR_NUMBER}-config.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "📄 Using configuration file: $CONFIG_FILE"
    
    # Update dryRun flag if requested
    if [ "$DRY_RUN" = "true" ]; then
        echo "⚠️  Enabling dry-run mode..."
        TMP_CONFIG=$(mktemp)
        jq '.dryRun = true' "$CONFIG_FILE" > "$TMP_CONFIG"
        npx tsx "$SCRIPT_DIR/request-review-and-prepare-merge.ts" "$TMP_CONFIG"
        rm "$TMP_CONFIG"
    else
        npx tsx "$SCRIPT_DIR/request-review-and-prepare-merge.ts" "$CONFIG_FILE"
    fi
else
    echo "⚠️  No configuration file found for PR #${PR_NUMBER}"
    echo "📝 Expected: $CONFIG_FILE"
    echo ""
    echo "You can create one based on the example:"
    echo "  cp $SCRIPT_DIR/pr-25-config.json $CONFIG_FILE"
    echo "  # Edit the file with your PR details"
    echo ""
    exit 1
fi
