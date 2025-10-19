# StrategyControls Smoke & Negatif Senaryo Testleri

**Tarih**: 2025-10-13  
**Bileşen**: `apps/web-next/src/components/dashboard/StrategyControls.tsx`  
**Proxy**: `/api/strategy/preview`, `/api/strategy/control`  
**Utility**: `apps/web-next/src/lib/net/fetchSafe.ts`

---

## Pozitif Senaryo (Executor Açık)

```powershell
# Terminal 1: Executor
pm2 start ecosystem.config.js --only spark-executor
# veya
docker-compose up -d executor

# Terminal 2: Web-next dev
pnpm -C apps/web-next dev --port 3003
```

**Adımlar**:
1. Dashboard → StrategyControls bileşenini içeren sayfa
2. **Preview butonu** → Modal açılır, dry-run sonucu JSON render
3. **Start (Onayla)** → `onResult` callback tetiklenir, auditId mesajı
4. **Stop (Onayla)** → status badge güncellenir

**Beklenen**:
- ✅ Modal açılır, `preview` objesinde `jobId`/`metrics` görünür
- ✅ `isPending=true` iken butonlar disabled
- ✅ `aria-busy="true"` aktif
- ✅ Hata yoksa `err` undefined kalır

---

## Negatif Senaryo Matrisi

| Durum | HTTP Status | UI Davranışı | Beklenen |
|-------|-------------|--------------|----------|
| **Executor Kapalı** | 0 (timeout/abort) | `_err: "unknown"` | Modal içinde hata mesajı, sayfa çökmez |
| **401/403 RBAC** | 200 + `{_err:"unauthorized"}` | `err` state set | Toast: "Yetki yok" (gelecek PR) |
| **422 Validation** | 200 + `{_err:"param invalid"}` | `err` state set | Butonlar re-enable, hata gösterilir |
| **429 Ratelimit** | 200 + `{_err:...}` + `Retry-After: 30` | Proxy header aktarır | UI tooltip/disable (gelecek PR) |
| **500 Executor İç** | 200 + `{_err:"internal"}` | `err` state set | ErrorBoundary tetiklenmez, graceful |
| **Timeout (3.5s)** | 0 (abort) | `_err: "aborted"` | Retry 2x (jitter), sonra fallback |

---

## Manuel Test Komutları

### 1. Executor Kapalı (Timeout)
```powershell
# Executor'u durdur
pm2 stop spark-executor
# veya
docker-compose stop executor

# UI'da Preview → Modal açılır, `_err` görünür, sayfa çökmez
```

### 2. 429 Simülasyonu (Mock Proxy)
```typescript
// apps/web-next/src/app/api/strategy/preview/route.ts (geçici test için)
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { _err: "rate_limit_exceeded" },
    { status: 200, headers: { "Retry-After": "30" } }
  );
}
```

### 3. Schema Drift (Beklenmeyen Alan)
```typescript
// Executor yanıtı: { metrics: { unknown_field: 123 } }
// UI: _err yoksa render eder, zod olsaydı catch'lerdi
```

---

## Tutarlılık Kontrol Listesi

- [x] **CSR-only**: `"use client"` mevcut, SSR çağrısı yok
- [x] **Timeout+Retry**: 3.5s timeout, 2 retry, jitter (200ms base)
- [x] **Telemetri**: `X-Spark-Actor: ui`, `x-trace-id` her istekte
- [x] **Erişilebilirlik**: `aria-busy`, `aria-live="assertive"/"polite"`
- [x] **Proxy graceful**: Her durumda 200 + `_err` field
- [x] **Retry-After**: Header aktarımı mevcut (UI toast eksik)
- [ ] **Zod parse**: Opsiyonel, gelecek PR'da eklenebilir
- [ ] **Toast UX**: Retry-After geri sayım, gelecek PR

---

## Kısa Vadeli TODO (Sonraki PR)

1. **Toast entegrasyonu**: `shadcn/ui toast` veya basit snackbar
2. **Retry-After UX**: Buton disable + tooltip "Retry in 30s..."
3. **Zod schema**: `PreviewResp`/`ControlResp` min schema
4. **RecentActions audit**: Başarılı/hatalı çağrılardan `pushAudit`
5. **Optimistic UI**: Start sonrası ActiveStrategiesWidget 2s poll

---

## Risk Notları

- **Schema drift**: Normalize katmanı korumalı, ama zod ile fail-fast önerilen
- **RBAC confirm**: `confirm_required:true` gelirse zorunlu onay modalı tetiklemeli
- **Idempotency**: Şu an `isPending` ile çift tıklama engelleniyor, yeterli
- **WebSocket**: Uzun işlemler için WS progress stream (uzun vade)

---

## JSON Aksiyon Taslakları (Komut Paleti)

```json
{
  "action": "strategy/preview",
  "params": {
    "strategyId": "rsi-scalp",
    "symbol": "BTCUSDT",
    "timeframe": "1h"
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "Preview via UI proxy"
}
```

```json
{
  "action": "strategy/control",
  "params": {
    "action": "start",
    "strategyId": "rsi-scalp",
    "symbol": "BTCUSDT",
    "timeframe": "1h"
  },
  "dryRun": false,
  "confirm_required": true,
  "reason": "Start strategy (requires confirm)"
}
```

---

## Kapanış

✅ StrategyControls artık Markets/Canary ile aynı güvenlik çizgisinde  
✅ SSR-safe, timeout+retry, graceful fallback  
⏭️ Sonraki: Toast, Zod, RecentActions audit, Guardrails entegrasyonu

