#!/bin/bash
# monitor-live.sh - Real-time SLO monitoring for go-live

set -euo pipefail

API_URL="${API_URL:-http://localhost:3003}"
ALERT_LOG="${ALERT_LOG:-./alerts.log}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Thresholds
P95_WARNING=1000
P95_CRITICAL=1500
STALENESS_WARNING=30
STALENESS_CRITICAL=60
ERROR_RATE_WARNING=1.0
ERROR_RATE_CRITICAL=2.0
ML_SCORE_MIN_RATE=10

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$ALERT_LOG"
}

alert() {
  local level=$1
  shift
  case $level in
    red)
      echo -e "${RED}🚨 RED ALERT:${NC} $*" | tee -a "$ALERT_LOG"
      ;;
    yellow)
      echo -e "${YELLOW}⚠️  YELLOW WARNING:${NC} $*" | tee -a "$ALERT_LOG"
      ;;
    green)
      echo -e "${GREEN}✅ ALL CLEAR:${NC} $*"
      ;;
    blue)
      echo -e "${BLUE}ℹ️  INFO:${NC} $*"
      ;;
  esac
}

get_metrics() {
  curl -s "${API_URL}/api/tools/get_metrics" 2>/dev/null || echo '{}'
}

get_ml_score_count() {
  local response=$(curl -s "${API_URL}/api/audit/list" \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"limit":100}' 2>/dev/null || echo '{"items":[]}')
  
  echo "$response" | jq '[.items[]|select(.action=="ml.score")]|length' 2>/dev/null || echo "0"
}

get_confid_median() {
  local response=$(curl -s "${API_URL}/api/audit/list" \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"limit":100}' 2>/dev/null || echo '{"items":[]}')
  
  echo "$response" | jq '[.items[]|select(.action=="ml.score")|.context.confid|tonumber]|sort|.[length/2]' 2>/dev/null || echo "0"
}

check_slo() {
  local metrics=$(get_metrics)
  
  # Extract values
  local p95=$(echo "$metrics" | jq -r '.p95_ms // 0')
  local staleness=$(echo "$metrics" | jq -r '.staleness_s // 0')
  local error_rate=$(echo "$metrics" | jq -r '.error_rate // 0')
  
  alert blue "Current metrics: p95=${p95}ms, staleness=${staleness}s, error_rate=${error_rate}%"
  
  # Check p95
  if (( $(echo "$p95 > $P95_CRITICAL" | bc -l) )); then
    alert red "p95=${p95}ms > ${P95_CRITICAL}ms (CRITICAL)"
    return 1
  elif (( $(echo "$p95 > $P95_WARNING" | bc -l) )); then
    alert yellow "p95=${p95}ms > ${P95_WARNING}ms (WARNING)"
  fi
  
  # Check staleness
  if (( $(echo "$staleness > $STALENESS_CRITICAL" | bc -l) )); then
    alert red "staleness=${staleness}s > ${STALENESS_CRITICAL}s (CRITICAL)"
    return 1
  elif (( $(echo "$staleness > $STALENESS_WARNING" | bc -l) )); then
    alert yellow "staleness=${staleness}s > ${STALENESS_WARNING}s (WARNING)"
  fi
  
  # Check error rate
  if (( $(echo "$error_rate > $ERROR_RATE_CRITICAL" | bc -l) )); then
    alert red "error_rate=${error_rate}% > ${ERROR_RATE_CRITICAL}% (CRITICAL)"
    return 1
  elif (( $(echo "$error_rate > $ERROR_RATE_WARNING" | bc -l) )); then
    alert yellow "error_rate=${error_rate}% > ${ERROR_RATE_WARNING}% (WARNING)"
  fi
  
  # Check ML score rate
  local ml_count=$(get_ml_score_count)
  if (( ml_count < ML_SCORE_MIN_RATE )); then
    alert yellow "ml.score rate=${ml_count}/min < ${ML_SCORE_MIN_RATE}/min (WARNING)"
  fi
  
  # Check confidence
  local confid=$(get_confid_median)
  if (( $(echo "$confid < 0.45" | bc -l) )); then
    alert yellow "median confid=${confid} < 0.45 (WARNING)"
  fi
  
  alert green "All SLOs within acceptable range"
  return 0
}

main() {
  log "🚀 Starting live monitoring (interval: ${CHECK_INTERVAL}s)"
  log "API URL: $API_URL"
  log "Thresholds: p95=${P95_CRITICAL}ms, staleness=${STALENESS_CRITICAL}s, error_rate=${ERROR_RATE_CRITICAL}%"
  
  while true; do
    if ! check_slo; then
      log "⚠️ SLO violation detected - consider rollback"
    fi
    
    sleep "$CHECK_INTERVAL"
  done
}

# Handle Ctrl+C gracefully
trap 'log "Monitoring stopped"; exit 0' INT TERM

main

