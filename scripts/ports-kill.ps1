Param([int[]]$Ports=@(3003,4001))
$ErrorActionPreference="SilentlyContinue"
$procs=@()
foreach($p in $Ports){
  $own = Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  if($own){ $procs += $own }
}
$procs = $procs | Sort-Object -Unique
foreach($pid in $procs){ try{ Stop-Process -Id $pid -Force }catch{} }
Write-Host ("Killed PIDs: " + ($procs -join ", "))
