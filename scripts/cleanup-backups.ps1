# Backup Dosyalarını Temizleme Script'i
# Kullanım: .\scripts\cleanup-backups.ps1

$ErrorActionPreference = 'Stop'

Write-Host "🧹 Backup ve gereksiz dosyaları temizliyorum..." -ForegroundColor Yellow

# 1. Backup klasörlerini sil
$backupDirs = @('_backups', 'GPT_Backups', 'backups')
foreach ($dir in $backupDirs) {
    if (Test-Path $dir) {
        $size = (Get-ChildItem -Path $dir -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
        Write-Host "  📁 $dir siliniyor... (${size:F2} GB)" -ForegroundColor Cyan
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ $dir temizlendi" -ForegroundColor Green
    }
}

# 2. Gereksiz dosyaları sil
$patterns = @(
    '*_FINAL*.md',
    '*_FINAL*.txt',
    '*SESSION*.md',
    '*SESSION*.txt',
    '*ULTIMATE*.md',
    '*ULTIMATE*.txt',
    '*DEPLOYMENT*.txt',
    'null'
)

$deletedCount = 0
foreach ($pattern in $patterns) {
    Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  🗑️  Siliniyor: $($_.Name)" -ForegroundColor DarkGray
        Remove-Item $_.FullName -Force
        $deletedCount++
    }
}

# 3. Büyük .exe dosyası kontrolü
if (Test-Path "Spark Trading Setup 0.1.1.exe") {
    Write-Host "  ⚠️  Spark Trading Setup 0.1.1.exe bulundu (606MB)" -ForegroundColor Yellow
    Write-Host "     Git'ten kaldırmak için: git rm --cached 'Spark Trading Setup 0.1.1.exe'" -ForegroundColor Yellow
}

# 4. .gitignore güncelle
$gitignoreLines = @(
    "",
    "# Backup directories",
    "_backups/",
    "GPT_Backups/",
    "backups/",
    "",
    "# Large binary files",
    "*.exe",
    "null",
    "",
    "# Temporary files",
    "*_FINAL*.md",
    "*_SESSION*.md",
    "*_ULTIMATE*.md"
)

if (Test-Path .gitignore) {
    $existing = Get-Content .gitignore -Raw
    $newContent = $gitignoreLines | Out-String

    if ($existing -notmatch 'backups/') {
        Write-Host "  📝 .gitignore güncelleniyor..." -ForegroundColor Cyan
        $gitignoreLines | Out-File -FilePath .gitignore -Append -Encoding utf8
        Write-Host "  ✓ .gitignore güncellendi" -ForegroundColor Green
    }
} else {
    $gitignoreLines | Out-File -FilePath .gitignore -Encoding utf8
    Write-Host "  ✓ .gitignore oluşturuldu" -ForegroundColor Green
}

# Özet
Write-Host ""
Write-Host "✅ Temizlik tamamlandı!" -ForegroundColor Green
Write-Host "   🗑️  Silinen dosyalar: $deletedCount" -ForegroundColor White
Write-Host "   📁 Silinen klasörler: $($backupDirs.Length)" -ForegroundColor White
Write-Host ""
Write-Host "Sonraki adımlar:" -ForegroundColor Yellow
Write-Host "  1. git status                    # Değişiklikleri kontrol et" -ForegroundColor White
Write-Host "  2. git add .gitignore            # Gitignore'ı ekle" -ForegroundColor White
Write-Host "  3. git commit -m 'chore: cleanup' # Commit et" -ForegroundColor White
Write-Host "  4. git push                      # Push et" -ForegroundColor White

