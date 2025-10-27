#!/bin/bash
# Tek Komutla Kanıt Toplama - Route Label "Bir Daha Asla" Evidence
# Bu script, canary test ve metrik sözleşmesini test edip evidence toplar

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EVIDENCE_DIR="evidence/metrics"
mkdir -p "$EVIDENCE_DIR"

echo "🔍 Route Label 'Bir Daha Asla' Evidence Collection"
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Evidence Directory: $EVIDENCE_DIR"
echo ""

# Executor'ı test modunda başlat
echo "📡 Executor başlatılıyor (evidence collection mode)..."
cd services/executor
METRICS_DISABLED=0 npm run build > /dev/null 2>&1
METRICS_DISABLED=0 node dist/index.cjs &
EXECUTOR_PID=$!

# Executor'ın başlamasını bekle
echo "⏳ Executor başlaması bekleniyor..."
sleep 5

# Health check
if ! curl -s http://localhost:4001/ops/health > /dev/null; then
    echo "❌ Executor başlamadı"
    kill $EXECUTOR_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Executor hazır, evidence toplanıyor..."

# 1. Canary Test Evidence
echo "🔍 Canary test evidence toplanıyor..."
CANARY_RESULT=$(curl -s -X POST http://localhost:4001/api/canary/run \
  -H "Content-Type: application/json" \
  -d '{"dry": true}')

echo "$CANARY_RESULT" > "../$EVIDENCE_DIR/canary_${TIMESTAMP}.json"

if echo "$CANARY_RESULT" | grep -q '"ok":true'; then
    echo "✅ Canary test: PASS"
    CANARY_STATUS="PASS"
else
    echo "❌ Canary test: FAIL"
    CANARY_STATUS="FAIL"
fi

# 2. Metrics Evidence
echo "📊 Metrics evidence toplanıyor..."
METRICS_OUTPUT=$(curl -s http://localhost:4001/metrics)
echo "$METRICS_OUTPUT" > "../$EVIDENCE_DIR/metrics_${TIMESTAMP}.txt"

# Metrics contract validation
echo "🔍 Metrics contract validation..."

# HTTP Metrikleri Kontrolü
HTTP_VIOLATIONS=$(echo "$METRICS_OUTPUT" | awk '/^http_request_duration_ms_(bucket|sum|count)/{print}' | grep -vE 'method=|route=|status=' || true)

# AI Metrikleri Kontrolü
AI_VIOLATIONS=$(echo "$METRICS_OUTPUT" | awk '/^spark_ai_(latency_ms|payload_bytes|tokens_total)/{print}' | grep -vE 'model=|status=' || true)

# Exchange Metrikleri Kontrolü
EXCHANGE_VIOLATIONS=$(echo "$METRICS_OUTPUT" | awk '/^spark_futures_uds_last_keepalive_ts/{print}' | grep -vE 'exchange=' || true)

CONTRACT_STATUS="PASS"
if [ -n "$HTTP_VIOLATIONS" ] || [ -n "$AI_VIOLATIONS" ] || [ -n "$EXCHANGE_VIOLATIONS" ]; then
    echo "❌ Metrics contract: FAIL"
    CONTRACT_STATUS="FAIL"
    
    echo "HTTP Violations:" > "../$EVIDENCE_DIR/violations_${TIMESTAMP}.txt"
    echo "$HTTP_VIOLATIONS" >> "../$EVIDENCE_DIR/violations_${TIMESTAMP}.txt"
    echo "AI Violations:" >> "../$EVIDENCE_DIR/violations_${TIMESTAMP}.txt"
    echo "$AI_VIOLATIONS" >> "../$EVIDENCE_DIR/violations_${TIMESTAMP}.txt"
    echo "Exchange Violations:" >> "../$EVIDENCE_DIR/violations_${TIMESTAMP}.txt"
    echo "$EXCHANGE_VIOLATIONS" >> "../$EVIDENCE_DIR/violations_${TIMESTAMP}.txt"
else
    echo "✅ Metrics contract: PASS"
fi

# 3. Summary Report
SUMMARY_FILE="../$EVIDENCE_DIR/summary_${TIMESTAMP}.txt"
{
    echo "Route Label 'Bir Daha Asla' Evidence Summary"
    echo "=============================================="
    echo "Timestamp: $TIMESTAMP"
    echo "Canary Test: $CANARY_STATUS"
    echo "Metrics Contract: $CONTRACT_STATUS"
    echo ""
    echo "Evidence Files:"
    echo "- canary_${TIMESTAMP}.json"
    echo "- metrics_${TIMESTAMP}.txt"
    if [ "$CONTRACT_STATUS" = "FAIL" ]; then
        echo "- violations_${TIMESTAMP}.txt"
    fi
    echo ""
    echo "Metrics Stats:"
    echo "- Total Lines: $(echo "$METRICS_OUTPUT" | wc -l)"
    echo "- File Size: $(echo "$METRICS_OUTPUT" | wc -c) bytes"
    echo ""
    echo "Contract Validation:"
    echo "- HTTP Metrics: $(echo "$METRICS_OUTPUT" | grep -c 'http_request_duration_ms' || echo 0) lines"
    echo "- AI Metrics: $(echo "$METRICS_OUTPUT" | grep -c 'spark_ai_' || echo 0) lines"
    echo "- Exchange Metrics: $(echo "$METRICS_OUTPUT" | grep -c 'spark_futures_' || echo 0) lines"
    echo ""
    if [ "$CANARY_STATUS" = "PASS" ] && [ "$CONTRACT_STATUS" = "PASS" ]; then
        echo "🎉 OVERALL STATUS: PASS - Route label hatası 'bir daha asla' kutusunda!"
    else
        echo "❌ OVERALL STATUS: FAIL - Sorunlar tespit edildi"
    fi
} > "$SUMMARY_FILE"

# Temizlik
echo "🧹 Temizlik yapılıyor..."
kill $EXECUTOR_PID 2>/dev/null || true

# Sonuç
echo ""
echo "📋 Evidence Collection Tamamlandı"
echo "📁 Evidence Directory: $EVIDENCE_DIR"
echo "📄 Summary: $SUMMARY_FILE"
echo ""

if [ "$CANARY_STATUS" = "PASS" ] && [ "$CONTRACT_STATUS" = "PASS" ]; then
    echo "🎉 BAŞARILI: Route label hatası 'bir daha asla' kutusunda!"
    echo "✅ Canary: PASS"
    echo "✅ Metrics Contract: PASS"
    exit 0
else
    echo "❌ BAŞARISIZ: Sorunlar tespit edildi"
    echo "❌ Canary: $CANARY_STATUS"
    echo "❌ Metrics Contract: $CONTRACT_STATUS"
    exit 1
fi
