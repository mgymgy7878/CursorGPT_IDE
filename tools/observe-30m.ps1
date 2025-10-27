Param(
  [string]$WebBase = "http://127.0.0.1:4001",
  [string]$ExecBase = "http://127.0.0.1:4001",
  [string]$OutDir = "evidence\\local\\ai_generate",
  [int]$Minutes = 30
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$out = Join-Path $OutDir "30m_metrics.jsonl"
if (Test-Path $out) { Remove-Item $out -Force }

for ($i = 0; $i -lt $Minutes; $i++) {
  $ts = (Get-Date).ToString("o")
  try {
    $lines = & tools/metrics-read.ps1 -WebBase $WebBase -ExecBase $ExecBase | ForEach-Object { $_.ToString() }
  } catch {
    $lines = @("__ERROR__ metrics-read failed: $($_.Exception.Message)")
  }
  $obj = @{ ts = $ts; metrics = $lines }
  ($obj | ConvertTo-Json -Compress) | Add-Content -Encoding UTF8 $out
  Start-Sleep -Seconds 60
}

Write-Host "[OK] Wrote metrics timeline → $out" -ForegroundColor Green


