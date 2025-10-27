$port = 4001
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcp) {
  $pids = $tcp | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
  foreach ($pid in $pids) { 
    try { 
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      Write-Output "Killed PID $pid on :$port" 
    } catch {} 
  }
} else { 
  Write-Output "Port $port free" 
}
