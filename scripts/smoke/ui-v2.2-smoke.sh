#!/usr/bin/env bash
set -euo pipefail
OUT="docs/evidence/dev/v2.2-ui"
mkdir -p "$OUT"

# Confirm (gate OFF)
curl -s -X POST http://127.0.0.1:4001/api/futures/order \
 -H "Content-Type: application/json" \
 -d '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":0.001}' \
 | tee "$OUT/smoke_confirm_gate.txt" >/dev/null || true

# UDS lifecycle
CREATE=$(curl -s -X POST http://127.0.0.1:4001/api/futures/userDataStream || echo "{}")
echo "CREATE: $CREATE" > "$OUT/uds_lifecycle.txt"
echo "$CREATE" > /tmp/uds.json
curl -s -X PUT http://127.0.0.1:4001/api/futures/userDataStream \
 -H "Content-Type: application/json" -d @/tmp/uds.json \
 | sed 's/^/KEEPALIVE: /' >> "$OUT/uds_lifecycle.txt" || true
curl -s -X DELETE http://127.0.0.1:4001/api/futures/userDataStream \
 -H "Content-Type: application/json" -d @/tmp/uds.json \
 | sed 's/^/CLOSE: /' >> "$OUT/uds_lifecycle.txt" || true

# Snapshots
curl -s http://127.0.0.1:4001/api/futures/positions > "$OUT/positions_snapshot.json" || echo '{}' > "$OUT/positions_snapshot.json"

# Metrics (proxy 3003 → executor)
curl -s http://127.0.0.1:3003/api/public/metrics > "$OUT/metrics_dump.prom" || echo '' > "$OUT/metrics_dump.prom"

# Alerts rules (repo kopyası)
cp services/executor/config/alerts.rules "$OUT/alerts.rules" 2>/dev/null || true

echo "[OK] Evidence written to $OUT"


