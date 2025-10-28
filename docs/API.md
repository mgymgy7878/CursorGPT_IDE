## API — Taslaklar

- POST `/api/strategy/nl-compile` → {text} → {strategyIR, explain[]}
- POST `/api/strategy/backtest` → {IR|id, range} → {metrics, curve, logs}
- POST `/api/strategy/optimize` → {IR|id, search} → {best, leaderboard}
- POST `/api/strategy/canary` → {id, params} → {status, evidence}
- POST `/api/strategy/deploy` → {id, version} → {ok}
- GET `/api/strategy/:id/history` → versiyon/param-diff geçmişi
- GET `/api/public/metrics` (JSON) ve `/api/public/metrics.prom` (Prom text)

### Snapshot Endpoint
- **POST** `/api/snapshot/download` ← güncel endpoint
  - Body: `{ format: "json"|"csv", hours: number }`
  - Response: JSON veya CSV dosyası
- **Eski:** `/api/snapshot/export` → **308 redirect** ile otomatik yönlendirilir (backward compatibility)