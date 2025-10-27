$ErrorActionPreference = "Stop"
Write-Host "=== UI-RESCUE-AND-COLLECT ==="
# 1) 3003/4001 portlarını boşalt
Get-NetTCPConnection -LocalPort 3003 -State Listen -ErrorAction SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force } 2>$null
Get-NetTCPConnection -LocalPort 4001 -State Listen -ErrorAction SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force } 2>$null
# 2) .next temizliği
if (Test-Path apps\web-next\.next) { rd /s /q apps\web-next\.next 2>$null }

function Wait-Up($u,$n=30){ for($i=0;$i -lt $n;$i++){ try{ Invoke-RestMethod -Method GET -Uri $u -TimeoutSec 2 | Out-Null; return $true } catch { Start-Sleep -s 1 } } return $false }
Write-Host "Hazırlık tamam. Şimdi ayrı terminallerde çalıştırın:"
Write-Host "  A) cd services\\executor ; pnpm dev"
Write-Host "  B) cd apps\\web-next   ; pnpm dev"
Write-Host "Ben de health’i izleyeceğim..."
if (Wait-Up "http://127.0.0.1:3003/api/public/health") {
  $r = Invoke-RestMethod http://127.0.0.1:3003/api/public/health
  Write-Host "WEB Health:" ($r | ConvertTo-Json -Depth 4)
} else {
  Write-Host "WEB Health gelmedi (3003). Lütfen apps\\web-next terminalinin çıktısını kontrol edin."
}
