param(
  [string]$HostUrl = 'https://downloads.sparktrading.example.com',
  [string]$Channel = 'beta'
)
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

$root     = 'C:\dev\CursorGPT_IDE'
$dist     = Join-Path $root 'apps\desktop-electron\dist'
$evidence = Join-Path $root 'evidence'
$latest   = Join-Path $dist 'latest.yml'
$latestUrl= "$HostUrl/desktop/$Channel/latest.yml"

if (!(Test-Path -Path $evidence)) { New-Item -ItemType Directory -Path $evidence | Out-Null }

Write-Host '[1/3] Locate EXE & latest.yml'
$exe = $null
try { $exe = Get-ChildItem $dist -Filter '*.exe' | Sort-Object LastWriteTime -Desc | Select-Object -First 1 -ExpandProperty FullName } catch {}
if (!(Test-Path -Path $latest -PathType Leaf)) {
  Write-Host "- latest.yml missing -> downloading from $latestUrl"
  try { Invoke-WebRequest -UseBasicParsing -Uri $latestUrl -OutFile $latest -TimeoutSec 20 } catch { Write-Host '- latest.yml download failed' }
}

Write-Host '[2/3] SHA512 verify'
if ($exe -and (Test-Path -Path $latest -PathType Leaf)) {
  try {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'apps\desktop-electron\scripts\verify_latest_sha512.ps1') -Exe $exe -LatestYml $latest |
      Out-File -Encoding utf8 (Join-Path $evidence 'sha_check.txt')
  } catch { 'VERIFY_FAILED' | Out-File -Encoding utf8 (Join-Path $evidence 'sha_check.txt') }
} else {
  "MISSING: exe=$([bool](Test-Path -Path $exe)) latest=$([bool](Test-Path -Path $latest))" |
    Out-File -Encoding utf8 (Join-Path $evidence 'sha_check.txt')
}

# Optional: Authenticode signature verification (if signtool available)
try {
  $verifySig = Join-Path $root 'apps\desktop-electron\scripts\verify_signature.ps1'
  if (Test-Path -Path $verifySig -PathType Leaf -and $exe) {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File $verifySig -Exe $exe |
      Out-File -Encoding utf8 (Join-Path $evidence 'authenticode.txt')
  }
} catch {
  'SIGNATURE_CHECK_FAILED' | Out-File -Encoding utf8 (Join-Path $evidence 'authenticode.txt')
}

Write-Host '[3/3] AU(beta) smoke + NGINX preflight'
$env:SPARK_UPDATE_CHANNEL = $Channel
if ($exe) { try { Start-Process -FilePath $exe } catch {} }
Start-Sleep -Seconds 12
$log = Join-Path $env:LOCALAPPDATA ("Spark\logs\app-" + (Get-Date -Format 'yyyyMMdd') + '.log')
if (Test-Path -Path $log) {
  try { Get-Content $log -Tail 400 | Out-File -Encoding utf8 (Join-Path $evidence 'au_smoke_tail.txt') } catch { 'LOG_READ_FAILED' | Out-File -Encoding utf8 (Join-Path $evidence 'au_smoke_tail.txt') }
} else {
  'LOG_NOT_FOUND' | Out-File -Encoding utf8 (Join-Path $evidence 'au_smoke_tail.txt')
}

try {
  $resp = Invoke-WebRequest -UseBasicParsing -Method Head -Uri $latestUrl -TimeoutSec 15
  $resp.Headers.GetEnumerator() | ForEach-Object { "$($_.Name): $($_.Value -join ', ')" } |
    Out-File -Encoding utf8 (Join-Path $evidence 'au_latest_yml_headers.txt')
} catch { 'HEAD_FAILED' | Out-File -Encoding utf8 (Join-Path $evidence 'au_latest_yml_headers.txt') }

# Minimal console summary
$exeStr = if ($exe) { $exe } else { 'NOT_FOUND' }
Write-Host ('EXE: ' + $exeStr)
Write-Host ('latest.yml: ' + ([bool](Test-Path -Path $latest)))
$shaFirst = (Get-Content (Join-Path $evidence 'sha_check.txt') -ErrorAction SilentlyContinue -TotalCount 1)
if (-not $shaFirst) { $shaFirst = 'N/A' }
Write-Host ('sha_check: ' + $shaFirst)
Write-Host ('au_log_written: ' + ([bool](Test-Path -Path (Join-Path $evidence 'au_smoke_tail.txt'))))
Write-Host ('headers_written: ' + ([bool](Test-Path -Path (Join-Path $evidence 'au_latest_yml_headers.txt'))))
