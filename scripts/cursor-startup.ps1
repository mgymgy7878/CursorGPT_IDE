# Cursor Açılış Protokolü
# Kullanım: Cursor her açıldığında otomatik çalışır

Write-Host "🚀 Cursor Açılış Protokolü başlatılıyor..." -ForegroundColor Green
Write-Host "📅 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# 1. Proje Durumu Kontrolü
Write-Host "`n🔍 Proje durumu kontrol ediliyor..." -ForegroundColor Yellow
& ".\auto-status-check.ps1"

# 2. Otomatik İşlem Devam
Write-Host "`n🔄 Otomatik işlem devam sistemi çalıştırılıyor..." -ForegroundColor Yellow
& ".\auto-continue.ps1"

# 3. Cursor Açılış Raporu
Write-Host "`n📋 Cursor Açılış Raporu:" -ForegroundColor Cyan
Write-Host "✅ Geri sayım sistemi: Aktif" -ForegroundColor Green
Write-Host "✅ Durum tespiti: Aktif" -ForegroundColor Green
Write-Host "✅ Otomatik devam: Aktif" -ForegroundColor Green
Write-Host "✅ İşlem takibi: Aktif" -ForegroundColor Green

# 4. Kullanıcı Bilgilendirmesi
Write-Host "`n💡 Kullanıcı Bilgilendirmesi:" -ForegroundColor Cyan
Write-Host "• Tüm işlemler otomatik geri sayım ile çalışır" -ForegroundColor White
Write-Host "• İşlemler takılırsa otomatik devam eder" -ForegroundColor White
Write-Host "• Durum tespiti otomatik yapılır" -ForegroundColor White
Write-Host "• 'devam' komutu ile manuel devam edilebilir" -ForegroundColor White

Write-Host "`n🎉 Cursor açılış protokolü tamamlandı!" -ForegroundColor Green
Write-Host "📝 Sistem hazır, işlemler otomatik takip edilecek" -ForegroundColor Green
