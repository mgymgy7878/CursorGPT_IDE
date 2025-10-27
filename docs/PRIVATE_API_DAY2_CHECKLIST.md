# PRIVATE-API DAY-2 TASK CHECKLIST

## 🎯 DAY-2 Hedefleri
- Gerçek Binance Testnet entegrasyonu
- Guarded Write doğrulaması
- UI Control Page geliştirmesi
- Soak plan hazırlığı

## 📋 TASK 1: Binance Testnet Entegrasyonu

### 1.1 Environment Setup
```bash
# .env.local dosyasına ekle:
BINANCE_API_BASE=https://testnet.binance.vision
BINANCE_API_KEY=your_testnet_api_key_here
BINANCE_API_SECRET=your_testnet_secret_key_here
TRADE_MODE=testnet
LIVE_ENABLED=false
```

### 1.2 Secret Guard Test
```bash
# Test: Secret Guard'ın API key'leri engellediğini doğrula
git add .env.local
git commit -m "test"  # Bu hata vermeli
```

### 1.3 Testnet Health Check
```bash
# PowerShell
Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/private/health" -UseBasicParsing
# Beklenen: {"ok":true,"adapter":"binance","mode":"testnet"}
```

## 📋 TASK 2: Guarded Write Doğrulaması

### 2.1 Testnet Order Placement
```bash
# Küçük miktarda test order
$body = @{
    symbol = "BTCUSDT"
    side = "BUY"
    type = "MARKET"
    quantity = "0.0001"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/private/order" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

### 2.2 Order Cancellation Test
```bash
# Önce order oluştur, sonra cancel et
Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/private/order?symbol=BTCUSDT&orderId=12345" -Method DELETE -UseBasicParsing
```

### 2.3 HMAC Fail Senaryoları
```bash
# Yanlış API key ile test
# .env.local'da BINANCE_API_KEY'yi değiştir
# Beklenen: spark_private_errors_total artışı
```

## 📋 TASK 3: UI Control Page Geliştirmesi

### 3.1 Open Orders Tablosu
```typescript
// apps/web-next/app/control/page.tsx'e ekle:
const [openOrders, setOpenOrders] = useState([]);

// useEffect'te:
fetch('/api/private/open-orders')
  .then(res => res.json())
  .then(data => setOpenOrders(data.data || []));
```

### 3.2 Testnet Order Formu
```typescript
// Sadece testnet modunda görünür
{privateApiStatus?.mode === 'testnet' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h3 className="text-lg font-semibold text-yellow-800">Testnet Order</h3>
    {/* Order form */}
  </div>
)}
```

### 3.3 Rozet Güncellemesi
```typescript
// MOCK → TESTNET geçişini canlı kontrol
// Her 30 saniyede bir /api/private/health çağır
```

## 📋 TASK 4: Soak Plan Hazırlığı

### 4.1 Canary Test Script
```bash
# runtime/private_api_canary.cmd
@echo off
setlocal
set E=http://127.0.0.1:4001
set LOG=runtime/logs/private_canary_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.log

echo === PRIVATE API CANARY TEST === >> %LOG%
echo Timestamp: %date% %time% >> %LOG%

REM Health check
for /f %%A in ('curl -s -o nul -w "%%{http_code}" %E%/api/private/health') do set HEALTH=%%A
echo Health: %HEALTH% >> %LOG%

REM Account check
for /f %%A in ('curl -s -o nul -w "%%{http_code}" %E%/api/private/account') do set ACCOUNT=%%A
echo Account: %ACCOUNT% >> %LOG%

REM Small order test (if testnet)
if "%HEALTH%"=="200" (
  curl -s -X POST %E%/api/private/order -H "Content-Type: application/json" -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"quantity\":\"0.0001\"}" >> %LOG%
)

echo === CANARY COMPLETE === >> %LOG%
```

### 4.2 PnL Karşılaştırma
```bash
# Paper vs Testnet karşılaştırması
curl -s "http://127.0.0.1:4001/api/paper/account" > runtime/logs/paper_account.json
curl -s "http://127.0.0.1:4001/api/private/account" > runtime/logs/testnet_account.json
```

## 📋 TASK 5: Kanıt Dosyaları

### 5.1 Testnet Smoke Test
```bash
# runtime/private_api_testnet.cmd
@echo off
setlocal
set E=http://127.0.0.1:4001
set LOG=runtime/logs/private_testnet_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.log

echo === PRIVATE API TESTNET SMOKE === >> %LOG%
echo Timestamp: %date% %time% >> %LOG%

REM Health check
for /f %%A in ('curl -s -o nul -w "%%{http_code}" %E%/api/private/health') do set HEALTH=%%A
echo Health: %HEALTH% >> %LOG%

REM Account check
for /f %%A in ('curl -s -o nul -w "%%{http_code}" %E%/api/private/account') do set ACCOUNT=%%A
echo Account: %ACCOUNT% >> %LOG%

REM Open orders check
for /f %%A in ('curl -s -o nul -w "%%{http_code}" %E%/api/private/open-orders') do set ORDERS=%%A
echo Open Orders: %ORDERS% >> %LOG%

REM Order placement test
curl -s -X POST %E%/api/private/order -H "Content-Type: application/json" -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"quantity\":\"0.0001\"}" >> %LOG%

echo === TESTNET SMOKE COMPLETE === >> %LOG%
echo SUMMARY: Health=%HEALTH% Account=%ACCOUNT% Orders=%ORDERS%
```

### 5.2 Log Dizini Yapısı
```
runtime/logs/
├── private_testnet_20250816_1400.log
├── private_canary_20250816_1400.log
├── paper_account.json
└── testnet_account.json
```

## 🎯 BAŞARI KRİTERLERİ

### ✅ DAY-2 Tamamlanma Kriterleri:
1. **Testnet Health**: 200 OK, mode: "testnet"
2. **Order Placement**: Küçük miktarda başarılı order
3. **Order Cancellation**: Başarılı cancel
4. **UI Updates**: Open orders tablosu + testnet formu
5. **Metrics**: spark_private_errors_total artışı (HMAC fail)
6. **Logs**: runtime/logs/ altında kanıt dosyaları

### 🔍 DOĞRULAMA KOMUTLARI:
```bash
# 1. Testnet health
Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/private/health" -UseBasicParsing

# 2. Account balance
Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/private/account" -UseBasicParsing

# 3. Open orders
Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/private/open-orders" -UseBasicParsing

# 4. Order placement
$body = @{symbol="BTCUSDT";side="BUY";type="MARKET";quantity="0.0001"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/private/order" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing

# 5. Metrics check
Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/public/metrics/prom" -UseBasicParsing | Select-String "spark_private"
```

## 🚀 SONRAKI ADIMLAR (DAY-3)
- Canary deployment (48h soak test)
- Paper vs Testnet PnL karşılaştırması
- Production readiness checklist
- Documentation güncellemesi

---
**HEALTH TARGET**: GREEN + TESTNET ACTIVE 