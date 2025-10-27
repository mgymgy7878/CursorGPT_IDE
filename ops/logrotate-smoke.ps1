#requires -Version 5.1
$ErrorActionPreference = "SilentlyContinue"
$log = Join-Path $PSScriptRoot '..\logs\smoke-all.log'
if (-not (Test-Path $log)) { return }
$maxBytes = 50MB
$fi = Get-Item $log
if ($fi.Length -lt $maxBytes) { return }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$archive = Join-Path $fi.DirectoryName ("smoke-all_" + $stamp + ".log")
Move-Item -Force $log $archive
"" | Out-File -Encoding ascii $log
Write-Output ("rotated to " + $archive)

