# Spark Trading - UI Server Management

## Sorun: Reboot Sonrası UI Açılmıyor

**Kök Neden:** PC yeniden başlatılınca Next.js dev server otomatik olarak kalkmaz (dev mod kalıcı servis değil). Chrome'daki `ERR_CONNECTION_REFUSED` hatası "portta kimse yok" demektir.

**Çözüm:** Dev server'ı otomatik başlatmak veya manuel başlatma script'leri kullanmak.

---

## Hızlı Teşhis (5 Saniye)

```powershell
# Port kontrolü + log analizi
powershell -ExecutionPolicy Bypass -File tools\windows\check-ui-status.ps1
```

**Çıktı:**
- Port 3003 kullanımda mı?
- Process bilgisi (PID, başlangıç zamanı)
- Log dosyası durumu
- Son hatalar

---

## Manuel Başlatma Seçenekleri

### 1) Dev Mode (HMR var, crash riski daha yüksek)

**Basit CMD:**
```cmd
tools\windows\start-ui.cmd
```

**Watchdog Script (Önerilen - log + crash detection):**
```powershell
powershell -ExecutionPolicy Bypass -File tools\windows\start-ui-watchdog.ps1
```

**Özellikler:**
- ✅ Port kontrolü (zaten çalışıyorsa başlatmaz)
- ✅ pnpm PATH çözümü (`Get-Command pnpm`)
- ✅ Log dosyası: `evidence\ui_dev.log`
- ✅ Crash durumunda son 20 satır gösterir
- ✅ Console + log file çift çıktı

### 2) Prod-Like Mode (Daha stabil, HMR yok)

```cmd
tools\windows\start-ui-prod.cmd
```

**Özellikler:**
- ✅ Önce build (`pnpm --filter web-next build`)
- ✅ Sonra start (`pnpm --filter web-next start`)
- ✅ HMR yok ama crash riski çok düşük
- ✅ Reboot sonrası en stabil seçenek

---

## Otomatik Başlatma (Task Scheduler)

### Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File tools\windows\setup-auto-start.ps1
```

**Ne Yapar:**
- Windows Task Scheduler'a görev ekler
- Sistem başlangıcında (30s delay) UI dev server'ı başlatır
- Watchdog script'i kullanır (log + crash detection)
- pnpm PATH sorunlarını çözer

**Task Detayları:**
- **Ad:** `SparkTrading-UI-DevServer`
- **Trigger:** At startup (30s delay)
- **Script:** `tools\windows\start-ui-watchdog.ps1`
- **Log:** `evidence\ui_dev.log`
- **Restart:** 3 kez deneme (1 dakika aralıkla)

### Doğrulama

```powershell
# Task durumu
Get-ScheduledTask -TaskName "SparkTrading-UI-DevServer" | Format-List

# Manuel test
Start-ScheduledTask -TaskName "SparkTrading-UI-DevServer"
```

### Kaldırma

```powershell
Unregister-ScheduledTask -TaskName "SparkTrading-UI-DevServer" -Confirm:$false
```

---

## Log Dosyası

**Konum:** `evidence\ui_dev.log`

**Kullanım:**
```powershell
# Son 50 satır
Get-Content evidence\ui_dev.log -Tail 50

# Hata arama
Get-Content evidence\ui_dev.log | Select-String -Pattern "error|failed|crash" -CaseSensitive:$false

# Tam log
type evidence\ui_dev.log | more
```

**Crash Durumunda:**
1. Log dosyasını aç: `evidence\ui_dev.log`
2. İlk hata bloğunu bul (genelde en üstte)
3. Kök neden: Tailwind config, import hatası, TS error, env sorunu, vs.

---

## Tüm Servisleri Başlatma

```cmd
tools\windows\start-all.cmd
```

**Başlatır:**
- UI dev server (3003)
- Executor dev server (4001)

**Not:** Her servis ayrı PowerShell penceresinde açılır.

---

## Troubleshooting

### Port 3003 Zaten Kullanımda

```powershell
# Process'i bul
netstat -ano | findstr :3003

# PID'yi öldür
taskkill /F /PID <PID>
```

### pnpm Bulunamıyor

```powershell
# PATH'te var mı?
Get-Command pnpm

# Yoksa:
# 1. pnpm'i global install et: npm install -g pnpm
# 2. PATH'e ekle
# 3. PowerShell'i yeniden başlat
```

### Log Dosyası Çok Büyük

```powershell
# Temizle (dikkatli!)
Remove-Item evidence\ui_dev.log -Force

# Veya sadece son 1000 satırı tut
Get-Content evidence\ui_dev.log -Tail 1000 | Set-Content evidence\ui_dev.log
```

### Task Scheduler Çalışmıyor

1. Task'ı kontrol et: `Get-ScheduledTask -TaskName "SparkTrading-UI-DevServer"`
2. Log'u kontrol et: `evidence\ui_dev.log`
3. Manuel test: `Start-ScheduledTask -TaskName "SparkTrading-UI-DevServer"`
4. PowerShell execution policy: `Get-ExecutionPolicy` (Bypass olmalı)

---

## Özet: Reboot Sonrası Akış

### Otomatik (Önerilen)

1. **Kurulum (bir kez):**
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\windows\setup-auto-start.ps1
   ```

2. **Reboot sonrası:**
   - Task Scheduler otomatik başlatır (30s delay)
   - Log: `evidence\ui_dev.log`
   - UI: `http://127.0.0.1:3003`

### Manuel

1. **Reboot sonrası:**
   ```powershell
   # Durum kontrolü
   powershell -ExecutionPolicy Bypass -File tools\windows\check-ui-status.ps1
   
   # Başlat
   powershell -ExecutionPolicy Bypass -File tools\windows\start-ui-watchdog.ps1
   ```

---

## İleri Seviye: Watchdog Loop (Opsiyonel)

Eğer dev server sık crash ediyorsa, watchdog script'ini loop'a çevirebilirsin:

```powershell
# start-ui-watchdog-loop.ps1 (opsiyonel)
while ($true) {
    # ... watchdog script içeriği ...
    if ($exitCode -ne 0) {
        Write-Host "[WARN] Restarting in 10 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        break
    }
}
```

**Not:** Task Scheduler zaten restart mekanizmasına sahip (3 kez deneme), bu yüzden genelde gerekmez.
