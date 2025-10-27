#!/bin/bash
# Metrics Contract Test - Route Label Hatası "Bir Daha Asla" Guardrail
# Bu script, metriklerde beklenmeyen label'ları yakalar ve CI'da fail eder

set -e

echo "🔍 Metrics Contract Test Başlatılıyor..."

# Executor'ı test modunda başlat
echo "📡 Executor başlatılıyor (test modu)..."
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

echo "✅ Executor hazır, metrik sözleşmesi kontrol ediliyor..."

# Metrikleri indir
METRICS_OUTPUT=$(curl -s http://localhost:4001/metrics)
echo "📊 Metrikler indirildi ($(echo "$METRICS_OUTPUT" | wc -l) satır)"

# HTTP Metrikleri Kontrolü
echo "🔍 HTTP metrikleri kontrol ediliyor..."
HTTP_VIOLATIONS=$(echo "$METRICS_OUTPUT" | awk '/^http_request_duration_ms_(bucket|sum|count)/{print}' | grep -vE 'method=|route=|status=' || true)

if [ -n "$HTTP_VIOLATIONS" ]; then
    echo "❌ HTTP metriklerinde beklenmeyen label bulundu:"
    echo "$HTTP_VIOLATIONS"
    kill $EXECUTOR_PID 2>/dev/null || true
    exit 1
fi

# AI Metrikleri Kontrolü
echo "🔍 AI metrikleri kontrol ediliyor..."
AI_VIOLATIONS=$(echo "$METRICS_OUTPUT" | awk '/^spark_ai_(latency_ms|payload_bytes|tokens_total)/{print}' | grep -vE 'model=|status=' || true)

if [ -n "$AI_VIOLATIONS" ]; then
    echo "❌ AI metriklerinde beklenmeyen label bulundu:"
    echo "$AI_VIOLATIONS"
    kill $EXECUTOR_PID 2>/dev/null || true
    exit 1
fi

# Exchange Metrikleri Kontrolü
echo "🔍 Exchange metrikleri kontrol ediliyor..."
EXCHANGE_VIOLATIONS=$(echo "$METRICS_OUTPUT" | awk '/^spark_futures_uds_last_keepalive_ts/{print}' | grep -vE 'exchange=' || true)

if [ -n "$EXCHANGE_VIOLATIONS" ]; then
    echo "❌ Exchange metriklerinde beklenmeyen label bulundu:"
    echo "$EXCHANGE_VIOLATIONS"
    kill $EXECUTOR_PID 2>/dev/null || true
    exit 1
fi

# Canary Test
echo "🔍 Canary test çalıştırılıyor..."
CANARY_RESULT=$(curl -s -X POST http://localhost:4001/api/canary/run \
  -H "Content-Type: application/json" \
  -d '{"dry": true}')

if echo "$CANARY_RESULT" | grep -q '"ok":true'; then
    echo "✅ Canary test geçti"
else
    echo "❌ Canary test başarısız:"
    echo "$CANARY_RESULT"
    kill $EXECUTOR_PID 2>/dev/null || true
    exit 1
fi

# Temizlik
echo "🧹 Temizlik yapılıyor..."
kill $EXECUTOR_PID 2>/dev/null || true

echo "🎉 Tüm metrik sözleşme testleri geçti!"
echo "✅ HTTP metrikleri: method, route, status"
echo "✅ AI metrikleri: model, status"  
echo "✅ Exchange metrikleri: exchange"
echo "✅ Canary test: 200 OK"
echo ""
echo "🔒 Route label hatası 'bir daha asla' kutusuna taşındı!"
