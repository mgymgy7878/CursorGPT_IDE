# Windows Auto-Start Kurulum Talimatları

## ⚠️ Admin Yetkisi Gerekli

Task Scheduler task'ı oluşturmak için **PowerShell'i Admin olarak** açmanız gerekiyor.

## 🎯 İki Seçenek: Task Scheduler (LIMITED) veya Startup Klasörü

### Seçenek A: Task Scheduler (LIMITED - Admin Gerektirmez - Önerilen)

**PowerShell (normal kullanıcı yetkisi yeterli):**

```powershell
schtasks /Create /F /SC ONLOGON /DELAY 0000:30 /RL LIMITED `
  /TN "Spark WebNext Dev (User)" `
  /TR "cmd /c call C:\dev\CursorGPT_IDE\tools\windows\start-webnext-dev.cmd"
```

**Kontrol:**
```powershell
schtasks /Query /TN "Spark WebNext Dev (User)" /FO LIST /V
```

**Manuel Test:**
```powershell
schtasks /Run /TN "Spark WebNext Dev (User)"
```

**Avantajlar:**
- ✅ Admin gerektirmez (`/RL LIMITED`)
- ✅ Daha stabil (PATH/timing sorunları daha az)
- ✅ 30sn gecikme ile disk/AV yükünden kaçınır
- ✅ Port guard ile çift çalışmayı engeller

---

### Seçenek B: Task Scheduler (HIGHEST - Admin Gerekir)

## Adım 1: PowerShell'i Admin Olarak Aç

1. Windows tuşuna basın
2. "PowerShell" yazın
3. Sağ tıklayın → **"Yönetici olarak çalıştır"** seçin

## Adım 2: Task Scheduler Task'ını Oluştur

PowerShell (Admin) içinde şu komutu çalıştırın:

```powershell
schtasks /Create /F /SC ONLOGON /DELAY 0000:30 /RL HIGHEST /TN "Spark WebNext Dev" `
 /TR "cmd /c call C:\dev\CursorGPT_IDE\tools\windows\start-webnext-dev.cmd"
```

**Açıklama:**
- `/SC ONLOGON`: Windows açılışında çalıştır
- `/DELAY 0000:30`: 30 saniye gecikme (disk/AV yükünden kaçınmak için)
- `/RL HIGHEST`: En yüksek yetki seviyesi
- `/TN "Spark WebNext Dev"`: Task adı

## Adım 3: Doğrulama

### Task durumunu kontrol et:
```powershell
schtasks /Query /TN "Spark WebNext Dev" /FO LIST
```

### Manuel test (reboot etmeden):
```powershell
schtasks /Run /TN "Spark WebNext Dev"
```

### Port kontrolü (10-15 saniye sonra):
```powershell
netstat -ano | findstr :3003
```

### Tarayıcıda test:
```
http://127.0.0.1:3003/dashboard
```

### Log kontrolü:
```powershell
Get-Content logs\web-next-dev.out.log -Tail 20
```

## Yönetim Komutları

### Task'ı durdur:
```powershell
schtasks /End /TN "Spark WebNext Dev"
```

### Task'ı sil:
```powershell
schtasks /Delete /F /TN "Spark WebNext Dev"
```

### Task'ı yeniden başlat:
```powershell
schtasks /End /TN "Spark WebNext Dev"
schtasks /Run /TN "Spark WebNext Dev"
```

## Sorun Giderme

### "Erişim engellendi" hatası
- PowerShell'i **Admin olarak** açtığınızdan emin olun

### Port zaten kullanımda
```powershell
# PID'yi bul
netstat -ano | findstr :3003

# Process'i öldür (PID'yi değiştir)
taskkill /F /PID <PID>
```

### Task çalışmıyor
1. Log dosyalarını kontrol edin:
   ```powershell
   Get-Content logs\web-next-dev.err.log
   ```

2. Script path'ini kontrol edin:
   ```powershell
   Test-Path "C:\dev\CursorGPT_IDE\tools\windows\start-webnext-dev.cmd"
   ```

3. pnpm PATH'te mi kontrol edin:
   ```powershell
   pnpm --version
   ```

## Prod-Like Mode (Opsiyonel)

Daha stabil çalışma için dev yerine production build:

1. **Bir defa build:**
   ```powershell
   cd C:\dev\CursorGPT_IDE
   pnpm --filter web-next build
   ```

2. **Script'i güncelle** (`tools\windows\start-webnext-dev.cmd`):
   - `dev` yerine `start` kullan
   - Satırı şu şekilde değiştir:
     ```cmd
     call pnpm --filter web-next start -- --hostname 127.0.0.1 --port 3003 ^
     ```

3. **Task'ı yeniden başlat:**
   ```powershell
   schtasks /End /TN "Spark WebNext Dev"
   schtasks /Run /TN "Spark WebNext Dev"
   ```

## Başarı Kriterleri

✅ Windows açıldığında otomatik olarak:
- Task başlatılıyor (30sn sonra)
- Port 3003 dinleniyor
- `http://127.0.0.1:3003` erişilebilir
- Log dosyaları oluşuyor

✅ Reboot sonrası:
- Tarayıcıda `http://127.0.0.1:3003/dashboard` açılıyor
- Command Palette modal fix görsel olarak doğrulanabilir
