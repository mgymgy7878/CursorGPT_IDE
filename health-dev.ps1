$ErrorActionPreference="SilentlyContinue"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$evidence = ".\evidence\devlogs\health_$ts.txt"

"=== Spark DEV Health $ts ===" | Tee-Object -File $evidence
"--- PORTS ---" | Tee-Object -File $evidence -Append
netstat -ano | findstr ":3003" | Tee-Object -File $evidence -Append
netstat -ano | findstr ":4001" | Tee-Object -File $evidence -Append

"--- CURL ---" | Tee-Object -File $evidence -Append
try { curl http://127.0.0.1:4001/health | Tee-Object -File $evidence -Append } catch {}
try { curl http://127.0.0.1:3003/api/public/healthz | Tee-Object -File $evidence -Append } catch {}
try { curl "http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY" | Tee-Object -File $evidence -Append } catch {}

"--- TAIL LOGS (last 30) ---" | Tee-Object -File $evidence -Append
Get-Content .\evidence\devlogs\executor.log -Tail 30 | Tee-Object -File $evidence -Append
Get-Content .\evidence\devlogs\web-next.log -Tail 30 | Tee-Object -File $evidence -Append

Write-Host "Health evidence: $evidence"
