#!/usr/bin/env bash
set -euo pipefail
pushd "$(git rev-parse --show-toplevel)" >/dev/null
pnpm -w i --frozen-lockfile
pnpm -w --filter web-next build
echo "Standalone: apps/web-next/.next/standalone/ (node server.js)"

