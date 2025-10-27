param(
  [string]$WebBase = "http://127.0.0.1:4001",
  [string]$Token   = "dev-xyz",
  [int]   $N       = 20
)

$ErrorActionPreference = "Stop"
$ps = "$PSHOME\powershell.exe"
if (-not (Test-Path $ps)) { $ps = "powershell" }

function Run-Step([string]$file, [string[]]$args) {
  $argList = @("-NoProfile","-ExecutionPolicy","Bypass","-File", (Join-Path $PSScriptRoot $file)) + $args
  $proc = Start-Process -FilePath $ps -ArgumentList $argList -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { throw "Step failed: $file (exit $($proc.ExitCode))" }
}

Write-Host "=== METRICS ==="
Run-Step "metrics-read.ps1" @("-WebBase",$WebBase,"-ExecBase","http://127.0.0.1:4001")

Write-Host "=== P95 ==="
Run-Step "p95.ps1" @("-N",$N,"-Token",$Token,"-WebBase",$WebBase)

Write-Host "=== HEALTH ==="
Run-Step "health-path.ps1" @()
