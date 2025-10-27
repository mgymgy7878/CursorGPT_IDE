#requires -Version 5.1
$ErrorActionPreference = "SilentlyContinue"
Get-Job | Where-Object { $_.Name -like "spark_*" } | Stop-Job -Force | Out-Null
Get-Job | Where-Object { $_.Name -like "spark_*" } | Remove-Job -Force | Out-Null
function Stop-ByPort($p){ Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try{ Stop-Process -Id $_ -Force }catch{} } }
Stop-ByPort 3005; Stop-ByPort 4001
"Stopped jobs and listeners on 3005/4001."
