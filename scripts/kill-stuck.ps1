# Takılan işlemleri temizleme scripti
# Kullanım: .\scripts\kill-stuck.ps1

Write-Host "Takılan işlemler temizleniyor..." -ForegroundColor Yellow

# Takılan Node.js, pnpm, TypeScript ve diğer geliştirme işlemlerini sonlandır
$processes = @("node", "pnpm", "tsc", "next", "squirrel", "update")

foreach ($process in $processes) {
    $running = Get-Process -Name $process -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "Sonlandırılıyor: $process ($($running.Count) işlem)" -ForegroundColor Red
        Stop-Process -Name $process -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Çalışmıyor: $process" -ForegroundColor Green
    }
}

# Cursor güncelleme işlemlerini kontrol et
$cursorUpdate = Get-Process -Name "*cursor*" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like "*update*" -or $_.ProcessName -like "*squirrel*" }
if ($cursorUpdate) {
    Write-Host "Cursor güncelleme işlemleri sonlandırılıyor..." -ForegroundColor Red
    $cursorUpdate | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host "Temizlik tamamlandı!" -ForegroundColor Green
