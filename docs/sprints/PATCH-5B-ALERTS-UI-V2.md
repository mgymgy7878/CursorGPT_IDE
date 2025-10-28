# PATCH-5B — Alerts UI v2 (Channel Selection, Cooldown Override, Import/Export, Bulk Ops)

**Module:** Spark Trading Platform — TA Module  
**Scope:** Backend (Executor), Frontend (Web-Next), Ops (Docs, Tests)  
**Goal:** Improve alert configurability and operator efficiency without breaking existing APIs.

---

## 1) Objectives

- Per‑alert **notification channel selection** (telegram/webhook) with sensible defaults.
- Per‑alert **cooldown override** (seconds) with server‑side clamping + metrics.
- **Import/Export** alerts as JSON (bulk create).
- **Clone** existing alert quickly.
- **Bulk operations**: enable/disable/delete multiple.
- **Table enhancements**: filter, sort, paginate (server‑side query params).
- Non‑goals: RBAC/multi‑tenant (future), complex AND/OR alert logic (future patch).

---

## 2) Data Model Additions (Redis)

### Hash fields (existing `spark:alerts:alert:{id}`)
- `json`: full JSON (source of truth)
- `active`: "0|1"
- `createdAt`, `lastTriggeredAt`

### New fields inside `json` document
```json
{
  "id": "…",
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "type": "bb_break",
  "params": { "side": "both" },
  "active": true,
  "createdAt": 1734537600000,
  "lastTriggeredAt": 1734538500000,
  "notificationSettings": {
    "telegram": true,
    "webhook": false
  },
  "cooldownOverrideSec": 300
}
```

### Validation rules
- `cooldownOverrideSec`: integer ≥ 0, ≤ 86400; if omitted → global default.
- `notificationSettings`: at least one channel must be true (server will allow both false **only** if alert is used for metrics/testing; return warning field in response).
- Backward compatibility: missing fields are defaulted server‑side.

### Migration (online, zero‑downtime)
- Lazy migration: when reading an alert, if fields missing → patch in memory and on next write persist updated `json`.
- Optional one‑shot migrator: iterate `spark:alerts:alerts:index`, read/patch JSON, write back.

---

## 3) API Design (Executor)

> Prefix: `/alerts`

### 3.1 Existing (unchanged)
- `POST /create`
- `GET /list`
- `GET /get?id=`
- `POST /enable`
- `POST /disable`
- `POST /delete`
- `POST /test`
- `GET /history`

### 3.2 New/Extended

#### A) Update (partial)
`POST /alerts/update`
```json
{
  "id": "…",
  "notificationSettings": { "telegram": true, "webhook": false },
  "cooldownOverrideSec": 120
}
```
- Any subset allowed. Validated + persisted.

#### B) Export
`GET /alerts/export?ids=a,b,c` (optional `ids` list; if absent → all)
- Response: `application/json`, array of alert documents (safe to re‑import).

#### C) Import (bulk create/replace)
`POST /alerts/import?mode=create|upsert`
Body: `[{…alert…}, {…}]`
- `mode=create`: fails on id collision.
- `mode=upsert`: create or replace by `id`.

#### D) Clone
`POST /alerts/clone`
```json
{"id":"source-alert-id","patch":{"symbol":"ETHUSDT","timeframe":"4h"}}
```
- Server generates new id; merges `patch` over source.

#### E) Bulk Ops
`POST /alerts/bulk-enable`  
`POST /alerts/bulk-disable`  
`POST /alerts/bulk-delete`
```json
{"ids":["a","b","c"]}
```

#### F) List (enhanced — server-side filter/sort/paginate)
`GET /alerts/list?symbol=BTCUSDT&type=bb_break&active=1&sort=createdAt:desc&limit=50&cursor=…`
- Returns `items`, `nextCursor`.
- Implementation: store scans + filter in memory first; optimize later (optional secondary sets by symbol/type).

---

## 4) OpenAPI (excerpt)
See `docs/specs/alerts-v2.openapi.yaml` in this package.

---

## 5) Frontend (Web‑Next)

### 5.1 Alerts Page Enhancements
- **Filter bar:** symbol (text), type (select), status (active/paused).
- **Server‑side pagination:** next/prev buttons.
- **Sortable headers:** createdAt, lastTriggeredAt, type, symbol.
- **Bulk selection:** checkbox per row + header checkbox; bulk actions (Enable/Disable/Delete).
- **Clone action:** row menu → "Clone", prefill modal.
- **Edit action:** row menu → "Edit Settings" modal:
  - Telegram / Webhook toggles
  - Cooldown override (seconds, 0 = disabled)
  - Validation with inline help

### 5.2 Technical Analysis Page
- Creation form advanced section ("More settings"): channels + cooldown override.

### 5.3 UX Notes
- Default at least one channel ON, show subtle warning if both OFF.
- Cooldown editor clamps to [0, 86400], show helper text (e.g., "0 = no cooldown, 300 = 5m").

---

## 6) Backend Implementation Plan (Executor)

1. Types: extend `Alert` interface.
2. Validation: zod/yup‑like schema or manual checks; clamp cooldown; sanitize booleans.
3. Store:
   - Read‑modify‑write JSON in Redis hash (`json` field).
   - Add export/import/clone/bulk handlers.
4. Engine: fetch per‑alert cooldown using `cooldownOverrideSec ?? ENV_DEFAULT`; expose metric label `cooldown="override|default"` for suppression counter.
5. Metrics:
   - `alerts_updated_total`
   - `alerts_imported_total{mode}`
   - `alerts_cloned_total`
   - `alerts_bulk_total{op}`
6. Routes:
   - Wire new endpoints in `routes/alerts.ts`, reuse existing error model.
7. Tests:
   - Unit: validation, merge/clone, import modes.
   - Integration: bulk ops behavior, cooldown override path.
8. Docs: update API reference + examples.

---

## 7) Testing Strategy

- **Unit:** validator, serializer, cooldown selection, merge logic.
- **Integration (regression-suite):**
  - Update → verify fields persisted.
  - Clone → new id + patched fields.
  - Export/Import (create, upsert) → counts & equality.
  - Bulk ops → status flips, deletion count.
  - List with filters/sort/pagination → cursors work.
- **Negative:** invalid cooldown (-1, >86400), channels both false (allowed with warning), malformed JSON in import, duplicate ids in mode=create.

---

## 8) Rollout & Backward Compatibility

- All new fields optional; old clients unaffected.
- New endpoints additive.
- Feature flags (env):
  - `ALERTS_LIST_PAGINATION=true`
  - `ALERTS_BULK_MAX=200` (server guard)
- Rollback: safe — remove UI controls; server ignores unknown fields.

---

## 9) Security & Limits

- Import size limit: 1 MB or `ALERTS_IMPORT_MAX=100` items.
- Bulk ops max: `ALERTS_BULK_MAX` (default 200).
- Rate limits align with existing token bucket.
- Webhook/Telegram settings validated against global enable flags.

---

## 10) Telemetry & Observability

- Counters listed above + timings:
  - `alerts_import_duration_seconds` (summary or histogram)
  - `alerts_list_duration_seconds`
- Logs: structured `op`, `count`, `mode`, `duration_ms`, `caller_ip` (no secrets).

---

## 11) UI Wireframes (ASCII)

```
/alerts
┌─ Filters ─────────────────────────────────────────────────────────────┐
│ Symbol [______]  Type [bb_break▼]  Status [Active▼]  [Apply] [Reset] │
└───────────────────────────────────────────────────────────────────────┘
[☐] ID        Symbol   TF   Type        Active  Last Triggered   ⋮
[☑] a7f5…     BTCUSDT  1h   bb_break    ●      14:32             [Edit|Clone|History|Test|Delete]
[☐] b8e6…     ETHUSDT  4h   fib_touch   ○      —                 [Edit|Clone|History|Test|Delete]
…
[Select All]  [Enable] [Disable] [Delete]       Page 1  ‹ Prev | Next ›
```

**Edit Settings Modal**
```
┌ Edit Alert Settings ──────────────────────────────┐
│ Channels:  [✓] Telegram   [ ] Webhook            │
│ Cooldown:  [ 300 ] seconds (0..86400)            │
│  Hint: 0 = no cooldown, 300 = 5 minutes          │
│                                   [Cancel] [Save]│
└───────────────────────────────────────────────────┘
```

---

## 12) Example Migration Script (Optional, Lua)

```lua
-- KEYS[1] = namespace (e.g., "spark:alerts")
local ns = KEYS[1]
local cursor = "0"
repeat
  local scan = redis.call("SCAN", cursor, "MATCH", ns..":alert:*", "COUNT", 200)
  cursor = scan[1]
  local keys = scan[2]
  for _,k in ipairs(keys) do
    local j = redis.call("HGET", k, "json")
    if j then
      local ok, obj = pcall(cjson.decode, j)
      if ok then
        if obj.notificationSettings == nil then
          obj.notificationSettings = { telegram=true, webhook=false }
        end
        if obj.cooldownOverrideSec == nil then
          obj.cooldownOverrideSec = nil -- keep default
        end
        redis.call("HSET", k, "json", cjson.encode(obj))
      end
    end
  end
until cursor == "0"
return "OK"
```

---

## 13) Acceptance Criteria

- Update endpoint persists `notificationSettings` and `cooldownOverrideSec` with validation.
- Import/Export round‑trips alerts losslessly (except server‑side defaults).
- Clone creates a new id and applies patch.
- Bulk operations affect N selected alerts with correct metrics.
- List supports filter, sort, and pagination via query params.
- UI allows editing channels + cooldown, cloning, and bulk actions.
- All regression tests pass; new tests added for PATCH‑5B paths.

---

## 14) Implementation Estimate

**Backend (Executor):**
- Types + Validation: 30 LOC
- Store functions (export/import/clone/bulk/update): 120 LOC
- Routes (6 endpoints): 80 LOC
- Metrics: 20 LOC
- **Total Backend:** ~250 LOC

**Frontend (Web-Next):**
- Filter/Sort/Pagination: 60 LOC
- Edit Settings Modal: 40 LOC
- Bulk Selection UI: 30 LOC
- Clone Integration: 20 LOC
- **Total Frontend:** ~150 LOC

**Tests:**
- Regression suite additions: 50 LOC
- Unit tests: 40 LOC
- **Total Tests:** ~90 LOC

**Grand Total:** ~490 LOC  
**Estimated Time:** 1.5 days (12 hours)

---

## 15) Sprint Timeline

### Day 1 (6 hours)
- **Hour 1-2:** Backend types + validation
- **Hour 3-4:** Store functions (export/import/clone/bulk)
- **Hour 5-6:** Routes + metrics

### Day 2 (6 hours)
- **Hour 1-2:** Frontend filter/sort/pagination
- **Hour 3-4:** Edit modal + bulk UI
- **Hour 5:** Testing (regression + unit)
- **Hour 6:** Documentation + smoke test

---

## 16) Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Import malformed JSON | High | Schema validation + try/catch |
| Bulk delete accident | High | Confirmation modal + soft delete option (future) |
| Cooldown override abuse | Medium | Clamp to [0, 86400] + audit log |
| Performance (large lists) | Medium | Pagination + Redis scan optimization |
| Breaking old clients | Low | All fields optional, lazy migration |

---

**Status:** Ready for Implementation  
**Priority:** Medium (Enhancement)  
**Dependencies:** None (builds on v1.0.0)  
**Version:** v1.1.0 (minor bump)
