$ErrorActionPreference = "Stop"
function Ping($u){ try { (Invoke-RestMethod -Uri $u -TimeoutSec 5) | ConvertTo-Json -Depth 6 } catch { "ERR: $($_.Exception.Message)" } }
Write-Host "Next Health:" (Ping "http://127.0.0.1:3003/api/public/health")
try { $s=(Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3003/ops").StatusCode; Write-Host "Ops page:" $s } catch { Write-Host "Ops page: ERR" }
