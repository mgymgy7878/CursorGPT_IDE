#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")"/.. && pwd)/CursorGPT_IDE"
for f in "$root/.dev/web-next.pid" "$root/.dev/executor.pid"; do
  if [[ -f "$f" ]]; then
    kill -9 "$(head -n1 "$f")" 2>/dev/null || true
    rm -f "$f"
  fi
done
echo "[OK] dev processes stopped"
