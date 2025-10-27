$ErrorActionPreference="Stop"
$H=@{"x-role"="admin";"X-Actor"="qa@local"}
mkdir evidence\guardrails -Force | Out-Null

"## Pending" | Out-File evidence\guardrails\smoke.txt
Invoke-RestMethod http://127.0.0.1:4001/guardrails/params/pending -Headers $H >> evidence\guardrails\smoke.txt

Invoke-RestMethod "http://127.0.0.1:4001/guardrails/params/approve?id=P1" -Headers $H | Out-Null
Invoke-RestMethod "http://127.0.0.1:4001/guardrails/params/deny?id=P2"    -Headers $H | Out-Null

"`n## Pending-After" | Add-Content evidence\guardrails\smoke.txt
Invoke-RestMethod http://127.0.0.1:4001/guardrails/params/pending -Headers $H >> evidence\guardrails\smoke.txt

"`n## AuditTail" | Add-Content evidence\guardrails\smoke.txt
Get-Content evidence\guardrails\audit.jsonl -Tail 10 | Add-Content evidence\guardrails\smoke.txt