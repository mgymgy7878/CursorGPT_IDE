#!/usr/bin/env bash
set -euo pipefail

DUPS=(
  "components/components"
  "contexts/contexts"
  "docs/docs"
  "lib/lib"
  "__tests__/__tests__"
  "apps/web-next/apps/web-next"
)

echo "== DRY RUN =="
for p in "${DUPS[@]}"; do
  if [ -d "$p" ]; then
    echo "[FOUND] $p"
    echo "  Files: $(find "$p" -type f | wc -l)"
    echo "  Imports referencing?"
    grep -R "$p" -n || true
  else
    echo "[MISS]  $p"
  fi
done

echo "== GREP imports =="
echo "components/components|contexts/contexts|docs/docs|lib/lib|__tests__/__tests__|apps/web-next/apps/web-next" \
| xargs -I{} bash -c 'grep -R "{}" -n || true'

echo "== SUGGESTED ACTIONS =="
echo "1) Move/merge duplicated content to parent folders."
echo "2) Adjust imports; run typecheck/build/e2e."
echo "3) git rm duplicated dirs (IN A NEW BRANCH)." 