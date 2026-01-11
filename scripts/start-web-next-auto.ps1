# Spark Trading Platform - Web-Next Otomatik Başlatma Scripti
# Bu script Windows başlangıcında development server'ı otomatik başlatır

param(
    [int]$Port = 3003,
    [switch]$WaitForPort = $false
)

$ErrorActionPreference = "Stop"

# Proje kök dizinini bul
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $scriptPath ".."
$projectRoot = Resolve-Path $projectRoot

# Log dosyası
$logDir = Join-Path $projectRoot "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = Join-Path $logDir "web-next-auto-start-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logMessage
    if ($Level -eq "ERROR") {
        Write-Host $logMessage -ForegroundColor Red
    } elseif ($Level -eq "WARN") {
        Write-Host $logMessage -ForegroundColor Yellow
    } else {
        Write-Host $logMessage -ForegroundColor Green
    }
}

Write-Log "=== Spark Trading Platform - Web-Next Otomatik Başlatma ==="
Write-Log "Proje Dizini: $projectRoot"
Write-Log "Port: $Port"

# Portable Node kontrolü (memory'den: SPARK_NODE_BIN)
$nodeBin = $env:SPARK_NODE_BIN
if (-not $nodeBin -or -not (Test-Path $nodeBin)) {
    $portableNode = Join-Path $projectRoot "tools\node-v20.10.0-win-x64\node.exe"
    if (Test-Path $portableNode) {
        $nodeBin = $portableNode
        $env:SPARK_NODE_BIN = $nodeBin
        Write-Log "Portable Node bulundu: $nodeBin"
    } else {
        Write-Log "Portable Node bulunamadı, sistem Node kullanılacak" "WARN"
        $nodeBin = "node"
    }
} else {
    Write-Log "SPARK_NODE_BIN kullanılıyor: $nodeBin"
}

# Port kontrolü - eğer port kullanılıyorsa öldür
Write-Log "Port $Port kontrol ediliyor..."
$existingProcess = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingProcess) {
    $pid = $existingProcess.OwningProcess
    Write-Log "Port $Port kullanılıyor (PID: $pid), işlem sonlandırılıyor..." "WARN"
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# .next cache temizleme (opsiyonel - sadece sorun varsa)
$nextDir = Join-Path $projectRoot "apps\web-next\.next"
if (Test-Path $nextDir) {
    $cacheAge = (Get-Item $nextDir).LastWriteTime
    $daysOld = (New-TimeSpan -Start $cacheAge -End (Get-Date)).Days
    if ($daysOld -gt 7) {
        Write-Log ".next cache temizleniyor (7+ gün eski)..." "WARN"
        Remove-Item -Recurse -Force $nextDir -ErrorAction SilentlyContinue
    }
}

# pnpm kontrolü
Write-Log "pnpm kontrol ediliyor..."
try {
    $pnpmVersion = pnpm --version 2>&1
    Write-Log "pnpm versiyonu: $pnpmVersion"
} catch {
    Write-Log "pnpm bulunamadı! Lütfen pnpm'i yükleyin." "ERROR"
    exit 1
}

# Proje dizinine geç
Set-Location $projectRoot

# Environment variables
$env:WATCHPACK_POLLING = "true"
$env:WATCHPACK_POLLING_INTERVAL = "2000"
$env:NEXT_WEBPACK_USEPERSISTENTCACHE = "true"
$env:CHOKIDAR_USEPOLLING = "1"
$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Log "Environment variables ayarlandı"

# Development server'ı başlat
Write-Log "Development server başlatılıyor..."
Write-Log "Komut: pnpm -w --filter web-next dev -- --port $Port"

# pnpm komutunu arka planda başlat
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "pnpm"
$processInfo.Arguments = "-w --filter web-next dev -- --port $Port"
$processInfo.WorkingDirectory = $projectRoot
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.CreateNoWindow = $false

# Output'u log dosyasına yönlendir
$stdoutFile = Join-Path $logDir "web-next-stdout.log"
$stderrFile = Join-Path $logDir "web-next-stderr.log"
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo

# Output handler
$stdoutHandler = {
    $line = $_.Data
    if ($line) {
        Add-Content -Path $stdoutFile -Value $line
        Write-Log "STDOUT: $line"
    }
}
$stderrHandler = {
    $line = $_.Data
    if ($line) {
        Add-Content -Path $stderrFile -Value $line
        Write-Log "STDERR: $line" "WARN"
    }
}

$process.add_OutputDataReceived($stdoutHandler)
$process.add_ErrorDataReceived($stderrHandler)

try {
    $process.Start() | Out-Null
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()

    Write-Log "Process başlatıldı (PID: $($process.Id))"

    # Port'un açılmasını bekle (opsiyonel)
    if ($WaitForPort) {
        Write-Log "Port $Port'un açılması bekleniyor..."
        $maxWait = 60 # 60 saniye
        $waited = 0
        while ($waited -lt $maxWait) {
            $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            if ($connection) {
                Write-Log "Port $Port açıldı! Server hazır."
                break
            }
            Start-Sleep -Seconds 2
            $waited += 2
        }
        if ($waited -ge $maxWait) {
            Write-Log "Port $Port açılmadı (timeout)" "WARN"
        }
    }

    Write-Log "Server başlatıldı. URL: http://127.0.0.1:$Port"
    Write-Log "Log dosyası: $logFile"
    Write-Log "Process ID: $($process.Id)"

    # Process'i bekle (sonsuz döngü)
    $process.WaitForExit()

} catch {
    Write-Log "Hata: $_" "ERROR"
    exit 1
}

