set -euo pipefail
HDR=(-H "x-role: admin" -H "X-Actor: qa@local")
mkdir -p evidence/guardrails
{
  echo "## Pending"
  curl -s "http://127.0.0.1:4001/guardrails/params/pending" "${HDR[@]}"
  echo; echo "## Approve P1"
  curl -s "http://127.0.0.1:4001/guardrails/params/approve?id=P1" "${HDR[@]}"
  echo; echo "## Deny P2"
  curl -s "http://127.0.0.1:4001/guardrails/params/deny?id=P2" "${HDR[@]}"
  echo; echo "## Pending-After"
  curl -s "http://127.0.0.1:4001/guardrails/params/pending" "${HDR[@]}"
  echo; echo "## AuditTail"
  tail -n 10 evidence/guardrails/audit.jsonl || true
} > evidence/guardrails/smoke.txt