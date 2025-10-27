#!/usr/bin/env bash
set -euo pipefail

# Spark — Doctor v2
# Bu dosya CI ve lokal sağlık denetimleri için kullanılır

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

OUT="${OUT:-/tmp/spark_audit}"
mkdir -p "$OUT"
REPORT="$OUT/audit_report.md"
: > "$REPORT"

p() { echo "$@" | tee -a "$REPORT"; }

p "# Spark — Tam Sağlık Denetimi (Doctor v2)"
p "Tarih: $(date -Iseconds)"
p ""

# --- Versiyonlar
p "## Araç Sürümleri"
{ node -v && pnpm -v && git --version; } 2>&1 | tee -a "$REPORT"
p ""

# --- Workspace
p "## PNPM Workspace"
test -f pnpm-workspace.yaml && p "pnpm-workspace.yaml bulundu ✓" || p "pnpm-workspace.yaml yok ✗"
grep -q "apps" pnpm-workspace.yaml && p "apps/* kapsama ✓" || p "apps/* eksik ✗"
grep -q "packages" pnpm-workspace.yaml && p "packages/* kapsama ✓" || p "packages/* eksik ✗"
p ""

# --- Lock/Integrity
p "## Lock/Integrity"
test -f pnpm-lock.yaml && p "pnpm-lock.yaml mevcut ✓" || p "pnpm-lock.yaml eksik ✗"
p ""

# --- ENV (varlık kontrolü)
p "## ENV Değişkenleri (varlık)"
REQ_ENV=(JWT_SECRET DEV_TOKEN INGEST_KEY)
for K in "${REQ_ENV[@]}"; do
  if grep -q "^$K=" apps/web-next/.env.local 2>/dev/null || printenv "$K" >/dev/null 2>&1; then
    p " - $K: OK"
  else
    p " - $K: MISSING"
  fi
done
p ""

# --- Router envanteri/çakışma
p "## Router Envanteri/Çakışma"
if [[ -x scripts/routes_inventory.sh ]]; then
  scripts/routes_inventory.sh > "$OUT/routes.txt" 2>&1 || true
  if grep -q "CONFLICT" "$OUT/routes.txt"; then
    p "Çakışma bulundu ✗"
    sed 's/^/    /' "$OUT/routes.txt" | tee -a "$REPORT"
  else
    p "Çakışma yok ✓"
  fi
else
  p "scripts/routes_inventory.sh bulunamadı (atlandı)"
fi
p ""

# --- Middleware (SSE matcher dışı mı?)
p "## Middleware / SSE Matcher"
if grep -q "/api/logs/sse" apps/web-next/middleware.ts 2>/dev/null; then
  grep -q "matcher" apps/web-next/middleware.ts && p "/api/logs/sse matcher dışı ✓" || p "matcher yapılandırması gözden geçirilmeli ✗"
else
  p "middleware.ts'te /api/logs/sse izi bulunamadı ✗"
fi
p ""

# --- Prometheus endpoint + kritik metrikler
p "## Prometheus Sanity + Kritik Metrikler"
URL="http://127.0.0.1:3003/api/public/metrics/prom"
METRICS="$(curl -fsS "$URL" 2>/dev/null || true)"
if [[ -n "$METRICS" ]]; then
  p "Metrics endpoint erişilebilir ✓"
else
  p "Metrics endpoint erişilemiyor ✗ ($URL)"
fi
CRIT=(spark_canary_ramp_level spark_canary_cooloff_active spark_precision_registry_hits_total spark_risk_var_pct spark_trade_pf)
miss=0
for M in "${CRIT[@]}"; do
  echo "$METRICS" | grep -q "$M" && p " - $M: OK" || { p " - $M: MISSING"; miss=$((miss+1)); }
done
p ""

# --- Ledger (SQLite)
p "## Ledger (SQLite)"
LEDGER="${LEDGER_SQLITE_PATH:-services/state/ledger.sqlite}"
if [[ -f "$LEDGER" ]]; then
  p "Ledger bulundu: $LEDGER ($(du -h "$LEDGER" | awk '{print $1}'))"
else
  p "Ledger yok/konum farklı: $LEDGER"
fi
p ""

# --- Prom rules
p "## Prometheus Kuralları"
if command -v promtool >/dev/null 2>&1; then
  if promtool check rules ops/prometheus/alerts.yml >/dev/null 2>&1; then
    p "promtool check rules: OK"
  else
    p "promtool check rules: HATA ✗"
  fi
else
  p "promtool bulunamadı (CI gate kontrolü yerelde atlandı)"
fi
p ""

# --- Playwright cfg var mı?
p "## Playwright"
test -f apps/web-next/tests/playwright.config.ts && p "Playwright config bulundu ✓" || p "Playwright config yok ✗"
p ""

# --- Raporları depoya kopyala (lokal/CI ortak)
mkdir -p docs/audit
cp -f "$REPORT" docs/audit/audit_report.md || true
if [[ -f "$OUT/routes.txt" ]]; then
  cp -f "$OUT/routes.txt" docs/audit/routes.txt || true
fi

# --- Sonuç
p "## Sonuç"
if [[ "$miss" -gt 0 ]]; then
  p "**Durum:** SARı (kritik metriklerden $miss eksik görünüyor). Rapor: $REPORT"
  exit 2
else
  p "**Durum:** YEŞiL. Rapor: $REPORT"
fi 