# Otomatik Takip ve Devam Sistemi
**Tarih:** 15 Ocak 2025  
**Amaç:** Uzun süren işlemlerde takılmayı önlemek ve otomatik devam sağlamak

## 🎯 Sistem Özellikleri

### 1. Geri Sayım Sayacı Sistemi
```powershell
# Otomatik geri sayım (X saniye)
Write-Host "⏰ X saniye geri sayım başlıyor..." -ForegroundColor Yellow; 
for($i=X; $i -gt 0; $i--) { 
    Write-Host "⏳ $i saniye kaldı..." -ForegroundColor Cyan; 
    Start-Sleep -Seconds 1 
}; 
Write-Host "✅ Geri sayım tamamlandı!" -ForegroundColor Green
```

### 2. Durum Tespiti Sistemi
```powershell
# Port kontrolü
Get-NetTCPConnection -LocalPort 3003 -State Listen | Select-Object LocalAddress,LocalPort,State,OwningProcess

# Süreç kontrolü
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object Id,ProcessName,Path

# API endpoint testi
try { 
    $result = Invoke-RestMethod http://localhost:3003 -TimeoutSec 5; 
    Write-Host "✅ UI: 200 OK" -ForegroundColor Green 
} catch { 
    Write-Host "❌ UI: $($_.Exception.Message)" -ForegroundColor Red 
}
```

### 3. Otomatik Devam Mekanizması
```powershell
# İşlem takılırsa otomatik devam
if (-not (Get-NetTCPConnection -LocalPort 3003 -State Listen)) {
    Write-Host "🔄 UI servisi takıldı, yeniden başlatılıyor..." -ForegroundColor Yellow
    # Yeniden başlatma komutu
}
```

### 4. Hata Yönetimi
```powershell
# Hata durumunda bir sonraki işleme geç
try {
    # Ana işlem
} catch {
    Write-Host "⚠️ Hata: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "➡️ Bir sonraki işleme geçiliyor..." -ForegroundColor Cyan
    # Sonraki işlem
}
```

## 🔧 Kullanım Senaryoları

### Senaryo 1: Build İşlemi
```powershell
Write-Host "⏰ 30 saniye build geri sayımı..." -ForegroundColor Yellow
for($i=30; $i -gt 0; $i--) { 
    Write-Host "⏳ $i saniye kaldı..." -ForegroundColor Cyan; 
    Start-Sleep -Seconds 1 
}
# Build komutu
```

### Senaryo 2: Servis Başlatma
```powershell
Write-Host "⏰ 15 saniye servis başlatma geri sayımı..." -ForegroundColor Yellow
for($i=15; $i -gt 0; $i--) { 
    Write-Host "⏳ $i saniye kaldı..." -ForegroundColor Cyan; 
    Start-Sleep -Seconds 1 
}
# Servis başlatma komutu
```

### Senaryo 3: API Test
```powershell
Write-Host "⏰ 10 saniye API test geri sayımı..." -ForegroundColor Yellow
for($i=10; $i -gt 0; $i--) { 
    Write-Host "⏳ $i saniye kaldı..." -ForegroundColor Cyan; 
    Start-Sleep -Seconds 1 
}
# API test komutu
```

## 📊 Takip Tablosu

| İşlem | Süre | Durum | Sonraki Adım |
|-------|------|-------|--------------|
| UI Başlatma | 15s | ✅ Tamamlandı | Endpoint Test |
| API Test | 10s | 🔄 Devam Ediyor | Health Check |
| Build | 30s | ⏳ Beklemede | Deploy |
| Deploy | 20s | ⏳ Beklemede | Smoke Test |

## 🚀 Otomatik Komutlar

### Hızlı Başlatma
```powershell
# Tüm servisleri başlat
$env:PORT="3003"; $env:EXECUTOR_ORIGIN="http://127.0.0.1:4001"
pnpm dev:web
pnpm dev:exec
```

### Hızlı Test
```powershell
# Tüm endpoint'leri test et
try { Invoke-RestMethod http://localhost:3003 -TimeoutSec 3; Write-Host "✅ UI OK" } catch { Write-Host "❌ UI FAIL" }
try { Invoke-RestMethod http://localhost:4001/health -TimeoutSec 3; Write-Host "✅ Exec OK" } catch { Write-Host "❌ Exec FAIL" }
```

### Hızlı Durum
```powershell
# Sistem durumunu kontrol et
Get-NetTCPConnection -LocalPort 3003,4001 -State Listen | Select-Object LocalAddress,LocalPort,State
```

## 🎯 Başarı Kriterleri

- ✅ UI servisi port 3003'te çalışıyor
- ✅ Executor servisi port 4001'de çalışıyor
- ✅ API endpoint'leri yanıt veriyor
- ✅ Build süreci hatasız tamamlanıyor
- ✅ Otomatik devam mekanizması aktif

## 🔄 Sürekli İyileştirme

1. **Geri Sayım Süreleri**: İşlem tipine göre optimize et
2. **Hata Mesajları**: Daha açıklayıcı hale getir
3. **Loglama**: Tüm işlemleri logla
4. **Monitoring**: Gerçek zamanlı durum takibi
5. **Alerting**: Kritik hatalarda uyarı

---
*Sistem oluşturulma tarihi: 15 Ocak 2025*  
*Oluşturan: Claude 3.5 Sonnet*
