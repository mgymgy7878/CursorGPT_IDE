# PowerShell Runner - pwsh varsa pwsh, yoksa powershell kullanır
# Bu script "iki dünyayı barıştırır": PS7 standardı + PS5.1 fallback
# Argüman geçirimi: ScriptArgs birebir forward edilir

param(
  [Parameter(Mandatory=$true)]
  [string]$ScriptPath,

  [Parameter(ValueFromRemainingArguments=$true)]
  [string[]]$ScriptArgs
)

# PS5.1 encoding "emoji kırılması" için güvenli mod
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $OutputEncoding = [Console]::OutputEncoding
} catch {
  # PS5.1'de bazı durumlarda başarısız olabilir, sessizce devam et
}

# pwsh PATH'te var mı?
$pwshPath = Get-Command pwsh -ErrorAction SilentlyContinue

if ($pwshPath) {
  Write-Host "[PS7] Using pwsh (PowerShell 7+)" -ForegroundColor Green
  # Argümanları birebir forward et (-NoProfile, -ExecutionPolicy Bypass zaten var)
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @ScriptArgs
  $exitCode = $LASTEXITCODE
  if ($exitCode -eq $null) { $exitCode = 0 }
  exit $exitCode
} else {
  Write-Host "[PS5.1] Using powershell (fallback)" -ForegroundColor Yellow
  Write-Host "  Note: PowerShell 7+ (pwsh) recommended for checksum consistency" -ForegroundColor Gray
  Write-Host "  Install: winget install --id Microsoft.PowerShell" -ForegroundColor Gray
  # Argümanları birebir forward et
  & powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @ScriptArgs
  $exitCode = $LASTEXITCODE
  if ($exitCode -eq $null) { $exitCode = 0 }
  exit $exitCode
}
