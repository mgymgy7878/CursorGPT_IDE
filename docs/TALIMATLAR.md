# Operasyon Talimatları ve Güvenlik Kuralları — AI Copilot

## Başlatma
```powershell
# Executor
pnpm --filter @spark/executor dev
# Web (port sabitlenmiş öneri)
$env:PORT='3003'; $env:PORT_MAX='3003'; pnpm --filter web-next dev
# Tek komut (filter sorununda ayrı ayrı çalıştırın)
pnpm run dev:both
```

## Sağlık ve Smoke
```powershell
iwr -UseBasicParsing http://127.0.0.1:4001/healthz
iwr -UseBasicParsing http://127.0.0.1:3003/api/public/healthz
pnpm run release:smoke
```

## ENV
- Web: `EXECUTOR_ORIGIN` veya `EXECUTOR_BASE`
- Executor: `FUSION_ONLINE_CACHE_SNAPSHOT`, `RISK_REPORT_DIR`

## Proxy/SSE Politikası
- Proxy POST-only; Prometheus metrikleri `GET` ile okunur.
- SSE passthrough: `no-cache`/`keep-alive`/`abort` zinciri korunur.

## RBAC ve Aksiyon Onayı
- Varsayılan `allowWrite=false` (dry-run). Yazma işlemleri: RBAC + çift onay.
- Audit zorunlu: `{who, when, params, dryRun, allowWrite}` kaydı tutulur.

## Rate-Limit
- Tool çağrıları token-bucket ile sınırlandırılır; 429 → `retry-after` + `retryAfterMs`.

## İzleme Metrikleri
- `ai_chat_ms_summary` (p50/p95), `ai_tool_calls_total{tool}`, `ai_denied_total`.

## Rollback
- Shadow/candidate kapat: `model.candidate = null`
- Eşik/Rate-limit’i muhafazakâr seviyeye çek; gerekli ise önceki tag’a dön.

## Notlar
- EN dokümanlar istenirse `-EN.md` olarak eklenebilir. 