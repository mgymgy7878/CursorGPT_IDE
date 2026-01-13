# Windows Startup Klasörü Kurulumu (Admin Gerektirmez)

## 🎯 En Basit Çözüm: Startup Klasörü

Task Scheduler Admin gerektirir. **Startup klasörü** Admin gerektirmez ve kullanıcı giriş yapınca otomatik çalışır.

## 🎯 Üç Seçenek: Watchdog (Önerilen), Startup Klasörü veya Task Scheduler

### ⭐ Seçenek A: Watchdog (En Sağlam - Önerilen)

**Watchdog nedir?**

- Port 3003'ü sürekli kontrol eder
- Dinlenmiyorsa otomatik başlatır
- Process düşerse tekrar kaldırır
- Startup item tetiklenmese bile çalışır

**Kurulum (İki Yöntem):**

#### Yöntem 1: Registry Run (Önerilen - Daha Stabil)

**PowerShell (normal kullanıcı yetkisi yeterli):**

```powershell
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SparkWebNextWatch" /t REG_SZ /d "\"%SystemRoot%\System32\wscript.exe\" \"C:\dev\CursorGPT_IDE\tools\windows\watch-webnext-dev.vbs\"" /f
```

**Not:** `%SystemRoot%\System32\wscript.exe` tam path kullanılıyor (PATH bağımsız).

**Kontrol:**

```powershell
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SparkWebNextWatch"
```

**Kaldırma:**

```powershell
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SparkWebNextWatch" /f
```

**Avantajlar:**

- ✅ Admin gerektirmez
- ✅ Startup klasöründen daha güvenilir
- ✅ Windows açılışında garantili çalışır

#### Yöntem 2: Startup Klasörü (Alternatif)

1. **Startup klasörünü aç:**
   - `Win + R` → `shell:startup` → Enter

2. **Kısayol oluştur:**
   - Sağ tık → **Yeni** → **Kısayol**
   - Konum:
     ```
     wscript.exe "C:\dev\CursorGPT_IDE\tools\windows\watch-webnext-dev.vbs"
     ```
   - İleri → Son

**Avantajlar:**

- ✅ Admin gerektirmez
- ✅ Startup item tetiklenmese bile çalışır
- ✅ Process düşerse otomatik yeniden başlatır
- ✅ Pencere görünmez (VBS wrapper)
- ✅ Log dosyaları: `logs\webnext-watch.out.log`

**Kontrol:**

```powershell
# Watchdog çalışıyor mu? (process kontrolü)
Get-Process | Where-Object { $_.ProcessName -eq "wscript" -or $_.ProcessName -eq "cmd" } | Select-Object ProcessName, Id

# Watchdog log'u
Get-Content logs\webnext-watch.out.log -Tail 20

# Port kontrolü
netstat -ano | findstr :3003
```

**Durdurma:**

```powershell
# Watchdog process'ini bul ve durdur
Get-Process | Where-Object { $_.CommandLine -like "*watch-webnext-dev*" } | Stop-Process -Force
```

---

### Seçenek B: Task Scheduler (LIMITED - Admin Gerektirmez)

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

**Durdurma:**

```powershell
schtasks /End /TN "Spark WebNext Dev (User)"
```

**Silme:**

```powershell
schtasks /Delete /F /TN "Spark WebNext Dev (User)"
```

---

### Seçenek C: Startup Klasörü (Basit - Alternatif)

## Adım 1: Startup Klasörünü Aç

**Yöntem 1: Win + R**

1. `Win + R` tuşlarına basın
2. `shell:startup` yazın
3. Enter'a basın

**Yöntem 2: Explorer**

1. `Win + R` → `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
2. Enter'a basın

## Adım 2: Kısayol Oluştur

### Seçenek A: CMD Script (Konsol Penceresi Gösterir)

1. Startup klasöründe **sağ tık** → **Yeni** → **Kısayol**
2. Konum olarak şunu girin:
   ```
   C:\dev\CursorGPT_IDE\tools\windows\start-webnext-dev.cmd
   ```
3. İleri → Son

### Seçenek B: VBS Wrapper (Pencere Görünmez - Önerilen)

1. Startup klasöründe **sağ tık** → **Yeni** → **Kısayol**
2. Konum olarak şunu girin:
   ```
   wscript.exe "C:\dev\CursorGPT_IDE\tools\windows\start-webnext-dev.vbs"
   ```
3. İleri → Son

**VBS Avantajı:** CMD penceresi açılmaz, arka planda sessizce çalışır.

## Adım 3: Doğrulama

### Reboot Etmeden Test

1. Startup klasöründeki kısayola **çift tıklayın**
2. 10-15 saniye bekleyin
3. Port kontrolü:
   ```powershell
   netstat -ano | findstr :3003
   ```
4. Tarayıcıda test:
   ```
   http://127.0.0.1:3003/dashboard
   ```

### Log Kontrolü

```powershell
# Dev mode
Get-Content logs\web-next-dev.out.log -Tail 20

# Prod mode
Get-Content logs\web-next-prod.out.log -Tail 20
```

## Seçenekler

### Dev Mode (HMR, Hot Reload)

- **Script:** `start-webnext-dev.cmd`
- **Avantaj:** Kod değişikliklerinde otomatik yenileme
- **Dezavantaj:** Reboot sonrası bazen daha nazlı olabilir

### Prod Mode (Daha Stabil)

- **Script:** `start-webnext-prod.cmd`
- **Avantaj:** Daha stabil, reboot sonrası daha güvenilir
- **Dezavantaj:** Kod değişikliklerinde manuel rebuild gerekir

**Prod Mode Kurulumu:**

1. Bir defa build:
   ```powershell
   cd C:\dev\CursorGPT_IDE
   pnpm --filter web-next build
   ```
2. Startup kısayolunu `start-webnext-prod.cmd` veya `start-webnext-prod.vbs` olarak değiştir

## Sorun Giderme

### Port Zaten Kullanımda

```powershell
# PID'yi bul
netstat -ano | findstr :3003

# Process'i öldür (PID'yi değiştir)
taskkill /F /PID <PID>
```

### pnpm Bulunamadı

Script otomatik olarak `where.exe pnpm` ile bulmaya çalışır. Eğer bulamazsa:

1. pnpm'in kurulu olduğundan emin olun:

   ```powershell
   pnpm --version
   ```

2. PATH'i kontrol edin:

   ```powershell
   $env:PATH -split ';' | Select-String -Pattern "node|pnpm"
   ```

3. Script'i manuel düzenleyin (`start-webnext-dev.cmd`):
   ```cmd
   REM pnpm'in tam yolunu buraya yazın
   call "C:\Program Files\nodejs\pnpm.cmd" --filter web-next dev ...
   ```

### Log Dosyaları Oluşmuyor

1. `logs` klasörünün var olduğundan emin olun:

   ```powershell
   Test-Path C:\dev\CursorGPT_IDE\logs
   ```

2. Script'in çalıştırma yetkisi var mı kontrol edin (genelde sorun olmaz)

### Server Başlamıyor

1. **Log kontrolü:**

   ```powershell
   Get-Content logs\web-next-dev.err.log -Tail 30
   ```

2. **Manuel test:**

   ```powershell
   cd C:\dev\CursorGPT_IDE
   .\tools\windows\start-webnext-dev.cmd
   ```

   (Bu komut konsol penceresi açar, hataları görebilirsiniz)

3. **pnpm PATH sorunu:**
   - Script otomatik bulmaya çalışır ama bazen fnm/nvm kullanıyorsanız PATH'te olmayabilir
   - Script'i açıp pnpm'in tam yolunu manuel yazın

## Kaldırma

Startup klasöründen kısayolu silin:

1. `Win + R` → `shell:startup`
2. Oluşturduğunuz kısayolu silin

## Başarı Kriterleri

✅ Windows açıldığında:

- Kullanıcı giriş yapınca otomatik başlıyor
- Port 3003 dinleniyor (10-15 sn sonra)
- `http://127.0.0.1:3003` erişilebilir
- Log dosyaları oluşuyor

✅ Reboot sonrası:

- Tarayıcıda `http://127.0.0.1:3003/dashboard` açılıyor
- "ERR_CONNECTION_REFUSED" hatası yok

## Avantajlar (Task Scheduler'a Göre)

- ✅ **Admin gerektirmez** - Normal kullanıcı yetkisi yeterli
- ✅ **Daha basit** - Sadece kısayol oluştur
- ✅ **Daha güvenilir** - PATH sorunları daha az
- ✅ **Kolay yönetim** - Kısayolu sil/kopyala yeterli

---

## Checkpoint & Rollback Sistemi

### Checkpoint Oluşturma

**Mikro checkpoint (her riskli hamle sonrası):**

```powershell
.\tools\windows\checkpoint.ps1 -Message "command palette portal fix"
```

**UI oynadıysan "kanıtlı" checkpoint (token + visual test):**

```powershell
.\tools\windows\checkpoint.ps1 -Message "status bar feed pill" -VerifyUi
```

**Günlük checkpoint (gün sonu):**

```powershell
.\tools\windows\checkpoint.ps1 -Message "end of day" -Daily
```

### Rollback (Geri Dönüş)

**Son checkpoint'e dön:**

```powershell
.\tools\windows\rollback.ps1
```

**Belirli bir tag'e dön:**

```powershell
.\tools\windows\rollback.ps1 -Tag "cp/2026-01-13_17-39-00"
```

**Checkpoint listesi:**

```powershell
git tag --list "cp/*" --sort=-creatordate
```

### Checkpoint Özellikleri

- ✅ Otomatik commit + tag oluşturma
- ✅ Evidence kaydetme (`evidence/checkpoints/`)
- ✅ UI guardrails entegrasyonu (`-VerifyUi`)
- ✅ Günlük checkpoint desteği (`-Daily`)
- ✅ Hızlı geri dönüş (tek komut)

**Not:** Checkpoint'ler "golden master" referansı olarak kullanılabilir. UI bozulduğunda 5 saniyede geri dönebilirsiniz.

Detaylı dokümantasyon: `tools/windows/CHECKPOINT.md`
