# Otomatik Durum Tespiti Sistemi
# Kullanım: .\auto-status-check.ps1

Write-Host "🔍 Otomatik durum tespiti başlıyor..." -ForegroundColor Yellow

# PM2 Durum Kontrolü
Write-Host "`n📊 PM2 Durum Kontrolü:" -ForegroundColor Cyan
try {
    $pm2Status = pm2 status
    Write-Host "✅ PM2 durumu alındı" -ForegroundColor Green
} catch {
    Write-Host "❌ PM2 durumu alınamadı: $($_.Exception.Message)" -ForegroundColor Red
}

# Build Durum Kontrolü
Write-Host "`n🏗️ Build Durum Kontrolü:" -ForegroundColor Cyan
if (Test-Path "apps\web-next\.next") { 
    Write-Host "✅ .next dizini mevcut" -ForegroundColor Green 
} else { 
    Write-Host "❌ .next dizini yok" -ForegroundColor Red 
}

# Endpoint Testleri
Write-Host "`n🌐 Endpoint Testleri:" -ForegroundColor Cyan

# Executor Health
try { 
    $executorHealth = Invoke-RestMethod http://127.0.0.1:4001/health -TimeoutSec 5; 
    Write-Host "✅ Executor Health: 200 OK" -ForegroundColor Green 
} catch { 
    Write-Host "❌ Executor Health: $($_.Exception.Message)" -ForegroundColor Red 
}

# Web-Next Ops
try { 
    $webNextOps = Invoke-RestMethod http://127.0.0.1:3003/ops -TimeoutSec 5; 
    Write-Host "✅ Web-Next Ops: 200 OK" -ForegroundColor Green 
} catch { 
    Write-Host "❌ Web-Next Ops: $($_.Exception.Message)" -ForegroundColor Red 
}

# Web-Next Health
try { 
    $webNextHealth = Invoke-RestMethod http://127.0.0.1:3003/api/public/health -TimeoutSec 5; 
    Write-Host "✅ Web-Next Health: 200 OK" -ForegroundColor Green 
} catch { 
    Write-Host "❌ Web-Next Health: $($_.Exception.Message)" -ForegroundColor Red 
}

# Web-Next Runtime
try { 
    $webNextRuntime = Invoke-RestMethod http://127.0.0.1:3003/api/public/runtime -TimeoutSec 5; 
    Write-Host "✅ Web-Next Runtime: 200 OK" -ForegroundColor Green 
} catch { 
    Write-Host "❌ Web-Next Runtime: $($_.Exception.Message)" -ForegroundColor Red 
}

Write-Host "`n✅ Durum tespiti tamamlandı!" -ForegroundColor Green
