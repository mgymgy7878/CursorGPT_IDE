#!/bin/bash
# quick-filters.sh - jq hızlı filtreler

set -euo pipefail

URL="${API_URL:-http://localhost:3003}"

show_help() {
  cat << EOF
🔍 QUICK FILTERS - jq Hızlı Sorgular

Kullanım: bash scripts/quick-filters.sh [KOMUT]

Komutlar:
  errors      Son 5 dakika hataları
  bucket      Confidence bucket dağılımı
  confid      Median confidence (son 100)
  top-errors  Top 3 error türleri
  kardinalite ml.score kardinalite (son 100)
  help        Bu yardım mesajı

Örnekler:
  bash scripts/quick-filters.sh errors
  bash scripts/quick-filters.sh bucket
  API_URL=https://prod.spark.com bash scripts/quick-filters.sh confid
EOF
}

errors() {
  echo "🔴 Son 5 Dakika Hataları"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  curl -s "$URL/api/tools/get_metrics?window=5m" 2>/dev/null | \
    jq '.errors | {rate:.rate, last:.last}' || \
    echo '{"rate":0,"last":null}'
}

bucket() {
  echo "📊 Confidence Bucket Dağılımı"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  curl -s "$URL/api/audit/list" \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"limit":500}' 2>/dev/null | \
    jq -r '[.items[]|select(.action=="ml.score")|.context.ml_bucket]|group_by(.)|map({bucket:.[0],count:length})|.[]|"\(.bucket): \(.count)"' || \
    echo "No data"
}

confid() {
  echo "🎯 Median Confidence (Son 100)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  local median=$(curl -s "$URL/api/audit/list" \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"limit":100}' 2>/dev/null | \
    jq '[.items[]|select(.action=="ml.score")|.context.confid|tonumber]|sort|.[length/2]' 2>/dev/null || echo "0")
  
  echo "Median: $median"
  
  if (( $(echo "$median < 0.40" | bc -l 2>/dev/null || echo 0) )); then
    echo "🔴 CRITICAL: <0.40"
  elif (( $(echo "$median < 0.55" | bc -l 2>/dev/null || echo 0) )); then
    echo "🟡 WARNING: <0.55"
  else
    echo "🟢 OK: ≥0.55"
  fi
}

top_errors() {
  echo "🚨 Top 3 Error Türleri"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  curl -s "$URL/api/audit/list" \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"limit":200}' 2>/dev/null | \
    jq -r '[.items[]|select(._err)]|group_by(._err)|map({err:.[0]._err,count:length})|sort_by(.count)|reverse|.[0:3]|.[]|"\(.count)x \(.err)"' || \
    echo "No errors"
}

kardinalite() {
  echo "📈 ML Score Kardinalite (Son 100)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  local count=$(curl -s "$URL/api/audit/list" \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"limit":100}' 2>/dev/null | \
    jq '[.items[]|select(.action=="ml.score")]|length' 2>/dev/null || echo "0")
  
  echo "Count: $count / 100"
  
  if (( count < 10 )); then
    echo "🔴 CRITICAL: <10/dk"
  elif (( count < 50 )); then
    echo "🟡 WARNING: <50"
  else
    echo "🟢 OK: ≥50"
  fi
}

# Main
case "${1:-help}" in
  errors)
    errors
    ;;
  bucket)
    bucket
    ;;
  confid)
    confid
    ;;
  top-errors)
    top_errors
    ;;
  kardinalite)
    kardinalite
    ;;
  help|*)
    show_help
    ;;
esac

