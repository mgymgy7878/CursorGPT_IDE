# Tek-Sefer Kilidi ve Run-ID Sistemi
param(
    [string]$Name="smoke-mini",
    [int]$TtlSec=900
)

$LOCK = "tmp\locks\$Name.lock"
New-Item -ItemType Directory -Force -Path (Split-Path $LOCK) | Out-Null

# Kilidi kontrol et
if (Test-Path $LOCK) {
    $ts = Get-Content $LOCK | ForEach-Object { [long]$_ }
    $age = [DateTimeOffset]::Now.ToUnixTimeSeconds() - $ts
    if ($age -lt $TtlSec) { 
        Write-Host "SKIP:$Name (alive ${age}s)" -ForegroundColor Yellow
        exit 0 
    }
}

# Yeni kilidi oluştur
[DateTimeOffset]::Now.ToUnixTimeSeconds() | Set-Content -Path $LOCK -Encoding ascii
$env:RUN_ID = "$Name-" + [guid]::NewGuid().ToString("N").Substring(0,8)

Write-Host "LOCK:$Name RUN_ID:$env:RUN_ID" -ForegroundColor Green

# Smoke testini çağır
try {
    & ".\tools\smoke-mini.ps1"
    $exitCode = $LASTEXITCODE
} finally {
    # Kilidi bırak
    Remove-Item $LOCK -ErrorAction SilentlyContinue
    Write-Host "UNLOCK:$Name" -ForegroundColor Cyan
}

exit $exitCode
