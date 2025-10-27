# UI Reconstruction Master Script
# Tüm adımları sırasıyla çalıştırır (evidence → PR → canary)

param(
    [switch]$SkipScreenshots,
    [switch]$SkipPR,
    [switch]$SkipCanary,
    [string]$PRNumber = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "UI RECONSTRUCTION — MASTER SCRIPT" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Host "[LOG] Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "[LOG] Workspace: $(Get-Location)`n" -ForegroundColor Cyan

# Step 1: Evidence Toplama
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 1/4 — Evidence Toplama" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    & pwsh scripts/collect-evidence.ps1
    Write-Host "`n✅ Evidence toplama başarılı`n" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Evidence toplama başarısız: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Screenshots (opsiyonel)
if (-not $SkipScreenshots) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "STEP 2/4 — Screenshot Capture (opsiyonel)" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    try {
        & pwsh scripts/take-screenshots.ps1
        Write-Host "`n✅ Screenshot capture başarılı`n" -ForegroundColor Green
    } catch {
        Write-Host "`n⚠️ Screenshot capture başarısız (atlanıyor): $_`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] Screenshot capture atlandı`n" -ForegroundColor Gray
}

# Step 3: PR Oluşturma
if (-not $SkipPR) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "STEP 3/4 — PR Oluşturma" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    try {
        & pwsh scripts/create-ui-pr.ps1
        Write-Host "`n✅ PR oluşturma başarılı`n" -ForegroundColor Green
        
        Write-Host "[INFO] CI checks tamamlanana kadar bekleyin..." -ForegroundColor Yellow
        Write-Host "[INFO] Manuel: gh pr checks <PR_NUMBER> --watch`n" -ForegroundColor Yellow
        
    } catch {
        Write-Host "`n❌ PR oluşturma başarısız: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[SKIP] PR oluşturma atlandı`n" -ForegroundColor Gray
}

# Step 4: Canary Smoke (opsiyonel)
if (-not $SkipCanary) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "STEP 4/4 — Canary Smoke Test" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "[INFO] Bu adım merge sonrası çalıştırılmalı" -ForegroundColor Yellow
    Write-Host "[INFO] Manuel: pwsh scripts/canary-ui-smoke.ps1`n" -ForegroundColor Yellow
    
    $runCanary = Read-Host "Şimdi canary smoke çalıştırılsın mı? (y/N)"
    
    if ($runCanary -eq "y" -or $runCanary -eq "Y") {
        try {
            & pwsh scripts/canary-ui-smoke.ps1
            Write-Host "`n✅ Canary smoke başarılı`n" -ForegroundColor Green
        } catch {
            Write-Host "`n❌ Canary smoke başarısız: $_" -ForegroundColor Red
            Write-Host "[HINT] Rollback gerekebilir: Add-Content -Path 'apps/web-next/.env' -Value 'ENABLE_NEW_UI=false'" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "[SKIP] Canary smoke manuel olarak çalıştırılacak`n" -ForegroundColor Gray
    }
} else {
    Write-Host "[SKIP] Canary smoke atlandı`n" -ForegroundColor Gray
}

# Final Summary
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "MASTER SCRIPT — COMPLETE" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Host "✅ Evidence:     Toplandı" -ForegroundColor Green
Write-Host "$(if ($SkipScreenshots) { '⏭️' } else { '✅' }) Screenshots:  $(if ($SkipScreenshots) { 'Atlandı' } else { 'Çekildi' })" -ForegroundColor $(if ($SkipScreenshots) { "Gray" } else { "Green" })
Write-Host "$(if ($SkipPR) { '⏭️' } else { '✅' }) PR:           $(if ($SkipPR) { 'Atlandı' } else { 'Oluşturuldu' })" -ForegroundColor $(if ($SkipPR) { "Gray" } else { "Green" })
Write-Host "$(if ($SkipCanary) { '⏭️' } else { '⏭️' }) Canary:       Manuel çalıştır (merge sonrası)" -ForegroundColor Gray

Write-Host "`n📚 Sonraki Adımlar:" -ForegroundColor Cyan
Write-Host "   1. CI checks bekle: gh pr checks <PR_NUMBER> --watch" -ForegroundColor White
Write-Host "   2. PR ready: gh pr ready <PR_NUMBER>" -ForegroundColor White
Write-Host "   3. Merge: gh pr merge <PR_NUMBER> --squash --delete-branch" -ForegroundColor White
Write-Host "   4. Canary: pwsh scripts/canary-ui-smoke.ps1" -ForegroundColor White
Write-Host "   5. Cutover: GO_NO_GO_CHECKLIST.md doldur" -ForegroundColor White

Write-Host "`n🎯 Tamamlanma: $timestamp" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

