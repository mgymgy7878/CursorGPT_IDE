# SPARK PLATFORM - BAŞLATMA REHBERİ

**Güncellenme**: 10 Ekim 2025  
**Durum**: ⚠️ PM2 Pencere Sorunu İçin Alternatif Çözümler

---

## 🔴 SORUN: PM2 DAEMON PENCERE AÇIYOR

Windows'ta PM2 daemon başlatıldığında bir console penceresi açabiliyor. `ecosystem.config.cjs`'de `windowsHide: true` yapılsa bile, **PM2'nin kendi daemon penceresi** açılabiliyor.

---

## ✅ ÇÖZÜM YÖNTEMLERI

### YÖNTEM 1: VBScript ile Görünmez Başlatma (ÖNERİLEN)

**Kullanım**:
1. Masaüstünde `basla-gorunmez.vbs` dosyasına çift tıklayın
2. Veya komut satırından:
   ```
   wscript basla-gorunmez.vbs
   ```

**Avantajlar**:
- ✅ Hiçbir pencere açılmaz
- ✅ PM2 daemon da gizli başlar
- ✅ Bildirim ile durum gösterilir

**Nasıl Çalışır**:
- VBScript, PowerShell'i `-WindowStyle Hidden` ile çalıştırır
- PM2 daemon bile gizli modda başlar

---

### YÖNTEM 2: PowerShell V2 ile Başlatma

**Kullanım**:
```powershell
.\basla-v2.ps1
```

**Avantajlar**:
- ✅ PM2 komutları `-WindowStyle Hidden` ile çalışır
- ✅ Daha az pencere açılır

**Dezavantajlar**:
- ⚠️ Hala PM2 daemon penceresi kısa süreli görünebilir

---

### YÖNTEM 3: Manuel PM2 Daemon Başlatma

PM2 daemon'u önceden başlatıp, servisleri sessizce eklemek:

```powershell
# 1. PM2 daemon'u bir kez başlat (pencere açılacak ama sonra kapanacak)
pm2 ping

# 2. Servisleri ekle (artık yeni pencere açılmaz)
pm2 start ecosystem.config.cjs
```

---

### YÖNTEM 4: Tam Manuel Başlatma (Pencere Garantisi Yok)

PM2 yerine doğrudan başlatma:

**Terminal 1 - Web-Next**:
```powershell
cd apps\web-next
pnpm dev -- -p 3003
```

**Terminal 2 - Executor**:
```powershell
cd services\executor
pnpm dev
```

**Avantajlar**:
- ✅ PM2 yok, dolayısıyla PM2 daemon penceresi yok
- ✅ Tam kontrol

**Dezavantajlar**:
- ❌ 2 terminal penceresi açık kalır
- ❌ Auto-restart yok
- ❌ Log yönetimi yok

---

## 📋 DOSYA YAPISI

```
C:\dev\CursorGPT_IDE\
├── basla.ps1                 # Original (PM2 daemon penceresi açabilir)
├── basla-gorunmez.vbs        # ✅ ÖNERILEN: Tamamen görünmez
├── basla-v2.ps1              # Alternatif: Daha az pencere
├── durdur.ps1                # Servisleri durdur
├── executor-basla.ps1        # Sadece executor başlat
└── ecosystem.config.cjs      # PM2 config (windowsHide: true)
```

---

## 🎯 HANGİSİNİ KULLANMALIYIM?

### En İyi Deneyim İçin
```
👉 basla-gorunmez.vbs
```
- Çift tıkla, hiçbir pencere açılmaz
- 3 saniye bildirim gösterir
- PM2 arka planda çalışır

### PowerShell Kullanıcıları İçin
```powershell
👉 .\basla-v2.ps1
```
- Komut satırından çalışır
- Daha az pencere açar

### Sorun Devam Ederse
```powershell
# 1. PM2'yi bir kez başlat
pm2 ping

# 2. Sonra servisleri ekle
pm2 start ecosystem.config.cjs
```

### PM2 İstemiyorsanız
```
👉 Manuel başlatma (2 terminal)
```
- Her servis için ayrı terminal
- Hiçbir sürpriz yok

---

## 🔍 DURUM KONTROLÜ

```powershell
# PM2 servisleri
pm2 status

# Web-Next test
curl http://localhost:3003

# Executor test (manuel başlattıysanız)
curl http://localhost:4001/health
```

---

## 🛑 DURDURMA

```powershell
# PM2 ile başlattıysanız
.\durdur.ps1

# veya
pm2 delete all

# Manuel başlattıysanız
# Terminal pencerelerinde Ctrl+C
```

---

## ⚠️ PM2 DAEMON PENCERE SORUNU HAKKINDA

**Neden Oluyor?**
- Windows'ta PM2, daemon başlatırken bir node.exe process başlatır
- Bu process bazen görünür bir console penceresi oluşturur
- `windowsHide: true` sadece **uygulama** penceresini gizler, daemon'u değil

**Kalıcı Çözüm?**
- PM2'yi Windows Service olarak kurmak
- Veya VBScript gibi wrapper kullanmak
- Veya PM2 yerine alternatif (forever, nodemon vs.)

---

## 📞 DESTEK

Sorun devam ederse:
1. `basla-gorunmez.vbs` dosyasını deneyin (en güvenilir)
2. PM2 daemon'u önceden başlatıp servisleri ekleyin
3. Manuel başlatmayı tercih edin (2 terminal)

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

