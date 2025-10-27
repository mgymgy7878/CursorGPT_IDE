#!/usr/bin/env bash
# routes_inventory.sh — pages vs app envanter ve çakışma çıkarıcı
set -euo pipefail
cd "$(dirname "$0")/.."  # scripts -> repo kökü varsayımı
cd apps/web-next

echo "== INVENTORY: pages =="
find pages -type f \( -name "*.tsx" -o -name "*.ts" \) | sed 's#^pages##' | sort > /tmp/pages_routes.txt
cat /tmp/pages_routes.txt | nl

echo "== INVENTORY: app =="
find app -type f \( -name "page.tsx" -o -name "route.ts" \) -o -name "layout.tsx" | sed 's#^app##' | sort > /tmp/app_routes.txt
cat /tmp/app_routes.txt | nl

echo "== NORMALIZED PATH MAPPING =="
awk '{p=$0; gsub(/index\.tsx$/,"",p); gsub(/\.tsx$|\.ts$/,"",p); print p}' /tmp/pages_routes.txt | sort > /tmp/pages_norm.txt
awk '{p=$0; gsub(/\/page\.tsx$/,"",p); gsub(/\/route\.ts$/,"",p); print p}' /tmp/app_routes.txt | sort > /tmp/app_norm.txt

echo "== CONFLICTS (same normalized path) =="
comm -12 /tmp/pages_norm.txt /tmp/app_norm.txt > /tmp/conflicts.txt || true
nl -ba /tmp/conflicts.txt || true

echo "== UNIQUE (pages-only) =="
comm -23 /tmp/pages_norm.txt /tmp/app_norm.txt | nl -ba || true

echo "== UNIQUE (app-only) =="
comm -13 /tmp/pages_norm.txt /tmp/app_norm.txt | nl -ba || true

echo "== OUTPUTS =="
printf " - /tmp/pages_routes.txt\n - /tmp/app_routes.txt\n - /tmp/pages_norm.txt\n - /tmp/app_norm.txt\n - /tmp/conflicts.txt\n" 