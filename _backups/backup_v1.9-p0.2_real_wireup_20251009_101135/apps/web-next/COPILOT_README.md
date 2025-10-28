# Copilot AI - Usage Guide

## Overview

Copilot, Spark Trading Platform için doğal dil tabanlı yönetim arayüzüdür. Sistem sağlığı, metrikler, emirler ve pozisyonları izler, strateji yönetimi ve risk kontrolü yapar.

---

## Features

### 1. Floating Dock
- Sağ altta **floating buton** (🤖)
- Aç/kapa ile mesajlaşma paneli
- Live status badge (🟢/🟡/🔴)
- Quick action butonları

### 2. Tam Ekran Görünüm
- `/copilot` sayfası
- Slash komutları referansı
- Geniş mesaj listesi
- Detaylı komut dokümantasyonu

### 3. SSE Real-time Updates
- 10s periyodik snapshot'lar
- Health, metrics, orders, positions
- Event mesajları (📊 Status güncellendi)

---

## Slash Commands

### Read-Only (Herkes)

#### `/health`
Sistem sağlık durumu
```
/health
```

#### `/metrics`
Performans metrikleri (P95, error rate, PSI, match rate)
```
/metrics
```

#### `/orders`
Açık emirler listesi
```
/orders
```

#### `/positions`
Açık pozisyonlar listesi
```
/positions
```

#### `/backtest`
Backtest çalıştır (dry-run)
```
/backtest btcusdt 15m sma:10,20
/backtest ethusdt 1h rsi:14,30,70
```

---

### Protected (ADMIN_TOKEN Gerekli)

#### `/stop`
Strateji durdur
```
/stop strat meanrev-01
```

#### `/start`
Strateji başlat
```
/start strat meanrev-01
```

#### `/closeall`
Tüm pozisyonları kapat (tehlikeli)
```
/closeall
```

---

## RBAC (Role-Based Access Control)

### Admin Token Setup

1. **Generate Token**:
```bash
openssl rand -hex 32
```

2. **Set ENV**:
```env
ADMIN_TOKEN=your-generated-token
```

3. **UI'de Set**:
```javascript
localStorage.setItem('admin-token', 'your-generated-token');
```

### Access Levels

| Action | Read-Only | Admin |
|--------|-----------|-------|
| Health, Metrics | ✅ | ✅ |
| Orders, Positions | ✅ | ✅ |
| Backtest (dry) | ✅ | ✅ |
| Stop/Start Strategy | ❌ | ✅ (confirm) |
| Close Positions | ❌ | ✅ (confirm) |
| Model Promote | ❌ | ✅ (confirm) |
| Threshold Change | ❌ | ✅ (confirm) |

---

## Policy Guard

### Dry-Run Varsayılan
Tüm yazma aksiyonları **dryRun=true** ile başlar:
- Sonuç önizlemesi gösterilir
- "CONFIRM NEEDED" mesajı
- Gerçek değişiklik yapılmaz

### Confirm Flow
1. Korunan komut gönder → `dryRun=true`
2. Copilot dry-run sonucu gösterir
3. Kullanıcı onaylarsa → `dryRun=false` ile tekrar gönder
4. ADMIN_TOKEN kontrolü
5. Gerçek aksiyon yürütülür

### Action JSON Schema
```typescript
{
  "action": "strategy/stop",
  "params": { "strategyId": "meanrev-01" },
  "dryRun": true,
  "confirm_required": true,
  "reason": "pause strategy"
}
```

---

## Audit Logging

Tüm aksiyonlar `logs/audit/copilot_YYYYMMDD.log` dosyasına yazılır:

```json
{
  "timestamp": "2025-10-08T12:00:00.000Z",
  "action": "strategy/stop",
  "params": { "strategyId": "meanrev-01" },
  "dryRun": true,
  "hasToken": true,
  "result": "success"
}
```

---

## Prometheus Metrics

Copilot aktivitesi için metrikler:
- `spark_private_calls_total{endpoint="copilot_chat",verb="POST"}`
- `spark_private_calls_total{endpoint="copilot_action",verb="POST"}`
- `ai_generate_total{source="copilot"}`

---

## API Endpoints

### POST /api/copilot/chat
Doğal dil mesajları (executor /ai/chat'e proxy)

**Request**:
```json
{
  "message": "Sistem durumu nasıl?"
}
```

**Response**:
```json
{
  "response": "Tüm servisler çalışıyor. P95 gecikme 3ms."
}
```

---

### POST /api/copilot/action
Slash komut aksiyonları (policy guard + executor fan-out)

**Request**:
```json
{
  "action": "strategy/stop",
  "params": { "strategyId": "meanrev-01" },
  "dryRun": true,
  "confirm_required": true,
  "reason": "pause strategy"
}
```

**Response** (Dry-Run):
```json
{
  "success": true,
  "needsConfirm": true,
  "dryRunResult": {
    "strategyId": "meanrev-01",
    "currentState": "running",
    "targetState": "paused",
    "affectedOrders": 2,
    "preview": "2 emir iptal edilecek"
  },
  "message": "Dry run complete. Send with dryRun=false to apply."
}
```

---

### GET /api/copilot/stream
SSE akışı (10s snapshot)

**Events**:
- `connected`: İlk bağlantı
- `status`: Periyodik snapshot

**Snapshot Data**:
```json
{
  "health": "healthy",
  "metrics": {
    "p95_ms": 3,
    "error_rate": 0.3,
    "psi": 1.25,
    "match_rate": 98.5
  },
  "openOrders": 5,
  "positions": 2,
  "timestamp": 1696723200000
}
```

---

## Development

### Run Locally
```bash
# Backend
cd C:\dev\CursorGPT_IDE
docker-compose up -d

# Frontend
cd apps\web-next
pnpm dev
```

### Access
- UI: http://localhost:3003/dashboard
- Copilot: Click floating button (bottom-right)
- Full-screen: http://localhost:3003/copilot

---

## Smoke Test

### 1. UI Açılışı
```bash
# Dashboard'a git
http://localhost:3003/dashboard

# Sağ altta Copilot butonu görünmeli (🤖)
```

### 2. Okuma Komutları
```
/health → 🟢 healthy
/metrics → P95: 3ms, Error: 0.3%
/orders → 5 açık emir
/positions → 2 açık pozisyon
```

### 3. Yazma Komutları (No Token)
```
/stop strat meanrev-01 → ❌ ADMIN_TOKEN required
```

### 4. Yazma Komutları (With Token)
```javascript
localStorage.setItem('admin-token', 'your-token');
```
```
/stop strat meanrev-01 → ⚠️ Dry-run sonucu + "CONFIRM NEEDED"
```

### 5. SSE Akışı
```
60 saniye bekle → Event mesajları gelmeye devam etmeli
```

### 6. Audit Log
```bash
cat apps\web-next\logs\audit\copilot_20251008.log
# 5+ satır JSON görülmeli
```

---

## Troubleshooting

### Copilot Açılmıyor
- Browser console'da hata var mı?
- `pnpm typecheck` çalıştır
- React 19 + Next.js 15 uyumlu mu?

### SSE Bağlanmıyor
- Backend çalışıyor mu? (`curl http://127.0.0.1:4001/health`)
- Browser EventSource desteği var mı?
- CORS ayarları doğru mu?

### ADMIN_TOKEN Çalışmıyor
- `.env.local` dosyası mevcut mu?
- `ADMIN_TOKEN` set edilmiş mi?
- localStorage'de token doğru mu?
- Timing-safe comparison çalışıyor mu?

### Audit Log Yazılmıyor
- `logs/audit/` dizini var mı?
- Write permissions doğru mu?
- Node.js fs modülü çalışıyor mu?

---

## Future Enhancements (v1.9-p1+)

### Strategy Bot
- Ayrı agent (apps/web-next/src/app/(dashboard)/strategy-bot/page.tsx)
- Doğal dil ile strateji taslağı
- Parametre optimizasyonu
- Backtest ve canary deployment

### Advanced Features
- Multi-turn conversation memory
- Context-aware suggestions
- Voice input (Web Speech API)
- Mobile app (React Native)

---

**Version**: v1.9-p0  
**Last Updated**: 2025-10-08  
**Status**: MVP Complete ✅

