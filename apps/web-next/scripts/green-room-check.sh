#!/bin/bash
# green-room-check.sh - T-15 son saniye kontrol

set -euo pipefail

URL="${API_URL:-http://localhost:3003}"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🎭 GREEN-ROOM MIKRO KONTROL (T-15)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1) Sürüm & sağlık
echo ""
echo "1️⃣  Sürüm & Sağlık"
curl -s "$URL/api/healthz" -i | sed -n '1p;/X-Build-SHA/p;/Strict-Transport-Security/p'

# 2) Kamu uçları (executor off olsa bile 200)
echo ""
echo "2️⃣  Kamu Uçları (Graceful Degradation)"
for e in alert/last metrics smoke-last; do
  echo "== $e =="
  curl -s "$URL/api/public/$e" | jq '._mock // .status // .ok'
done

# 3) ML fail-closed (NaN guard)
echo ""
echo "3️⃣  ML Fail-Closed (NaN Guard)"
curl -s "$URL/api/ml/score" \
  -H 'content-type: application/json' \
  -d '{"feature":{"ts":1,"symbol":"X","tf":"1h","o":null,"h":1,"l":1,"c":1,"v":1}}' \
  | jq '{decision,advisory,_err}'

# 4) UI policy check (manual reminder)
echo ""
echo "4️⃣  UI Policy (Manuel Kontrol)"
echo "   → DevTools: body{overflow:hidden}, main{overflow-y:auto}"
echo "   → Console: Hydration warnings yok"
echo "   → Page load: Kırmızı toast yok"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ GREEN-ROOM KONTROL TAMAMLANDI${NC}"
echo "🎭 Sahneye çıkmaya hazırsın!"

