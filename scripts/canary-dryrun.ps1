Param([string]$Symbol="BTCTRY",[int]$TestDuration=45)
$ErrorActionPreference="Stop"
$EXEC="http://127.0.0.1:4001"
$body=@{ symbol=$Symbol; durationSec=$TestDuration; dryRun=$true }|ConvertTo-Json
try{
  $res=Invoke-RestMethod -Uri "$EXEC/canary/run" -Method Post -ContentType "application/json" -Body $body
  [pscustomobject]@{ ok=$true; res=$res } | ConvertTo-Json -Depth 8
}catch{
  [pscustomobject]@{ ok=$false; error="$($_.Exception.Message)" } | ConvertTo-Json -Depth 8
}