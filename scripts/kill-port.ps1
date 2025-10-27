param([int]$Port=3003)
function Kill-Port([int]$Port=3003){
  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if(-not $conns){ Write-Host "Port $Port boş"; return }
  $pids = $conns | Select -Expand OwningProcess -Unique
  foreach($processId in $pids){ try{ Stop-Process -Id $processId -Force; Write-Host "Öldürüldü PID $processId" } catch { Write-Warning $_ } }
}
Kill-Port -Port $Port 