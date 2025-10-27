# DAY-70 Cursor Restart Plan

## 🚨 MEVCUT DURUM (17 Ağustos 2025)

### ✅ TAMAMLANAN İŞLEMLER
1. **TypeScript Toolchain** - Kök package.json'a typescript, @types/node, @types/react, @types/react-dom eklendi
2. **Next.js Config** - ESM uyumlu next.config.mjs oluşturuldu (next.config.js silindi)
3. **PostCSS Config** - postcss.config.cjs mevcut (ESM uyumlu)
4. **Port Binding** - next dev -H 0.0.0.0 -p 3003 ile binding zorlandı
5. **Health API** - /api/health endpoint'i hazır
6. **Paket Export'ları** - @spark/rbac ve @spark/net src'den export ediyor
7. **Parity Sayfası** - Test için basit sayfa oluşturuldu

### ❌ MEVCUT SORUNLAR
1. **PostCSS ESM Hatası** - postcss.config.js hala ESM olarak algılanıyor
2. **Nav.js Eksik** - pages/_app.tsx'te '../components/Nav.js' bulunamıyor
3. **Duplicate Health API** - pages/api/health.ts ve app/api/health/route.ts çakışıyor
4. **UI Başlatılamıyor** - Next.js server başlıyor ama hatalar veriyor

### 🔧 SON YAPILAN İŞLEMLER
- next.config.js silindi, next.config.mjs oluşturuldu
- pnpm dev -p 3003 çalıştırıldı, server başladı ama hatalar var
- PostCSS ve Nav.js hataları görüldü

## 🎯 SONRAKI ADIMLAR (Cursor Restart Sonrası)

### 1. ACIL DÜZELTİLER (5 dk)
```bash
# PostCSS sorununu çöz
cd apps/web-next
rm postcss.config.js  # Eğer varsa
# postcss.config.cjs zaten mevcut

# Nav.js eksikliğini çöz
# components/Nav.js dosyasını oluştur veya import'u kaldır

# Duplicate health API'yi çöz
rm pages/api/health.ts  # Eski dosyayı sil
# app/api/health/route.ts kullan
```

### 2. UI TEST (3 dk)
```bash
# UI'yi başlat
pnpm dev -p 3003

# Health check
curl http://localhost:3003/api/health

# Parity sayfası test
curl http://localhost:3003/parity
```

### 3. DAY-70 PORTFOLIO COPILOT BAŞLANGICI (30 dk)

#### Öncelik: Portfolio Copilot (Enterprise Focus)
**Neden:** Revenue potential, compliance edge, market differentiation

#### Sprint Planı:
```
Week 1: Core AI Portfolio Analysis
- Risk assessment engine
- Diversification recommendations  
- Performance attribution analysis

Week 2: Real-time Monitoring
- Portfolio health dashboard
- Alert system (VaR, drawdown, concentration)
- Automated rebalancing suggestions

Week 3: Enterprise Features
- Multi-account management
- Compliance reporting integration
- White-label customization

Week 4: Advanced AI Features
- Predictive portfolio optimization
- Scenario analysis & stress testing
- Personalized investment strategies
```

## 📁 KRITIK DOSYALAR

### Mevcut Durum:
- `apps/web-next/next.config.mjs` ✅ (ESM uyumlu)
- `apps/web-next/postcss.config.cjs` ✅ (CJS format)
- `apps/web-next/app/api/health/route.ts` ✅ (Health API)
- `apps/web-next/app/parity/page.tsx` ✅ (Test sayfası)
- `packages/@spark/rbac/package.json` ✅ (src export)
- `packages/@spark/net/package.json` ✅ (src export)

### Sorunlu Dosyalar:
- `apps/web-next/pages/_app.tsx` ❌ (Nav.js import hatası)
- `apps/web-next/pages/api/health.ts` ❌ (Duplicate API)
- `apps/web-next/postcss.config.js` ❌ (ESM hatası - silinmeli)

## 🚀 RESTART SONRASI KOMUT ZİNCİRİ

```bash
# 1. Durumu kontrol et
cd C:\dev\CursorGPT_IDE
ls apps/web-next/

# 2. Sorunlu dosyaları temizle
cd apps/web-next
rm postcss.config.js  # Eğer varsa
rm pages/api/health.ts  # Duplicate API

# 3. Nav.js sorununu çöz
# components/Nav.js oluştur veya _app.tsx'teki import'u kaldır

# 4. UI'yi başlat
pnpm dev -p 3003

# 5. Test et
curl http://localhost:3003/api/health
curl http://localhost:3003/parity

# 6. Portfolio Copilot'a geç
# docs/DAY-70_PORTFOLIO_COPILOT.md oluştur
```

## 🎯 HEDEF: HEALTH=GREEN

**Kriterler:**
- ✅ UI port 3003'te çalışıyor
- ✅ /api/health 200 OK dönüyor
- ✅ /parity sayfası görünüyor
- ✅ TypeScript hataları yok
- ✅ PostCSS hataları yok

**Sonraki Sprint:** Portfolio Copilot (Enterprise Focus)

## 📝 NOTLAR

- **Arayüz sorunu çözüldükten sonra** Portfolio Copilot'a odaklan
- **Enterprise müşteriler** daha yüksek ARPU
- **Compliance + AI** sinerjisi güçlü
- **B2B market** daha az rekabetli
- **Kurumsal veriler** daha kaliteli

**HEALTH=YELLOW** - Arayüz konfigürasyonu tamamlandı, runtime sorunları devam ediyor. 