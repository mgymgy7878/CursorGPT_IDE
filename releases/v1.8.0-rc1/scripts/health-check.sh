#!/bin/bash

# Spark Platform Health Check Script
# Checks: Web (3003), Executor (4001), Streams (4001)

set -e

echo "[*] Spark Platform Health Check"
echo "================================"

# Web health check
echo "[*] probing web health (port 3003)..."
if curl -fsS "http://127.0.0.1:3003/api/public/healthz" | grep -q "ok"; then
    echo "✅ Web: OK"
else
    echo "❌ Web: FAILED"
    exit 1
fi

# Executor health check
echo "[*] probing executor health (port 4001)..."
if curl -fsS "http://127.0.0.1:4001/health" | grep -q "ok"; then
    echo "✅ Executor: OK"
else
    echo "❌ Executor: FAILED"
    exit 1
fi

# Streams health check
echo "[*] probing streams metrics (port 4001)..."
if curl -fsS "http://127.0.0.1:4001/metrics" | grep -E "ws_msgs_total|ingest_latency_ms_bucket" > /dev/null; then
    echo "✅ Streams: OK"
else
    echo "❌ Streams: FAILED"
    exit 1
fi

# Optimizer service health check
echo "[*] probing optimizer health (port 4001)..."
if curl -fsS "http://127.0.0.1:4001/optimizer/health" | grep -q "healthy"; then
    echo "✅ Optimizer: OK"
else
    echo "❌ Optimizer: FAILED"
    exit 1
fi

# Drift Gates service health check
echo "[*] probing drift gates status (port 4001)..."
if curl -fsS "http://127.0.0.1:4001/gates/status" | grep -q "gateState"; then
    echo "✅ Drift Gates: OK"
else
    echo "❌ Drift Gates: FAILED"
    exit 1
fi

echo ""
echo "🎉 All services healthy!"
