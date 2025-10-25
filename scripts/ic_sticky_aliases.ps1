function Show-ICGo { @"
I am IC.
Karar penceresi: 5 dk
8/8 proceed | 1-2 hold | ≥3 rollback
Kanıt: #war-room-spark
"@ }
function Show-Abort { @"
p95>400ms OR 5xx>3% OR ws>120s
Korelasyon tetikleyicileri
Rollback: release:rollback <tag>
Kanıt: metrics+logs
"@ }
Set-Alias icgo Show-ICGo
Set-Alias abort Show-Abort
Write-Output "PowerShell alias'lar: icgo / abort"

