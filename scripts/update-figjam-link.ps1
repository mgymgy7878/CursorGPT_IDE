#!/usr/bin/env pwsh
# FigJam link placeholder'larını gerçek link ile değiştir
# Kullanım: .\scripts\update-figjam-link.ps1 -FigJamLink "https://www.figma.com/file/..."

param(
    [Parameter(Mandatory=$true)]
    [string]$FigJamLink
)

$files = @(
    "docs/CI/PR_SMOKE_RCA_DECISION_TREE.md",
    ".github/pull_request_template.md"
)

Write-Host "🔗 FigJam linkini placeholder'lara ekliyorum..." -ForegroundColor Cyan
Write-Host "Link: $FigJamLink" -ForegroundColor Gray

$updated = 0
foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        Write-Host "⚠️  Dosya bulunamadı: $f" -ForegroundColor Yellow
        continue
    }

    $raw = Get-Content $f -Raw
    $original = $raw

    # Tüm placeholder varyantlarını tek seferde değiştir
    # FIGJAM_LINKINIZ, <FIGJAM_LINKINIZ>, (FIGJAM_LINKINIZ) hepsini yakalar
    $raw = $raw -replace "FIGJAM_LINKINIZ", $FigJamLink

    if ($raw -ne $original) {
        Set-Content $f -Value $raw -NoNewline
        Write-Host "✅ Güncellendi: $f" -ForegroundColor Green
        $updated++
    } else {
        Write-Host "ℹ️  Değişiklik yok: $f" -ForegroundColor Gray
    }
}

Write-Host "`n📊 Özet: $updated dosya güncellendi" -ForegroundColor Cyan

# Kontrol: Kalan placeholder var mı?
Write-Host "`n🔍 Kalan placeholder kontrolü:" -ForegroundColor Cyan
$remaining = rg "FIGJAM_LINKINIZ|<FIGJAM_LINKINIZ>" -n $files[0], $files[1] 2>$null
if ($remaining) {
    Write-Host "⚠️  Hala placeholder bulundu:" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
} else {
    Write-Host "✅ Tüm placeholder'lar değiştirildi!" -ForegroundColor Green
}

Write-Host "`n💡 Değişiklikleri görmek için: git diff" -ForegroundColor Cyan

