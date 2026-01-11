# Spark — Test Mode (Binance Testnet / Paper)

## Amaç
Spark platformunu test kullanımına hazırlamak: Binance Testnet modu + Strategy Lab + Copilot için minimum iskelet (config + UI rozet + order guard + doküman).

## Modlar

Spark platformu üç modda çalışabilir:

- **prod**: Production modu - gerçek borsa bağlantıları, gerçek işlemler
- **testnet**: Binance Testnet modu - testnet API'leri, testnet anahtarları
- **paper**: Paper trading modu - simüle edilmiş işlemler, gerçek veri akışı

## Environment Variables

### Spark Mode
```bash
# Server-side (build-time)
SPARK_MODE=testnet|paper|prod

# Client-side (build-time)
NEXT_PUBLIC_SPARK_MODE=testnet|paper|prod
```

### Exchange Configuration
```bash
# Exchange seçimi
EXCHANGE=binance|btcturk|bist

# Binance network (sadece Binance için)
BINANCE_NETWORK=testnet|mainnet
```

### Default Behavior
- **Development**: `NODE_ENV=development` → `testnet` (otomatik)
- **Production**: `NODE_ENV=production` → `prod` (otomatik, env var ile override edilebilir)

## UI Davranışı

### Top Status Bar
- **TESTNET rozeti**: Amber renk, "TESTNET" etiketi (prod'da görünmez)
- **PAPER rozeti**: Gri renk, "PAPER" etiketi (prod'da görünmez)
- Prod modunda rozet render edilmez

### Strategy Lab
- **Run/Backtest/Optimize**: Tüm modlarda serbest
- **Live Trade butonu**:
  - `prod`: Gerçek işlem butonu (confirm_required şart)
  - `testnet`/`paper`: "Simulated" etiketi ile gösterilir, gerçek işlem yapılmaz

## Güvenlik Kuralları

### Production Mode
- Order gönderme için `confirm_required` mekanizması zorunlu
- Mainnet API anahtarları kabul edilir
- Testnet anahtarları reddedilir (format guard)

### Testnet Mode
- Testnet API endpoint'leri zorunlu
- Testnet anahtarları kabul edilir
- Mainnet anahtarları reddedilir (format guard)
- Gerçek işlem yapılmaz

### Paper Mode
- Simüle edilmiş işlemler
- Gerçek API anahtarları gerekmez
- Gerçek veri akışı (WebSocket) kullanılır

## Order Guard (Executor)

Order placement handler'da mod kontrolü:

```typescript
// Pseudo-code
if (mode !== 'prod') {
  // testnet/paper route
  return simulateOrder(order);
}

if (mode === 'prod' && !confirmToken) {
  // 403 + audit log
  return { error: 'confirm_required', status: 403 };
}
```

## Smoke Test

### Environment Setup

**PowerShell (Windows):**
```powershell
$env:SPARK_MODE="testnet"
$env:NEXT_PUBLIC_SPARK_MODE="testnet"
pnpm --filter web-next dev
```

**CMD (Windows):**
```cmd
set SPARK_MODE=testnet
set NEXT_PUBLIC_SPARK_MODE=testnet
pnpm --filter web-next dev
```

**Not:** `NEXT_PUBLIC_*` değişkenleri build-time okunduğu için dev server'ı yeniden başlatmak gerekir.

### Automated Smoke Test

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-mode.ps1
```

**Evidence Package:**
- `evidence/smoke_summary.txt` - Tarih, sparkMode, baseUrl, interval, HTTP status
- `evidence/health_testnet.json` - Health endpoint response
- `evidence/klines_testnet_10.json` - Sample klines data

### Manual Typecheck/Build
```bash
pnpm -w --filter web-next typecheck
pnpm -w --filter web-next build
```

### UI Kontrol Checklist
- [ ] Top status bar'da TESTNET/PAPER rozeti görünüyor mu?
- [ ] Prod modunda rozet render edilmiyor mu?
- [ ] Health endpoint `sparkMode` döndürüyor mu?
- [ ] Strategy Lab'de mod uygun butonlar gösteriliyor mu?

## Sonraki Adımlar

1. **Strategy Lab Pipeline**: Backtest → Optimize → Paper Run hattını UI'da pipeline olarak göster
2. **Copilot Entegrasyonu**: Copilot'a `sparkMode`/`exchange`/`network` enjekte et
3. **Testnet API Entegrasyonu**: Binance Testnet API bağlantısı
4. **Paper Trading Engine**: Simüle edilmiş işlem motoru

## Kaynaklar
- Binance Testnet: https://testnet.binance.vision/
- Paper Trading Best Practices: https://www.investopedia.com/articles/trading/08/paper-trading.asp

