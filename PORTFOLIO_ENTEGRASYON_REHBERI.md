# Portfolio Entegrasyon Rehberi

**Tarih**: 10 Ekim 2025  
**cursor (Claude 3.5 Sonnet)**

---

## 📋 YAPILAN DEĞİŞİKLİKLER

### 1. Exchange Connector'ları Genişletildi

#### Binance Connector (`services/executor/src/connectors/binance.ts`)
```typescript
// Yeni fonksiyonlar eklendi:
export async function getAccountBalances()      // Hesap bakiyelerini çeker
export async function getTickerPrice(symbol)    // Belirli sembol fiyatı
export async function getAllTickerPrices()      // Tüm sembol fiyatları
```

#### BTCTurk Connector (`services/executor/src/connectors/btcturk.ts`)
```typescript
// Yeni fonksiyonlar eklendi:
export async function getAccountBalances()      // Hesap bakiyelerini çeker
export async function getAllTickers()           // Tüm ticker fiyatları
export async function getTicker(pairSymbol)     // Belirli sembol için ticker
```

---

### 2. Portfolio Service Oluşturuldu

**Dosya**: `services/executor/src/services/portfolioService.ts`

**Özellikler**:
- ✅ Binance ve BTCTurk'ten gerçek bakiye verileri çeker
- ✅ Tüm asset'leri USD değerine çevirir
- ✅ Fiyat verileri ile birleştirilmiş portföy görünümü
- ✅ Hata durumunda graceful fallback
- ✅ Paralel API çağrıları (performans optimizasyonu)

**Ana Fonksiyon**:
```typescript
export async function fetchAllPortfolios(): Promise<PortfolioResponse>
```

---

### 3. Portfolio Plugin Güncellendi

**Dosya**: `services/executor/src/portfolio.ts`

**Yeni Endpoint**:
```
GET /api/portfolio
```

**Response Format**:
```json
{
  "accounts": [
    {
      "exchange": "binance",
      "currency": "USD",
      "totals": { "totalUsd": 45000 },
      "balances": [
        {
          "asset": "BTC",
          "amount": 0.5,
          "priceUsd": 65000,
          "valueUsd": 32500
        }
      ]
    }
  ],
  "updatedAt": "2025-10-10T12:00:00Z"
}
```

---

### 4. Type Definitions Eklendi

**Dosya**: `services/executor/src/types/portfolio.ts`

```typescript
export interface PortfolioResponse {
  accounts: PortfolioAccount[];
  updatedAt: string;
}

export interface PortfolioAccount {
  exchange: ExchangeKind;
  currency: "USD" | "TRY";
  totals: { totalUsd: number; totalTry?: number };
  balances: AssetRow[];
}
```

---

## 🔧 KURULUM VE YAPLANDIRMA

### 1. Environment Variables

#### Executor Service İçin

**Konum**: `services/executor/.env` (yeni oluşturun)

```env
PORT=4001
HOST=0.0.0.0
NODE_ENV=development

# Binance API
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_secret
BINANCE_TESTNET=0
BINANCE_RECV_WINDOW=5000

# BTCTurk API
BTCTURK_API_KEY=your_btcturk_api_key
BTCTURK_API_SECRET_BASE64=your_btcturk_secret_base64

# Admin & Security
ADMIN_TOKEN=your_admin_token_here
```

#### Web-Next İçin

**Konum**: `apps/web-next/.env.local` (yeni oluşturun)

```env
# Executor service URL
EXECUTOR_BASE_URL=http://127.0.0.1:4001

# Public variables (browser'da erişilebilir)
NEXT_PUBLIC_EXECUTOR_BASE_URL=http://127.0.0.1:4001
NEXT_PUBLIC_ADMIN_ENABLED=true
```

---

### 2. API Key'leri Nasıl Alınır?

#### Binance
1. https://www.binance.com/en/my/settings/api-management adresine gidin
2. "Create API" butonuna tıklayın
3. API Key ve Secret Key'i kaydedin
4. **Önemli**: "Enable Reading" iznini aktifleştirin (trading için değil!)

#### BTCTurk
1. https://pro.btcturk.com/hesabim/api adresine gidin
2. Yeni API Key oluşturun
3. API Key ve Base64 Secret'ı kaydedin
4. **Önemli**: Sadece "Bakiye Görüntüleme" iznini verin

---

## 🚀 BAŞLATMA

### 1. Servisleri Başlat

```powershell
# Ana dizinde
cd C:\dev\CursorGPT_IDE

# Hazır betikle başlat (önerilen)
.\basla.ps1
```

Bu betik otomatik olarak:
- ✅ Web-Next'i port 3003'te başlatır
- ✅ Executor'ı port 4001'de başlatır
- ✅ Hiçbir ek pencere açmaz (background jobs)

### 2. Ayrı Ayrı Başlatma (Manuel)

```powershell
# Terminal 1 - Web-Next
cd apps\web-next
pnpm dev

# Terminal 2 - Executor
cd services\executor
pnpm dev
```

---

## 📊 ERİŞİM VE TEST

### Web Arayüzü

**Ana Sayfa**: http://localhost:3003  
**Portfolio Sayfası**: http://localhost:3003/portfolio

### API Test

```powershell
# Portfolio endpoint'ini test et
curl http://localhost:4001/api/portfolio

# Executor health check
curl http://localhost:4001/health
```

---

## 🔍 DOĞRULAMA

### 1. Servislerin Çalıştığını Kontrol Et

```powershell
# Job'ları listele
Get-Job

# Web-Next logları
Receive-Job -Name spark-web-next -Keep

# Executor logları
Receive-Job -Name spark-executor -Keep
```

### 2. Portfolio Verilerini Test Et

1. Tarayıcıda http://localhost:3003/portfolio adresine gidin
2. API key'leri doğru ayarlandıysa gerçek bakiyelerinizi göreceksiniz
3. Her 60 saniyede bir otomatik yenileme yapılır

---

## 🔄 VERI AKIŞI

```
┌─────────────────┐
│   Browser       │
│  (Portfolio UI) │
└────────┬────────┘
         │ GET /api/portfolio
         ▼
┌─────────────────┐
│   Next.js API   │
│   (Proxy)       │
└────────┬────────┘
         │ Proxy to http://127.0.0.1:4001
         ▼
┌─────────────────┐
│   Executor      │
│   Fastify       │
└────────┬────────┘
         │ portfolioPlugin
         ▼
┌─────────────────┐
│ Portfolio       │
│ Service         │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Binance │ │BTCTurk │
│ API    │ │  API   │
└────────┘ └────────┘
```

---

## ⚠️ GÜVENLİK NOTLARI

### API Key Güvenliği

1. ✅ **ASLA** API key'leri Git'e commit etmeyin
2. ✅ **SADECE** okuma (read-only) izinleri verin
3. ✅ API key'leri düzenli olarak rotate edin
4. ✅ IP whitelist kullanın (mümkünse)
5. ✅ `.env` dosyalarını `.gitignore`'a ekleyin

### Production Deployment

```bash
# Production'da güvenli environment management kullanın
# - Docker secrets
# - Kubernetes secrets
# - AWS Secrets Manager
# - Azure Key Vault
```

---

## 🐛 SORUN GİDERME

### Portfolio Görünmüyor / Mock Veriler Gösteriliyor

**Olası Sebepler**:
1. Executor servisi çalışmıyor
2. API key'ler doğru ayarlanmamış
3. EXECUTOR_BASE_URL yanlış

**Çözüm**:
```powershell
# 1. Executor'ı kontrol et
curl http://localhost:4001/health

# 2. API endpoint'ini test et
curl http://localhost:4001/api/portfolio

# 3. Environment variables'ı kontrol et
cd services\executor
type .env
```

### API Key Hataları

**Binance Hataları**:
```
binance_error: {"code": -2015, "msg": "Invalid API-key, IP, or permissions"}
```
**Çözüm**: API key'in doğru ve "Enable Reading" izninin aktif olduğundan emin olun

**BTCTurk Hataları**:
```
btcturk_error: Signature verification failed
```
**Çözüm**: Secret key'in Base64 formatında olduğundan emin olun

### Port Zaten Kullanımda

```powershell
# Port'u kullanan process'i bul ve kapat
netstat -ano | findstr :4001
taskkill /PID <process_id> /F
```

---

## 📈 YENİ ÖZELLİKLER

### Mevcut Özellikler (v1.9)
- ✅ Binance spot portfolio
- ✅ BTCTurk portfolio
- ✅ Multi-exchange görünümü
- ✅ USD/TRY çevrimleri
- ✅ Otomatik fiyat güncellemeleri
- ✅ Responsive tasarım

### Gelecek Özellikler (Roadmap)
- [ ] Binance Futures desteği
- [ ] Diğer exchange'ler (Kraken, Coinbase, vb.)
- [ ] Geçmiş veriler ve grafikler
- [ ] P/L takibi
- [ ] Portföy analiz ve öneriler
- [ ] Export/Import özellikleri

---

## 💾 BACKUP VE ROLLBACK

### Backup Oluşturma

```powershell
# Değişiklikleri commit et
git add .
git commit -m "Portfolio real data integration complete"

# Veya manuel backup
$date = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Recurse . "..\_backups\backup_portfolio_$date"
```

### Rollback

```powershell
# Git ile
git reset --hard HEAD~1

# Veya backup'tan geri yükle
```

---

## 📚 KAYNAKLAR

### API Dokümantasyonu
- **Binance Spot**: https://binance-docs.github.io/apidocs/spot/en/
- **BTCTurk**: https://docs.btcturk.com/

### İlgili Dosyalar
```
services/executor/src/
├── connectors/
│   ├── binance.ts          # Binance API wrapper
│   └── btcturk.ts          # BTCTurk API wrapper
├── services/
│   └── portfolioService.ts # Portfolio business logic
├── types/
│   └── portfolio.ts        # TypeScript definitions
└── portfolio.ts            # Fastify plugin & routes

apps/web-next/src/
├── app/
│   ├── api/portfolio/      # Next.js API route (proxy)
│   └── portfolio/          # Portfolio page
├── components/portfolio/   # UI components
└── types/portfolio.ts      # Frontend types
```

---

## ✅ TAMAMLANAN GÖREVLER

- ✅ Binance connector'a balance fonksiyonları eklendi
- ✅ BTCTurk connector'a balance fonksiyonları eklendi
- ✅ Portfolio service oluşturuldu
- ✅ Executor plugin güncellendi
- ✅ Type definitions tanımlandı
- ✅ Dokümantasyon hazırlandı

---

## 🔗 HIZLI KISAYOLLAR

### Komutlar (PowerShell)

#### Başlatma
```powershell
cd C:\dev\CursorGPT_IDE
.\basla.ps1                                    # Tüm servisleri başlat
.\durdur.ps1                                   # Tüm servisleri durdur
.\executor-basla.ps1                           # Sadece executor'u başlat
```

#### Durum Kontrol
```powershell
Get-Job                                        # Job durumlarını göster
Get-Job | Where-Object { $_.Name -like "*spark*" } | Format-Table
netstat -ano | findstr ":3003"                 # Web-Next port kontrolü
netstat -ano | findstr ":4001"                 # Executor port kontrolü
```

#### Log Görüntüleme
```powershell
Receive-Job -Name spark-web-next -Keep         # Web-Next logları
Receive-Job -Name spark-executor -Keep         # Executor logları
Receive-Job -Id 1 -Keep                        # ID ile log göster
```

#### API Test
```powershell
curl http://localhost:3003                     # Web-Next health
curl http://localhost:4001/health              # Executor health
curl http://localhost:4001/api/portfolio       # Portfolio API
curl http://localhost:4001/metrics             # Prometheus metrics
```

#### Port Temizleme
```powershell
# Port 3003
$pid = (netstat -ano | findstr ":3003" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($pid) { taskkill /PID $pid /F }

# Port 4001
$pid = (netstat -ano | findstr ":4001" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($pid) { taskkill /PID $pid /F }
```

---

### URL'ler (Tarayıcı)

#### Web Arayüzü
- **Ana Sayfa**: http://localhost:3003
- **Dashboard**: http://localhost:3003/dashboard
- **Portfolio**: http://localhost:3003/portfolio
- **Backtest**: http://localhost:3003/backtest
- **Strategy Lab**: http://localhost:3003/strategy-lab
- **Copilot**: http://localhost:3003/copilot
- **Admin Params**: http://localhost:3003/admin/params

#### API Endpoint'leri
- **Health Check**: http://localhost:4001/health
- **Portfolio API**: http://localhost:4001/api/portfolio
- **Metrics**: http://localhost:4001/metrics
- **Strategies**: http://localhost:4001/api/strategies

---

### Dosya Yolları (Hızlı Erişim)

#### Executor Servisi
```
services/executor/
├── src/
│   ├── connectors/
│   │   ├── binance.ts                    # Binance API wrapper
│   │   └── btcturk.ts                    # BTCTurk API wrapper
│   ├── services/
│   │   └── portfolioService.ts           # Portfolio business logic
│   ├── metrics/
│   │   └── portfolio.ts                  # Prometheus metrics
│   ├── types/
│   │   └── portfolio.ts                  # Type definitions
│   └── portfolio.ts                      # Fastify plugin
├── .env                                  # Environment variables (oluştur)
└── package.json
```

#### Web-Next Arayüzü
```
apps/web-next/
├── src/
│   ├── app/
│   │   ├── api/portfolio/route.ts        # Portfolio API proxy
│   │   └── portfolio/page.tsx            # Portfolio sayfası
│   ├── components/portfolio/
│   │   ├── AllocationDonut.tsx           # Pasta grafik
│   │   ├── ExchangeTabs.tsx              # Exchange seçici
│   │   ├── PortfolioTable.tsx            # Varlık tablosu
│   │   └── SummaryCards.tsx              # Özet kartlar
│   └── types/
│       └── portfolio.ts                  # Type definitions
├── .env.local                            # Environment variables (oluştur)
├── next.config.mjs                       # Next.js config
└── package.json
```

#### Konfigürasyon Dosyaları
```
C:\dev\CursorGPT_IDE\
├── .env.example                          # Environment şablonu
├── basla.ps1                             # Başlatma betiği
├── durdur.ps1                            # Durdurma betiği
├── ecosystem.config.cjs                  # PM2 config (kullanılmıyor)
├── package.json                          # Root package.json
└── pnpm-workspace.yaml                   # pnpm workspace config
```

---

### Environment Variables Şablonu

#### Executor (.env)
```env
# Kopyala yapıştır: services/executor/.env
PORT=4001
HOST=0.0.0.0
NODE_ENV=development

# Binance (opsiyonel)
BINANCE_API_KEY=
BINANCE_API_SECRET=
BINANCE_TESTNET=0

# BTCTurk (opsiyonel)
BTCTURK_API_KEY=
BTCTURK_API_SECRET_BASE64=

# Admin
ADMIN_TOKEN=
```

#### Web-Next (.env.local)
```env
# Kopyala yapıştır: apps/web-next/.env.local
EXECUTOR_BASE_URL=http://127.0.0.1:4001
NEXT_PUBLIC_EXECUTOR_BASE_URL=http://127.0.0.1:4001
NEXT_PUBLIC_ADMIN_ENABLED=true
```

---

### Git Komutları

```powershell
# Değişiklikleri görüntüle
git status
git diff

# Commit oluştur
git add .
git commit -m "Portfolio gerçek veri entegrasyonu"

# Backup oluştur (git-free)
$date = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Recurse C:\dev\CursorGPT_IDE "C:\dev\_backups\backup_$date"
```

---

### Sorun Giderme Komutları

#### Servisler Başlamıyor
```powershell
# 1. Mevcut servisleri durdur
.\durdur.ps1

# 2. Portları temizle
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force

# 3. Yeniden başlat
.\basla.ps1
```

#### API Key Test
```powershell
# Binance
curl "https://api.binance.com/api/v3/account" -H "X-MBX-APIKEY: YOUR_KEY"

# BTCTurk
# (Signature gerekli, connector üzerinden test et)
```

#### Log Dosyası Temizleme
```powershell
# Executor logları
Remove-Item services\executor\logs\*.log -Force

# Evidence cache
Remove-Item evidence\cache\* -Recurse -Force
```

---

### Prometheus Query Örnekleri

```promql
# Portfolio refresh latency (p95)
histogram_quantile(0.95, rate(spark_portfolio_refresh_latency_ms_bucket[5m]))

# API error rate
rate(spark_exchange_api_error_total[5m])

# Total portfolio value
sum(spark_portfolio_total_value_usd)

# Asset count by exchange
spark_portfolio_asset_count

# Stale data detection
time() - spark_portfolio_last_update_timestamp > 300
```

---

### İlgili Dokümantasyon

- `README.md` - Genel proje bilgisi
- `TERMINAL_SORUNU_COZUM_RAPORU.md` - Başlatma sorunları çözümleri
- `PORTFOLIO_GERCEK_VERI_ENTEGRASYONU_TAMAMLANDI.md` - Entegrasyon özeti
- `SONRAKI_SPRINT_PLANI.md` - Gelecek özellikler ve roadmap

---

### API Dokümantasyon Linkleri

- **Binance API**: https://binance-docs.github.io/apidocs/spot/en/
- **BTCTurk API**: https://docs.btcturk.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Fastify Docs**: https://www.fastify.io/docs/
- **Prometheus**: https://prometheus.io/docs/

---

### Acil Durum Kurtarma

```powershell
# Tüm Node.js process'lerini durdur
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Tüm job'ları temizle
Get-Job | Remove-Job -Force

# Port'ları temizle (3003, 4001)
@(3003, 4001) | ForEach-Object {
    $port = $_
    netstat -ano | findstr ":$port" | ForEach-Object {
        $pid = ($_ -split '\s+')[-1]
        if ($pid -match '^\d+$') {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

# Cache temizle
Remove-Item node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item apps\web-next\.next -Recurse -Force -ErrorAction SilentlyContinue

# Yeniden başlat
.\basla.ps1
```

---

## 📊 GRAFANA DASHBOARD VE PROMETHEUS ALERTS

### Monitoring Stack Kurulumu

Portfolio gerçek veri entegrasyonu tamamlandıktan sonra **Grafana Dashboard** ve **Prometheus Alert** kuralları eklendi.

#### Bileşenler
- **Prometheus** (Port 9090): Metrics toplama ve alert evaluation
- **Grafana** (Port 3005): Dashboard ve görselleştirme  
- **Executor** (Port 4001/metrics): Metrics kaynağı

---

### Hızlı Başlatma

```powershell
# Docker Compose ile monitoring stack'i başlat
cd C:\dev\CursorGPT_IDE
docker compose up -d prometheus grafana

# Executor'ı başlat (metrics source)
.\basla.ps1

# Grafana'ya eriş
# http://localhost:3005 (admin/admin)
```

---

### Dashboard Panelleri

**5 ana panel**:
1. **Portfolio Refresh Latency (p50/p95)** - Hedef: p95 < 1500ms
2. **Exchange API Error Rate** - Hedef: < 0.01 error/s
3. **Total Portfolio Value (USD)** - Hedef: Stabil trend
4. **Data Staleness** - Hedef: < 60 saniye
5. **Asset Count** - Hedef: > 0 asset

---

### Prometheus Alert Kuralları

**5 adet alert tanımlı**:

```yaml
1. PortfolioRefreshLatencyHighP95
   - Threshold: p95 > 1500ms (5 dakika)
   - Severity: warning

2. ExchangeApiErrorRateHigh
   - Threshold: > 0.05 errors/s (3 dakika)
   - Severity: critical

3. PortfolioDataStale
   - Threshold: > 300 seconds (2 dakika)
   - Severity: warning

4. PortfolioValueDropAnomaly
   - Threshold: 5 dakikada %10 düşüş (1 dakika)
   - Severity: warning

5. PortfolioNoAssets
   - Threshold: Asset count < 1 (5 dakika)
   - Severity: warning
```

---

### Smoke Test (Doğrulama)

```powershell
# 1. Prometheus health
curl http://localhost:9090/-/healthy

# 2. Executor metrics
curl http://localhost:4001/metrics | Select-String "spark_portfolio"

# 3. Prometheus targets
# Tarayıcı: http://localhost:9090/targets

# 4. Grafana dashboard
# Tarayıcı: http://localhost:3005/dashboards
# "Spark" folder → "Spark • Portfolio Performance"
```

---

### Oluşturulan Dosyalar

```
monitoring/
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   └── prometheus.yaml          # Prometheus datasource
│       └── dashboards/
│           ├── dashboards.yaml          # Dashboard provisioning config
│           └── spark-portfolio.json     # Portfolio dashboard (5 panel)

prometheus/
├── prometheus.yml                       # Prometheus config (scrape + rules)
└── alerts/
    └── spark-portfolio.rules.yml       # 5 alert rule

docker-compose.yml                       # Prometheus + Grafana services

docs/monitoring/
└── GRAFANA_DASHBOARD.md                 # Detaylı dokümantasyon
```

---

### URL'ler

| Servis | URL | Açıklama |
|--------|-----|----------|
| Grafana | http://localhost:3005 | Dashboard (admin/admin) |
| Prometheus | http://localhost:9090 | Metrics & alerts |
| Prometheus Targets | http://localhost:9090/targets | Scrape targets |
| Prometheus Rules | http://localhost:9090/rules | Alert rules |
| Prometheus Alerts | http://localhost:9090/alerts | Active alerts |
| Executor Metrics | http://localhost:4001/metrics | Raw metrics |

---

### Prometheus Query Örnekleri

```promql
# Portfolio refresh latency p95
histogram_quantile(0.95, 
  sum by (le, exchange) (
    rate(spark_portfolio_refresh_latency_ms_bucket[5m])
  )
)

# Exchange API error rate
sum by (exchange, error_type) (
  rate(spark_exchange_api_error_total[5m])
)

# Total portfolio value
sum(spark_portfolio_total_value_usd)

# Data staleness
time() - spark_portfolio_last_update_timestamp

# Asset count
spark_portfolio_asset_count
```

---

### Detaylı Bilgi

Grafana dashboard yapılandırması, alert kuralları detayları, sorun giderme ve ileri düzey PromQL sorguları için:

📖 **Detaylı Dokümantasyon**: `docs/monitoring/GRAFANA_DASHBOARD.md`

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

