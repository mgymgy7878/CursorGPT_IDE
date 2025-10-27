# Screenshot Capture Script (opsiyonel)
# Chrome/Chromium ile headless screenshot

param(
    [string]$BaseUrl = "http://127.0.0.1:3003",
    [string]$OutputDir = "evidence/ui-reconstruction-$(Get-Date -Format 'yyyyMMdd')/screenshots"
)

Write-Host "[LOG] Screenshot capture başlatılıyor..." -ForegroundColor Green
Write-Host "[LOG] Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "[LOG] Output: $OutputDir`n" -ForegroundColor Cyan

# Output klasörü oluştur
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Chrome/Chromium binary bul
$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Chromium\Application\chrome.exe",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)

$chromeBinary = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromeBinary = $path
        break
    }
}

if (-not $chromeBinary) {
    Write-Host "[ERROR] Chrome/Chromium bulunamadı" -ForegroundColor Red
    Write-Host "[HINT] Chrome veya Chromium yükleyin" -ForegroundColor Yellow
    exit 1
}

Write-Host "[LOG] Chrome binary: $chromeBinary`n" -ForegroundColor Green

# Sayfalar
$pages = @(
    @{ path = "/"; name = "home" },
    @{ path = "/portfolio"; name = "portfolio" },
    @{ path = "/strategies"; name = "strategies" },
    @{ path = "/running"; name = "running" },
    @{ path = "/settings"; name = "settings" }
)

# Her sayfa için screenshot
foreach ($page in $pages) {
    $url = "$BaseUrl$($page.path)"
    $outputFile = Join-Path $OutputDir "$($page.name).png"
    
    Write-Host "[CAPTURE] $($page.name) ($url)..." -NoNewline
    
    try {
        & $chromeBinary --headless=new --disable-gpu --virtual-time-budget=5000 --window-size=1920,1080 --screenshot="$outputFile" "$url" 2>&1 | Out-Null
        
        if (Test-Path $outputFile) {
            $size = (Get-Item $outputFile).Length / 1KB
            Write-Host " ✅ $([math]::Round($size, 2)) KB" -ForegroundColor Green
        } else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
        }
    } catch {
        Write-Host " ❌ ERROR: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Screenshot capture tamamlandı: $OutputDir" -ForegroundColor Green

