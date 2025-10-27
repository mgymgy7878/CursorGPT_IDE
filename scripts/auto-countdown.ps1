# Otomatik Geri Sayım Sistemi
# Kullanım: .\auto-countdown.ps1 -Seconds 10 -Message "İşlem başlıyor"

param(
    [int]$Seconds = 10,
    [string]$Message = "Geri sayım başlıyor",
    [string]$Color = "Yellow"
)

Write-Host "Geri sayim basliyor: $Seconds saniye..." -ForegroundColor $Color
Write-Host "Mesaj: $Message" -ForegroundColor Cyan

for($i=$Seconds; $i -gt 0; $i--) { 
    Write-Host "Kalan: $i saniye..." -ForegroundColor Cyan; 
    Start-Sleep -Seconds 1 
}

Write-Host "Geri sayim tamamlandi!" -ForegroundColor Green
Write-Host "Islem baslatiliyor..." -ForegroundColor Green
