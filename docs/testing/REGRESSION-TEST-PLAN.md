# SPARK TA MODULE – REGRESSION TEST PLAN (v1.0.0)

**Goal:** Verify that core functionality remains intact after deployment/changes.  
**Scope:** Backend (Analytics, Alerts, Notifications), Frontend (TA & Alerts UI), Streaming (SSE), Persistence (Redis), Leader Election, Metrics.

---

## 1) Test Strategy

- **Type:** Smoke → Functional → Integration → Non‑Functional (basic performance & security sanity)
- **Cadence:** Run before/after deploy; daily for first week.
- **Environments:** Staging (mirrors prod), Production (read‑only/sanity).

**Entry Criteria**
- Docker stack up; Redis reachable; Environment vars set.
- `/metrics`, `/health` endpoints return 200.

**Exit Criteria**
- 100% pass on Critical & High tests, ≥95% overall pass.
- No Sev‑1/Sev‑2 open defects.

---

## 2) Coverage Matrix

| Area | ID Range | What it covers |
|---|---|---|
| Analytics API | A-001… | FIB, BB, MACD, STOCH tool endpoints |
| Alerts CRUD | C-001… | create/list/get/enable/disable/delete/test |
| Alert Engine | E-001… | cooldown, parallel eval, history, persistence |
| Notifications | N-001… | telegram/webhook, ratelimit, allowlist |
| Streaming (SSE) | S-001… | stream headers, live updates, reconnect, limits |
| Leader Election | L-001… | single leader, failover, follower idle |
| Metrics/Observability | M-001… | 22 Prom metrics presence & monotonicity |
| UI | U-001… | /technical-analysis, /alerts (history modal, actions) |
| Security/Validation | V-001… | regex/whitelist, 400/429 paths |
| Performance (sanity) | P-001… | basic latency/CPU checks |

---

## 3) Test Cases (excerpt)

### Analytics API
- **A-001**: `POST /tools/fibonacci_levels` with sample candles → HTTP 200, levels count=7.
- **A-002**: `POST /tools/bollinger_bands` typical params → HTTP 200, arrays aligned with input.
- **A-003**: Timeouts: large payload → completes <4s; errors counted in `copilot_action_total{result="error"}`.

### Alerts CRUD
- **C-001**: Create bb_break → returns `id`, appears in list, `active=true`.
- **C-003**: Disable → active=false, enable → true.
- **C-004**: Delete → no longer in list; Redis set removed.

### Alert Engine
- **E-001**: Cooldown: trigger twice fast → second suppressed; `alerts_suppressed_total{reason="cooldown"}` increments.
- **E-002**: History: `/alerts/history?id=X&limit=5` → most recent first, ≤5 entries.
- **E-003**: Persistence: restart executor → alert still present.
- **E-004**: Parallelism: 10 alerts → poll duration ~≤1s @ concurrency=5 (log sample).

### Notifications
- **N-001**: Telegram/Webhook test sends once; success increments `notifications_sent_total`.
- **N-002**: Rate limit: fire > limit/min → suppressed/failed counters rise appropriately.
- **N-003**: Allowlist: disallowed host → blocked + metric `notifications_suppressed_total{reason="blocked_host"}`.

### Streaming (SSE)
- **S-001**: `HEAD /api/marketdata/stream` exposes `X-Streams-*` headers.
- **S-002**: Valid `symbol=timeframe` → `data:` lines stream; `open` then `kline` events.
- **S-003**: Invalid symbol/timeframe → 400.
- **S-004**: 4th connection from same IP → 429 (limit=3).
- **S-005**: Disconnect/reconnect: Wi‑Fi toggle → resumes within ~5s jitter.

### Leader Election
- **L-001**: Two executors up → only one logs "became leader"; follower CPU low.
- **L-002**: Kill leader → new leader elected ≤40s; `leader_elected_total` increments.

### Metrics
- **M-001**: Presence: all expected metric names exist (22).
- **M-002**: Monotonic counters only increase during activity.
- **M-003**: Gauges sane (e.g., `alerts_active` equals list length).

### UI
- **U-001**: `/technical-analysis` loads, chart renders; Live toggle streams.
- **U-002**: `/alerts` table loads; actions (Pause/Resume/Test/History/Delete) work.
- **U-003**: History modal pretty JSON, localized timestamps.

### Security/Validation
- **V-001**: Bad symbol (`invalid_symbol`) → 400.
- **V-002**: Bad timeframe (`99x`) → 400.

### Performance (sanity)
- **P-001**: SSE flow rate stable; CPU < ~15% during 1m stream.
- **P-002**: Scheduler tick ~30s; eval < 2s p95.

---

## 4) Automation

- **Script:** `scripts/regression-suite.sh` (bash, curl, jq).
- **CI Hook:** run on main merges & nightly; publish JUnit‑style summary (future).

---

## 5) Risks & Mitigations

- **Binance WS instability:** server‑side jitter reconnect; fallback to historical fetch when needed.
- **Duplicate schedulers:** Redis SETNX lock + metrics watch; alert rule triggers if elections stop.
- **Notification spam:** cooldown + ratelimit + allowlist.

---

## 6) Reporting

- Output: exit code, concise summary table, detailed logs to `artifacts/regression-logs.txt`.
- Defects: log in issue tracker with test ID, steps, expected/actual, metrics snapshot.

