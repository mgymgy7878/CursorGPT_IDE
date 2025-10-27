# Otomatik Yedek Alma Scripti
# Bu script her değişiklikten sonra otomatik olarak Git commit yapar

Write-Host "🔄 Otomatik Yedek Alma Sistemi Başlatılıyor..." -ForegroundColor Green

# Git durumunu kontrol et
$status = git status --porcelain

if ($status) {
    Write-Host "📝 Değişiklikler tespit edildi, yedek alınıyor..." -ForegroundColor Yellow
    
    # Tüm değişiklikleri ekle
    git add .
    
    # Timestamp ile commit mesajı oluştur
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Otomatik yedek - $timestamp"
    
    # Commit yap
    git commit -m $commitMessage
    
    Write-Host "✅ Yedek başarıyla alındı: $commitMessage" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Değişiklik bulunamadı, yedek gerekmiyor." -ForegroundColor Blue
}

Write-Host "🎯 Yedek alma tamamlandı!" -ForegroundColor Green 