# Windows Auto-Start Scripts

## Spark WebNext Dev Server Auto-Starter

### Kurulum

Task Scheduler task'ı zaten oluşturulmuş olmalı. Kontrol etmek için:

```powershell
schtasks /Query /TN "Spark WebNext Dev"
```

### Manuel Çalıştırma

```powershell
schtasks /Run /TN "Spark WebNext Dev"
```

### Durdurma

```powershell
schtasks /End /TN "Spark WebNext Dev"
```

### Silme

```powershell
schtasks /Delete /F /TN "Spark WebNext Dev"
```

### Loglar

- **OUT log**: `logs\web-next-dev.out.log` - Standart çıktı
- **ERR log**: `logs\web-next-dev.err.log` - Hata çıktısı

### Yeniden Kurulum

Eğer task silinmişse veya yeniden kurmak isterseniz:

```powershell
schtasks /Create /F /SC ONLOGON /DELAY 0000:30 /RL HIGHEST /TN "Spark WebNext Dev" `
 /TR "cmd /c call C:\dev\CursorGPT_IDE\tools\windows\start-webnext-dev.cmd"
```

### Prod-Like Mode (Opsiyonel)

Daha stabil çalışma için dev yerine production build kullanmak:

1. Bir defa build:
```powershell
pnpm --filter web-next build
```

2. Script'i güncelle (`start-webnext-dev.cmd`):
   - `dev` yerine `start` kullan
   - `pnpm --filter web-next start -- --hostname 127.0.0.1 --port 3003`

### Sorun Giderme

**Port zaten kullanımda:**
```powershell
# PID'yi bul
netstat -ano | findstr :3003

# Process'i öldür (PID'yi değiştir)
taskkill /F /PID <PID>
```

**Task çalışmıyor:**
- Admin yetkisi gerekebilir
- Script path'ini kontrol et: `C:\dev\CursorGPT_IDE\tools\windows\start-webnext-dev.cmd`
- Log dosyalarını kontrol et: `logs\web-next-dev.err.log`
