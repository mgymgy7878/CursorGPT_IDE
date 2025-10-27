$ErrorActionPreference = "SilentlyContinue"
Get-NetTCPConnection -LocalPort 3003 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 4001 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

$ErrorActionPreference = "SilentlyContinue"
Get-NetTCPConnection -LocalPort 3003 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 4001 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
