# Day-1 Demo — Spark Trading Platform
**Amaç:** Copilot odaklı uçtan uca akışı 5 dakikada göstermek.

## Önkoşullar
- UI: `http://127.0.0.1:3003`, Executor: `http://127.0.0.1:4001`
- `EXECUTOR_URL` doğru ayarlı, gerekli uçlar açık (404/502 toleranslı)

## Adımlar
1. **Copilot Özet & Dashboard:** `/dashboard` aç; Copilot kartında metrikler + sparklineler.
2. **Strategy Controls:** Her satırda Start/Stop/Pause/Resume → Preview modal → Onay kapısı.
3. **Alerts Control:** Satırdan Enable/Disable/Snooze → Preview → Confirm.
4. **Portfolio Rebalance:** “Öneri al” (dry-run) → CSV indir → “Apply (Onay)”.
5. **Strategy Studio:** Optimize (Top-K) → “Best’i Uygula” (CodeEditor params güncellenir) → Deploy (onay kapılı, audit-id).

6. **Deploy sonrası görünürlük:** Copilot Dock → “Son Eylemler” sekmesinde ilgili deploy’a ait `audit-id` görünür.
7. **Verify akışı:** `/reports/verify` sayfasında `jobId` gir → “Manifesti getir” → alanlar JSON ile otomatik dolar.

## Tek komut (PowerShell 5.1)
```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo-day1.ps1
```

## Başarı Kriterleri (SLO kanıtı)
- **UI:** 4xx/5xx/ECONNREFUSED yok; sparklineler dolar; tema Auto çalışır.
- **Onaylı çağrılar:** Yanıtlarda `auditId|id|jobId|ticket|requestId` görünür.
- **Observability:** Dashboard “Ops (P95 & Errors)” kartı metrikleri gösterir.
