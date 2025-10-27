# Spark Trading Platform - Hızlı Başlangıç Rehberi

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## 🚀 5 DAKİKADA BAŞLAT

### Adım 1: Servisleri Başlat
```powershell
cd C:\dev\CursorGPT_IDE
.\basla.ps1
```

### Adım 2: Tarayıcıda Aç
- **Ana Sayfa**: http://localhost:3003
- **Portfolio**: http://localhost:3003/portfolio

### Adım 3: API Key Ekle (Opsiyonel)
- Dosya oluştur: `services/executor/.env`
- API key'leri ekle (aşağıda detay)

**Bu kadar! Platform hazır.**

---

## 📋 KOMUT REFERANSI

### Temel Komutlar

| Komut | Açıklama |
|-------|----------|
| `.\basla.ps1` | Tüm servisleri başlat |
| `.\durdur.ps1` | Tüm servisleri durdur |
| `Get-Job` | Job durumlarını göster |
| `Receive-Job -Name spark-web-next -Keep` | Web-Next logları |
| `Receive-Job -Name spark-executor -Keep` | Executor logları |

### Test Komutları

| Komut | Beklenen Sonuç |
|-------|----------------|
| `curl http://localhost:3003` | HTML response |
| `curl http://localhost:4001/health` | `{"status":"ok"}` |
| `curl http://localhost:4001/api/portfolio` | JSON portfolio data |
| `curl http://localhost:4001/metrics` | Prometheus metrics |

---

## 🌐 URL REHBERİ

### Web Arayüzü

| Sayfa | URL |
|-------|-----|
| Ana Sayfa | http://localhost:3003 |
| Dashboard | http://localhost:3003/dashboard |
| Portfolio | http://localhost:3003/portfolio |
| Backtest | http://localhost:3003/backtest |
| Strategy Lab | http://localhost:3003/strategy-lab |
| Copilot | http://localhost:3003/copilot |
| Admin | http://localhost:3003/admin/params |

### API Endpoint'leri

| Endpoint | Açıklama |
|----------|----------|
| http://localhost:4001/health | Health check |
| http://localhost:4001/api/portfolio | Portfolio data |
| http://localhost:4001/api/strategies | Stratejiler |
| http://localhost:4001/metrics | Prometheus metrics |

---

## ⚙️ ENVIRONMENT VARIABLES

### Executor API Key'leri (Opsiyonel)

**Dosya**: `services/executor/.env`

```env
PORT=4001
NODE_ENV=development

# Binance (opsiyonel - yoksa mock veri)
BINANCE_API_KEY=your_key_here
BINANCE_API_SECRET=your_secret_here
BINANCE_TESTNET=0

# BTCTurk (opsiyonel - yoksa mock veri)
BTCTURK_API_KEY=your_key_here
BTCTURK_API_SECRET_BASE64=your_secret_base64_here
```

### Web-Next Konfigürasyonu

**Dosya**: `apps/web-next/.env.local`

```env
EXECUTOR_BASE_URL=http://127.0.0.1:4001
NEXT_PUBLIC_EXECUTOR_BASE_URL=http://127.0.0.1:4001
```

**Not**: API key'ler olmadan da çalışır (mock veri gösterilir).

---

## 🔑 API KEY NASIL ALINIR?

### Binance API Key

1. https://www.binance.com/en/my/settings/api-management
2. "Create API" → İsim belirle
3. **ÖNEMLİ**: Sadece "Enable Reading" seç
4. ❌ Trading/withdrawal izinleri verme!
5. API Key ve Secret'ı kopyala
6. `services/executor/.env` dosyasına yapıştır

### BTCTurk API Key

1. https://pro.btcturk.com/hesabim/api
2. "Yeni API Key" oluştur
3. **ÖNEMLİ**: Sadece "Bakiye Görüntüleme" seç
4. ❌ İşlem izinleri verme!
5. API Key ve Base64 Secret'ı kopyala
6. `services/executor/.env` dosyasına yapıştır

---

## 🐛 SORUN GİDERME

### Servisler Başlamıyor

```powershell
# 1. Durdur
.\durdur.ps1

# 2. Node process'lerini temizle
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force

# 3. Yeniden başlat
.\basla.ps1
```

### Port Zaten Kullanımda

```powershell
# Port 3003 temizle
netstat -ano | findstr ":3003"
# PID numarasını not et, sonra:
taskkill /PID <pid_numarasi> /F

# Port 4001 temizle
netstat -ano | findstr ":4001"
taskkill /PID <pid_numarasi> /F
```

### Portfolio Görünmüyor

```powershell
# 1. Executor'ın çalıştığını kontrol et
curl http://localhost:4001/health

# 2. Portfolio API'yi test et
curl http://localhost:4001/api/portfolio

# 3. Executor loglarını kontrol et
Receive-Job -Name spark-executor -Keep

# 4. Environment variables'ı kontrol et
cd services\executor
cat .env
```

### Cache Sorunları

```powershell
# Node modules cache temizle
Remove-Item node_modules\.cache -Recurse -Force

# Next.js build cache temizle
Remove-Item apps\web-next\.next -Recurse -Force

# Yeniden başlat
.\basla.ps1
```

---

## 🎯 DOĞRULAMA CHECKLİSTİ

### ✅ Başlatma Sonrası Kontroller

```powershell
# 1. Job'lar çalışıyor mu?
Get-Job
# Beklenen: 2 job (spark-web-next, spark-executor) - State: Running

# 2. Web-Next erişilebilir mi?
curl http://localhost:3003
# Beklenen: HTML yanıtı

# 3. Executor sağlıklı mı?
curl http://localhost:4001/health
# Beklenen: {"status":"ok"}

# 4. Portfolio API çalışıyor mu?
curl http://localhost:4001/api/portfolio
# Beklenen: JSON portfolio data (mock veya gerçek)

# 5. Metrics aktif mi?
curl http://localhost:4001/metrics
# Beklenen: Prometheus metrics output
```

### ✅ Tarayıcı Kontrolleri

1. **Ana Sayfa**: http://localhost:3003
   - ✅ Sayfa yükleniyor
   - ✅ Sidebar menü görünüyor
   - ✅ Dashboard kartları render oluyor

2. **Portfolio Sayfası**: http://localhost:3003/portfolio
   - ✅ Sayfa yükleniyor
   - ✅ Exchange tab'leri görünüyor
   - ✅ Varlık tablosu görünüyor (mock veya gerçek)
   - ✅ Pasta grafik render oluyor

---

## 📊 DURUM KONTROL KOMUTLARI

### Job Durumu

```powershell
# Tüm job'ları listele
Get-Job

# Sadece Spark job'larını listele
Get-Job | Where-Object { $_.Name -like "*spark*" }

# Detaylı görünüm
Get-Job | Format-Table -Property Id, Name, State, Location -AutoSize
```

### Port Kontrol

```powershell
# Port 3003 kullanımda mı?
netstat -ano | findstr ":3003"

# Port 4001 kullanımda mı?
netstat -ano | findstr ":4001"

# Her iki port
netstat -ano | findstr ":3003 :4001"
```

### Process Kontrol

```powershell
# Node process'leri
Get-Process node -ErrorAction SilentlyContinue

# Detaylı bilgi (CPU, Memory)
Get-Process node -ErrorAction SilentlyContinue | Format-Table -Property Id, CPU, PM, ProcessName -AutoSize
```

---

## 🔄 GÜNLÜK KULLANIM AKIŞI

### Sabah Rutini

```powershell
# 1. Proje dizinine git
cd C:\dev\CursorGPT_IDE

# 2. Servisleri başlat
.\basla.ps1

# 3. Tarayıcıda kontrol et
# http://localhost:3003

# 4. Çalışmaya başla!
```

### Akşam Rutini

```powershell
# 1. Değişiklikleri kaydet (opsiyonel)
git add .
git commit -m "Günün değişiklikleri"

# 2. Servisleri durdur
.\durdur.ps1

# 3. Bilgisayarı kapat veya başka işlere geç
```

---

## 💡 İPUÇLARI

### Hızlı Log Görüntüleme

```powershell
# Son 20 satır Web-Next log
Receive-Job -Name spark-web-next -Keep | Select-Object -Last 20

# Son 20 satır Executor log
Receive-Job -Name spark-executor -Keep | Select-Object -Last 20

# Log'ları dosyaya kaydet
Receive-Job -Name spark-executor -Keep > executor-log.txt
```

### Otomatik Refresh Devre Dışı

Portfolio sayfasında otomatik refresh her 60 saniyede bir çalışır.  
Devre dışı bırakmak için: `apps/web-next/src/app/portfolio/page.tsx`  
→ `refreshInterval: 60000` satırını yorum satırına al veya `0` yap.

### API Key Olmadan Kullanım

Platform API key'ler olmadan da çalışır:
- ✅ Web arayüzü açılır
- ✅ Mock portfolio verileri gösterilir
- ✅ Tüm özellikler test edilebilir
- ❌ Gerçek exchange verileri gelmez

---

## 📚 DETAYLI DOKÜMANTASYON

- **Genel Bilgi**: `README.md`
- **Portfolio Entegrasyonu**: `PORTFOLIO_ENTEGRASYON_REHBERI.md`
- **Tamamlanan İşler**: `PORTFOLIO_GERCEK_VERI_ENTEGRASYONU_TAMAMLANDI.md`
- **Terminal Sorunları**: `TERMINAL_SORUNU_COZUM_RAPORU.md`
- **Gelecek Özellikler**: `SONRAKI_SPRINT_PLANI.md`

---

## 🆘 YARDIM

### Sık Sorulan Sorular

**S: Servisler başlamıyor, ne yapmalıyım?**  
C: `.\durdur.ps1` çalıştır, portları temizle, `.\basla.ps1` ile yeniden başlat.

**S: Portfolio sayfası mock veri gösteriyor, neden?**  
C: API key'ler eksik veya hatalı. `services/executor/.env` dosyasını kontrol et.

**S: Executor loglarında hata var, nasıl görürüm?**  
C: `Receive-Job -Name spark-executor -Keep` komutuyla log'ları görebilirsin.

**S: API key'leri nereye koymalıyım?**  
C: `services/executor/.env` dosyasına (yoksa oluştur).

**S: Hangi portlar kullanılıyor?**  
C: Web-Next → 3003, Executor → 4001

---

## 🎉 BAŞARILI KURULUM

Eğer aşağıdaki kontroller başarılıysa, kurulum tamam:

- ✅ `Get-Job` → 2 job Running
- ✅ http://localhost:3003 → Sayfa açılıyor
- ✅ http://localhost:4001/health → `{"status":"ok"}`
- ✅ http://localhost:3003/portfolio → Portfolio sayfası yükleniyor

**Tebrikler! Spark Trading Platform kullanıma hazır.** 🚀

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

