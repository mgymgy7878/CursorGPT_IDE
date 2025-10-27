$ErrorActionPreference = 'SilentlyContinue'
$p = Get-NetTCPConnection -LocalPort 3004 -State Listen -ErrorAction SilentlyContinue |
     Select-Object -ExpandProperty OwningProcess -Unique
foreach($pid in $p){ try{ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch{} }
Start-Sleep 8
Get-NetTCPConnection -LocalPort 3004 -State Listen -ErrorAction SilentlyContinue


