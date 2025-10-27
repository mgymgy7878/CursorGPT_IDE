# Proje Planı — AI Copilot Entegrasyonu (v2.0.0+)

## Hedef
- Uygulama içi AI Copilot: sohbet + arka plan ajanları (Cursor benzeri).
- Modeller: Anthropic Claude + OpenAI, görev yollandırma ile.
- Güvenlik: @spark/rbac, POST-only proxy, onaylı (guarded) aksiyon.

## Mimari
- UI: Global ChatDock (her sayfada), `/ai` tam sayfa sayfa (ileride).
- Proxy: `apps/web-next/app/api/public/ai/chat` → executor `/ai/chat`.
- Executor: `/ai/chat` SSE orkestratörü; tool çağrılarını mevcut API’lere map eder.
- RAG: Roadmap/CHANGELOG/runbook/raporlar → vektör deposu (PG/SQLite).
- Ajanlar: freshness/PSI/SLO izleme, “advisor.suggest” özetleyici.
- Telemetry: `ai_chat_ms_summary`, `ai_tool_calls_total{tool}`, `ai_denied_total`.

## Yol Haritası
### MVP (2–3 gün)
- ChatDock’u global layout’a taşı (tamamlandı).
- `/canary/advise/suggest`, `/fusion/*` (read-only) bağla.
- Slash `/status`: health, p95, drift, freshness, open orders tek mesaj.

### V1 (1–2 hafta)
- `/ai/chat` orkestratörü + read-only tool’lar + dry-run iskeleti.
- “Suggested patches”: eşik/diff/PR önerisi, onay butonu.
- Sabah raporu: daily risk report özetini chat’e düş.

### V2 (sonraki sprint)
- Oto-triage: hata/latency sıçramasında kök-neden + öneri.
- Guarded “apply”: RBAC + çift onay → gerçek değişiklik/PR açma.
- Gözetim paneli: risk/freshness/rate-limit/cache sağlık; chat’ten okuma/yazma.

## Sözleşmeler (Executor)
- `POST /ai/chat`
```json
{ "conversationId":"...", "messages":[{"role":"user","content":"..."}], "allowWrite":false }
```
- Tool’lar: `get_metrics`, `get_status`, `get_positions`, `get_orders`,
  `fusion_drift`, `fusion_freshness`, `fusion_threshold_find`, `advisor_suggest`,
  (guarded) `model_promote`, `set_threshold`, `create_alert`, `cancel_order`.
- Audit: `{who, when, params, dryRun, allowWrite}`

## Güvenlik
- RBAC + rate-limit, POST-only proxy, SSE passthrough.
- Prod gate: `FUSION_GATE_ENABLE=1` riskli planları otomatik reddeder.

## Ortam
- Web: `EXECUTOR_BASE`/`EXECUTOR_ORIGIN`
- Executor: `FUSION_ONLINE_CACHE_SNAPSHOT`, `RISK_REPORT_DIR`

## Kabul Kriterleri
- web-next build/health yeşil, smoke: “# HELP”, canary JSON, risk ZIP > 0 B.
- `/ai/chat` read-only tool’larla yanıt üretebiliyor.
- RBAC ve audit kayıtları çalışıyor (write girişimleri loglanıyor). 