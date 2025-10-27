#!/usr/bin/env bash
set -euo pipefail
export EXECUTOR_BASE_URL="${EXECUTOR_BASE_URL:-http://127.0.0.1:4001}"

# quick ping to proxy targets
curl -sf "$EXECUTOR_BASE_URL/params/pending" >/dev/null

echo "ui-guardrails-smoke: PASS"
