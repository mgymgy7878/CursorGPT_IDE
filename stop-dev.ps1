Get-Job -Name spark-exec,spark-web -ErrorAction SilentlyContinue | Stop-Job -Force
Get-Job -Name spark-exec,spark-web -ErrorAction SilentlyContinue | Remove-Job
$ports=@(3003,4001)
foreach ($p in $ports) {
  $pids = (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess -Unique)
  foreach ($pid in $pids) { try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} }
}
Write-Host "Stopped jobs and cleared ports 3003/4001."
