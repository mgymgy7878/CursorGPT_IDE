# SPARK PLATFORM - BAŞLATMA REHBERİ

**Tarih**: 10 Ekim 2025  
**Hazırlayan**: cursor (Claude 3.5 Sonnet)  
**Durum**: ✅ Terminal Açılma Sorunu Çözüldü

---

## ⚡ HIZLI BAŞLATMA

### ✅ Yeni Yöntem (Önerilen - Terminal Açmaz)

```powershell
# Servisleri başlat
.\basla.ps1

# Servisleri durdur
.\durdur.ps1
```

**Avantajlar**:
- ✅ Yeni terminal penceresi **AÇMAZ**
- ✅ PM2 ile arka planda çalışır
- ✅ Tek komutla tüm servisleri yönetir
- ✅ Kolayca durdurulabilir
- ✅ Loglar PM2 üzerinden izlenebilir

---

## 📋 PM2 KOMUTLARI

```powershell
# Durum göster
pm2 status

# Logları canlı izle
pm2 logs

# Belirli bir servisin logları
pm2 logs spark-web-dev
pm2 logs spark-executor-dev

# Servisleri yeniden başlat
pm2 restart all

# Servisleri durdur
pm2 stop all

# Tümünü temizle
pm2 delete all
```

---

## 🌐 ERİŞİM ADRESLERİ

### Web Arayüzü (Port 3003)
- **Ana Sayfa**: http://localhost:3003
- **Dashboard**: http://localhost:3003/
- **Backtest**: http://localhost:3003/backtest
- **Admin Panel**: http://localhost:3003/admin/params
- **Alerts**: http://localhost:3003/alerts
- **ML Dashboard**: http://localhost:3003/ml
- **Copilot**: http://localhost:3003/copilot

### Executor API (Port 4001)
- **Health Check**: http://localhost:4001/health
- **Metrics**: http://localhost:4001/metrics
- **API Docs**: http://localhost:4001/docs

---

## 🔧 SORUN GİDERME

### Sorun: PM2 bulunamadı

```powershell
# PM2'yi global olarak kur
npm install -g pm2

# Kontrol et
pm2 --version
```

### Sorun: Portlar zaten kullanımda

```powershell
# Portları temizle
.\durdur.ps1

# Veya manuel:
netstat -ano | findstr "3003 4001"
# Çıkan PID'leri durdur:
Stop-Process -Id <PID> -Force
```

### Sorun: Servisler başlamıyor

```powershell
# Logları kontrol et
pm2 logs

# Bağımlılıkları yeniden yükle
pnpm install

# PM2'yi sıfırla
pm2 kill
.\basla.ps1
```

### Sorun: Executor sürekli restart oluyor

```powershell
# Executor loglarını kontrol et
pm2 logs spark-executor-dev --lines 50

# run-local.cjs dosyasını kontrol et
cd services\executor
Get-ChildItem -Filter "*.cjs"

# Manuel başlatmayı dene
cd services\executor
node run-local.cjs
```

---

## 📁 ARŞİVLENEN ESKİ BETİKLER

Aşağıdaki betikler **yeni terminal penceresi açtığı için** arşivlendi:

```
_archived_scripts\
├── HIZLI_BASLATMA.ps1      ← Start-Process ile terminal açıyordu
├── quick-start.ps1           ← Start-Process ile terminal açıyordu
└── start-dev.ps1             ← Start-Process ile terminal açıyordu
```

**Neden arşivlendi?**
- Her çalıştırıldığında 2 yeni PowerShell penceresi açıyordu
- Kullanıcı deneyimi kötüydü
- PM2 tabanlı çözüm daha profesyonel

**Eski betikleri kullanmak isterseniz**:
```powershell
.\_archived_scripts\HIZLI_BASLATMA.ps1
```

---

## 🎯 GELIŞTIRME WORKFLOW'U

### 1. Günlük Geliştirme

```powershell
# Sabah - Servisleri başlat
.\basla.ps1

# Gün boyunca - Değişiklikleri izle
pm2 logs

# Servis restart gerekirse
pm2 restart spark-web-dev

# Akşam - Servisleri durdur (opsiyonel)
.\durdur.ps1
```

### 2. Kod Değişikliği Sonrası

```powershell
# Web-Next'i yeniden başlat
pm2 restart spark-web-dev

# Executor'ı yeniden başlat
pm2 restart spark-executor-dev

# Tüm servisleri yeniden başlat
pm2 restart all
```

### 3. Dependency Güncellemesi Sonrası

```powershell
# Servisleri durdur
.\durdur.ps1

# Bağımlılıkları güncelle
pnpm install

# Servisleri başlat
.\basla.ps1
```

---

## 📊 PM2 YAPISI

### ecosystem.config.cjs

```javascript
module.exports = {
  apps: [
    {
      name: "spark-web-dev",
      cwd: "apps/web-next",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3003",
      env: { NODE_ENV: "development" },
      autorestart: true,
      max_restarts: 10
    },
    {
      name: "spark-executor-dev",
      cwd: "services/executor",
      script: "node",
      args: "run-dev.cjs",
      env: { NODE_ENV: "development", PORT: "4001" },
      autorestart: true,
      max_restarts: 10
    }
  ]
};
```

**Özellikleri**:
- ✅ Otomatik restart (crash durumunda)
- ✅ Max 10 restart (sonsuz loop önlemi)
- ✅ Ayrı log dosyaları (`~/.pm2/logs/`)
- ✅ Windows uyumlu

---

## ✅ ÇÖZÜLEN SORUNLAR

### ❌ Eski Sorun: Terminal Pencerelerinin Sürekli Açılması

**Nedeni**:
- `HIZLI_BASLATMA.ps1` içinde `Start-Process powershell` komutları
- `quick-start.ps1` içinde `Start-Process` komutları
- `start-dev.ps1` içinde `Start-Process powershell` komutları

**Çözüm**:
- ✅ PM2 tabanlı yeni betikler (`basla.ps1`, `durdur.ps1`)
- ✅ Eski betikler arşivlendi
- ✅ Artık yeni terminal açılmıyor

---

## 📌 ÖNEMLİ NOTLAR

1. **PM2 Global Kurulum Gerekli**: `npm install -g pm2`
2. **Portlar**: Web (3003), Executor (4001)
3. **Loglar**: `~/.pm2/logs/` klasöründe
4. **Restart Limiti**: Servis 10 kez crash olursa durur
5. **Development Mode**: Hot-reload aktif

---

## 🔗 İLGİLİ DOSYALAR

- **Başlatma**: `basla.ps1`
- **Durdurma**: `durdur.ps1`
- **PM2 Config**: `ecosystem.config.cjs`
- **Arşiv**: `_archived_scripts/`
- **Bu Rehber**: `BASLATMA_REHBERI.md`

---

## 📞 DESTEK

Sorun yaşarsanız:

1. **Logları kontrol edin**: `pm2 logs`
2. **PM2 durumunu kontrol edin**: `pm2 status`
3. **Portları kontrol edin**: `netstat -ano | findstr "3003 4001"`
4. **Bu rehberi okuyun**: Sorun giderme bölümü
5. **Detaylı rapor**: `DETAYLI_PROJE_ANALIZ_VE_TEMIZLIK_RAPORU_2025_10_10.md`

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

