# Usage: pwsh scripts/dev-stop.ps1
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$root = Join-Path $root "CursorGPT_IDE"
$pidFiles = @("$root\.dev\web-next.pid", "$root\.dev\executor.pid")

foreach ($f in $pidFiles) {
  if (Test-Path $f) {
    $pid = Get-Content $f | Select-Object -First 1
    if ($pid) {
      Write-Host "[*] stopping PID $pid"
      try { Stop-Process -Id $pid -Force -ErrorAction Stop } catch {}
    }
    Remove-Item $f -ErrorAction SilentlyContinue
  }
}
Write-Host "[OK] dev processes stopped"