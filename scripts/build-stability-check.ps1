# SPARK TRADING PLATFORM - BUILD STABILITY CHECK
# TypeScript, linting ve build süreçlerini kontrol eder

param(
    [switch]$Fix,
    [switch]$Verbose
)

Write-Host "🔍 Build Stability Check Başlatılıyor..." -ForegroundColor Green

# Renkler
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

# 1. Environment Check
Write-Host "`n📋 Environment Check..." -ForegroundColor $Yellow

$issues = @()

# Node.js kontrolü
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    $issues += "❌ Node.js kurulu değil"
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor $Green
}

# pnpm kontrolü
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    $issues += "❌ pnpm kurulu değil"
} else {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm: $pnpmVersion" -ForegroundColor $Green
}

# TypeScript kontrolü
if (!(Get-Command tsc -ErrorAction SilentlyContinue)) {
    $issues += "❌ TypeScript global kurulu değil"
} else {
    $tscVersion = tsc --version
    Write-Host "✅ TypeScript: $tscVersion" -ForegroundColor $Green
}

# 2. Dependencies Check
Write-Host "`n📦 Dependencies Check..." -ForegroundColor $Yellow

if (Test-Path "package.json") {
    Write-Host "✅ package.json mevcut" -ForegroundColor $Green
} else {
    $issues += "❌ package.json bulunamadı"
}

if (Test-Path "pnpm-lock.yaml") {
    Write-Host "✅ pnpm-lock.yaml mevcut" -ForegroundColor $Green
} else {
    $issues += "❌ pnpm-lock.yaml bulunamadı"
}

# 3. TypeScript Configuration Check
Write-Host "`n🔧 TypeScript Configuration Check..." -ForegroundColor $Yellow

$tsConfigFiles = @(
    "tsconfig.json",
    "tsconfig.base.json",
    "apps/web-next/tsconfig.json",
    "services/executor/tsconfig.json"
)

foreach ($config in $tsConfigFiles) {
    if (Test-Path $config) {
        Write-Host "✅ $config mevcut" -ForegroundColor $Green
    } else {
        $issues += "❌ $config bulunamadı"
    }
}

# 4. Build Scripts Check
Write-Host "`n🔨 Build Scripts Check..." -ForegroundColor $Yellow

$packageJson = Get-Content "package.json" | ConvertFrom-Json
$requiredScripts = @("build", "typecheck", "lint", "dev")

foreach ($script in $requiredScripts) {
    if ($packageJson.scripts.$script) {
        Write-Host "✅ Script '$script' mevcut" -ForegroundColor $Green
    } else {
        $issues += "❌ Script '$script' bulunamadı"
    }
}

# 5. Workspace Structure Check
Write-Host "`n📁 Workspace Structure Check..." -ForegroundColor $Yellow

$requiredDirs = @(
    "apps/web-next",
    "services/executor",
    "packages",
    "scripts"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir mevcut" -ForegroundColor $Green
    } else {
        $issues += "❌ $dir bulunamadı"
    }
}

# 6. Build Test (eğer araçlar mevcutsa)
if ($issues.Count -eq 0) {
    Write-Host "`n🧪 Build Test..." -ForegroundColor $Yellow
    
    try {
        Write-Host "📦 Dependencies yükleniyor..." -ForegroundColor $Cyan
        pnpm -w install --frozen-lockfile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencies yüklendi" -ForegroundColor $Green
        } else {
            $issues += "❌ Dependencies yüklenemedi"
        }
    } catch {
        $issues += "❌ pnpm install başarısız"
    }
    
    # TypeScript check
    try {
        Write-Host "🔍 TypeScript check..." -ForegroundColor $Cyan
        pnpm -w run typecheck
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ TypeScript check başarılı" -ForegroundColor $Green
        } else {
            $issues += "❌ TypeScript check başarısız"
        }
    } catch {
        $issues += "❌ TypeScript check çalıştırılamadı"
    }
}

# 7. Issues Summary
Write-Host "`n📊 Issues Summary:" -ForegroundColor $Yellow

if ($issues.Count -eq 0) {
    Write-Host "🎉 Tüm kontroller başarılı!" -ForegroundColor $Green
} else {
    Write-Host "⚠️  $($issues.Count) sorun tespit edildi:" -ForegroundColor $Red
    foreach ($issue in $issues) {
        Write-Host "   $issue" -ForegroundColor $Red
    }
}

# 8. Recommendations
Write-Host "`n💡 Recommendations:" -ForegroundColor $Cyan

if ($issues -contains "❌ Node.js kurulu değil") {
    Write-Host "   • Node.js 18+ yükleyin: https://nodejs.org/" -ForegroundColor White
}

if ($issues -contains "❌ pnpm kurulu değil") {
    Write-Host "   • pnpm yükleyin: npm install -g pnpm" -ForegroundColor White
}

if ($issues -contains "❌ TypeScript global kurulu değil") {
    Write-Host "   • TypeScript yükleyin: npm install -g typescript" -ForegroundColor White
}

Write-Host "`n🔧 Build Stability Check Tamamlandı!" -ForegroundColor $Green
