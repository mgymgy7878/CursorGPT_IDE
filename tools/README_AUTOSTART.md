# WebNext Daemon - Autostart Çözümü

## ✅ Kurulum Durumu

**Aktif Çözüm:** Startup Klasörü (Admin gerektirmez, en güvenilir)

- **Script:** `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SparkWebNextStartup.cmd`
- **Kurulum:** `tools\INSTALL_STARTUP_FALLBACK.cmd`
- **Doğrulama:** `tools\VERIFY_STARTUP.cmd`

## 🔄 Beklenen Davranış

1. Windows açılır
2. Kullanıcı login olur
3. Startup klasöründeki `SparkWebNextStartup.cmd` otomatik çalışır
4. Script port 3003'ü kontrol eder:
   - **Dinliyorsa:** Hiçbir şey yapmaz (çift başlatma yok)
   - **Dinlemiyorsa:** `WEBNEXT_DAEMON.cmd`'yi minimize başlatır
5. Next.js dev server ayağa kalkar (20-30 saniye içinde)

## 📋 Reboot Sonrası Kontrol (Kanıtlı Ritüel)

Login olduktan **20-30 saniye** sonra:

```cmd
cd /d C:\dev\CursorGPT_IDE
tools\HEALTH_WEBNEXT.cmd
netstat -ano | findstr :3003
```

**Beklenen çıktı:**

- Port 3003 LISTENING olmalı
- Daemon log'da başlatma kaydı olmalı
- Runtime log'da Next.js "Ready" mesajı olmalı

## 🔍 Loglar (Problem Varsa İlk Bakılacak)

```cmd
type tools\logs\webnext_daemon.log
type tools\logs\webnext_runtime.log
```

## ⚠️ ERR_CONNECTION_REFUSED (3 Kök Neden)

### 1. Fast Startup / Hybrid Boot

**Belirti:** Reboot sonrası bazen başlıyor, bazen başlamıyor

**Çözüm:**

```cmd
powercfg /h off
```

**Manuel:** Denetim Masası → Güç Seçenekleri → "Güç düğmelerinin yapacaklarını seç" → "Hızlı başlatmayı aç" → KAPAT

### 2. Login Olmadan Açılma

**Belirti:** Windows açıldı ama kullanıcı login olmadı

**Açıklama:** Startup klasörü **login gerektirir** (tasarım gereği). Login olmadan daemon başlamaz.

### 3. Antivirus/Defender Gecikmesi

**Belirti:** Login oldu ama 30+ saniye sonra başladı

**Kontrol:** Runtime log'daki zaman damgasına bak. İlk çalıştırmada Defender script'i tarayabilir.

## 🎯 Tek Otorite Prensibi

**SADECE Startup klasörü kullanılmalı.** Diğer mekanizmalar kaldırılmalı:

- ❌ Task Scheduler tasks (Spark-WebNext-Daemon, Spark-GuardTick, vb.)
- ❌ Guard scripts (SPARK_GUARD_WEBNEXT.cmd, vb.)
- ❌ Tick-based tasks (dakikada bir kontrol)

**Neden?** Çoklu mekanizma → çift başlatma, port kill savaşları, tutarsız davranış.

**Temizlik:**

```cmd
tools\CLEANUP_ALL_WEBNEXT_TASKS.cmd
```

## 🛠️ Hızlı Komutlar

```cmd
# Durum kontrolü
tools\AUTOSTART_STATUS.cmd

# Sağlık kontrolü
tools\HEALTH_WEBNEXT.cmd

# Hızlı teşhis
tools\QUICK_DIAGNOSE.cmd

# Startup doğrulama
tools\VERIFY_STARTUP.cmd

# Manuel başlatma (acil)
start /min cmd.exe /c "tools\WEBNEXT_DAEMON.cmd"

# Port kontrolü
netstat -ano | findstr :3003
```

## 🗑️ Kaldırma

```cmd
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SparkWebNextStartup.cmd"
```

## 📊 Avantajlar

✅ **Admin gerektirmez** (kullanıcı seviyesi)
✅ **Task Scheduler izin/condition sorunları yok**
✅ **Basit ve deterministik** (login = başlat)
✅ **Çift başlatma koruması** (port kontrolü)
✅ **Log desteği** (daemon + runtime logları)

## 🚫 Dezavantajlar

⚠️ **Login gerektirir** (login olmadan başlamaz)
⚠️ **Fast Startup etkilenebilir** (powercfg /h off önerilir)

## 📝 Notlar

- Daemon sürekli çalışır (watchdog mantığı)
- Port düşerse otomatik yeniden başlatır
- Loglar `tools\logs\` klasöründe
- Crash forensics aktif (exit code, process kontrolü)

## 🔄 Executor (Port 4001) Desteği

Aynı çözüm Executor için de mevcut:

```cmd
# Executor daemon kurulumu
tools\INSTALL_EXECUTOR_STARTUP.cmd

# Executor sağlık kontrolü
tools\HEALTH_EXECUTOR.cmd

# Her ikisini birlikte kur
tools\INSTALL_BOTH_STARTUP.cmd

# Her ikisini birlikte kontrol et
tools\HEALTH_BOTH.cmd
```

**Executor Daemon:** `tools\EXECUTOR_DAEMON.cmd`
**Executor Startup:** `SparkExecutorStartup.cmd` (Startup klasöründe)

**Executor Loglar:**

- Daemon log: `tools\logs\executor_daemon.log`
- Runtime log: `tools\logs\executor_runtime.log`
