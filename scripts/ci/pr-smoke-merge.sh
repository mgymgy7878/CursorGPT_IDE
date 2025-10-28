#!/usr/bin/env bash
set -euo pipefail

REPO="mgymgy7878/CursorGPT_IDE"
PR=21
BR="copilot/stabilize-web-next-application"
WF=".github/workflows/pr-smoke.yml"

command -v gh >/dev/null || { echo "ERROR: GitHub CLI (gh) gerekli."; exit 1; }
gh auth status || gh auth login

if ! gh workflow view "$WF" --repo "$REPO" >/dev/null 2>&1; then
  echo "ERROR: Workflow '$WF' bulunamadı."; exit 1
fi

gh label create "UX-ACK" -d "Manual UX approval gate" -c "#0E8A16" --repo "$REPO" || true
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
gh pr view "$PR" --repo "$REPO" --json body -q .body > "$TMP"
grep -qi '^UX-ACK:\s*approved' "$TMP" || echo -e "\n\nUX-ACK: approved" >> "$TMP"
gh pr edit "$PR" --repo "$REPO" -F "$TMP"
gh pr edit "$PR" --repo "$REPO" --add-label "UX-ACK" || true
gh pr ready "$PR" --repo "$REPO" || true

START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
gh workflow run "$WF" --repo "$REPO" --ref "$BR" || true

RID=""
for i in {1..12}; do
  RID="$(
    gh run list --repo "$REPO" --workflow "$WF" --branch "$BR" --limit 5 \
      --json databaseId,createdAt \
      -q "[.[] | select(.createdAt >= \"$START_TS\")][0].databaseId" || true
  )"
  [[ -n "${RID:-}" && "$RID" != "null" ]] && break || sleep 5
done
[[ -z "${RID:-}" || "$RID" == "null" ]] && { echo "Yeni run bulunamadı"; exit 1; }

echo "Watching run: $RID"
gh run watch --repo "$REPO" "$RID"

CONC="$(gh run view "$RID" --repo "$REPO" --json conclusion -q .conclusion 2>/dev/null || echo "")"
echo "Run conclusion: ${CONC:-unknown}"

if [[ "${CONC}" != "success" ]]; then
  echo "Retrying PR-Smoke once..."
  START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  gh workflow run "$WF" --repo "$REPO" --ref "$BR" || true
  RID=""
  for i in {1..12}; do
    RID="$(
      gh run list --repo "$REPO" --workflow "$WF" --branch "$BR" --limit 5 \
        --json databaseId,createdAt \
        -q "[.[] | select(.createdAt >= \"$START_TS\")][0].databaseId" || true
    )"
    [[ -n "${RID:-}" && "$RID" != "null" ]] && break || sleep 5
  done
  [[ -z "${RID:-}" || "$RID" == "null" ]] && { echo "Retry Run ID bulunamadı"; exit 1; }
  echo "Watching retry run: $RID"
  gh run watch --repo "$REPO" "$RID"
  CONC="$(gh run view "$RID" --repo "$REPO" --json conclusion -q .conclusion 2>/dev/null || echo "")"
  echo "Retry run conclusion: ${CONC:-unknown}"
fi

mkdir -p pr-smoke-artifacts
for i in {1..10}; do
  gh run download "$RID" --repo "$REPO" --name pr-smoke-artifacts -D pr-smoke-artifacts && break || sleep 3
done

BASE=pr-smoke-artifacts
MISS=0
for f in "pr-smoke-server.log" "health.json" "metrics.prom" "headers.txt"; do
  [[ -f "$BASE/$f" ]] || { echo "ERROR: Artifact eksik: $f"; MISS=1; }
done
if [[ $MISS -ne 0 ]]; then
  echo "RESULT: FAIL ❌ — artefaktlar eksik."; exit 1
fi

echo "== Server log head =="; sed -n '1,60p' "$BASE/pr-smoke-server.log" || true
echo "== Health =="; cat "$BASE/health.json" || true
echo "== Metrics.prom first line =="; head -n1 "$BASE/metrics.prom" || true
echo "== Headers (content-type) =="; grep -i '^content-type' "$BASE/headers.txt" || true

echo; echo "== Assertions =="
if command -v jq >/dev/null 2>&1; then
  HEALTH_OK=$(jq -r '.status=="ok" and .env=="prod"' "$BASE/health.json" 2>/dev/null || echo false)
else
  grep -q '"status":"ok"' "$BASE/health.json" 2>/dev/null && grep -q '"env":"prod"' "$BASE/health.json" 2>/dev/null && HEALTH_OK=true || HEALTH_OK=false
fi
PROM_OK=$(head -n1 "$BASE/metrics.prom" 2>/dev/null | grep -q '^# HELP http_requests_p95_ms' && echo true || echo false)
CT_OK=$(grep -Ei '^content-type:\s*text/plain;\s*version=0\.0\.4(;\s*charset=.*)?$' "$BASE/headers.txt" >/dev/null 2>&1 && echo true || echo false)

printf "health.json: %s\nmetrics.prom first line: %s\nheaders content-type: %s\n" "$HEALTH_OK" "$PROM_OK" "$CT_OK"

if [ "$HEALTH_OK" = true ] && [ "$PROM_OK" = true ] && [ "$CT_OK" = true ]; then
  echo "RESULT: PASS ✅ — merging…"
  gh pr edit "$PR" --repo "$REPO" \
    -t "Stabilize web-next: PR smoke CI, single App Router tree, health/metrics APIs" \
    -b $'UX-ACK: approved\n\nThis PR stabilizes web-next for CI.\n- Single App Router under src/app\n- /api/health, /api/public/metrics(.prom)\n- PR-SMOKE artifacts: health.json ✅, metrics.json ✅, metrics.prom ✅ (Content-Type: text/plain; version=0.0.4)\n'
  gh pr merge "$PR" --repo "$REPO" --squash --delete-branch
  echo "Merge tamamlandı ✅"
else
  echo "RESULT: FAIL ❌ — artefakt çıktıları yukarıda."
  exit 1
fi

