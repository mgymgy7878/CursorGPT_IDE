#requires -Version 5.1
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$EXEC_API_TOKEN = $env:EXEC_API_TOKEN; if(-not $EXEC_API_TOKEN){ $EXEC_API_TOKEN = 'dev-xyz' }
$EXECUTOR_ORIGIN = $env:EXECUTOR_ORIGIN; if(-not $EXECUTOR_ORIGIN){ $EXECUTOR_ORIGIN = 'http://127.0.0.1:4001' }

function Stop-ByPort($p){ Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try{ Stop-Process -Id $_ -Force }catch{} } }
Stop-ByPort 3005; Stop-ByPort 4001

New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null
pnpm run clean:api | Out-Null

# Executor background job
Start-Job -Name spark_executor -ScriptBlock {
  param($root,$token)
  Set-Location $root
  $env:EXEC_API_TOKEN = $token
  pnpm -F executor run build
  pnpm -F executor run dev
} -ArgumentList $root, $EXEC_API_TOKEN | Out-Null

# Web background job
Start-Job -Name spark_web -ScriptBlock {
  param($root,$origin,$token)
  Set-Location $root
  $env:EXECUTOR_ORIGIN = $origin
  $env:EXEC_API_TOKEN  = $token
  pnpm -F web-next dev -p 3005 -- --hostname 127.0.0.1
} -ArgumentList $root, $EXECUTOR_ORIGIN, $EXEC_API_TOKEN | Out-Null

Start-Sleep 3
"JOBS:"
Get-Job | Select-Object Id,Name,State
"PORTS:"
Get-NetTCPConnection -State Listen | Where-Object LocalPort -in 3005,4001 | Select-Object LocalAddress,LocalPort,OwningProcess
