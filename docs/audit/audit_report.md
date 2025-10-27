# Spark — Tam Sağlık Denetimi (Doctor v2)
Tarih: 2025-08-14T08:13:08+03:00

## Araç Sürümleri
v18.18.2
10.14.0
git version 2.50.1.windows.1

## PNPM Workspace
pnpm-workspace.yaml bulundu ✓
apps/* kapsama ✓
packages/* kapsama ✓

## Lock/Integrity
pnpm-lock.yaml mevcut ✓

## ENV Değişkenleri (varlık)
 - JWT_SECRET: OK
 - DEV_TOKEN: OK
 - INGEST_KEY: MISSING

## Router Envanteri/Çakışma
Çakışma bulundu ✗
    == INVENTORY: pages ==
         1	/_app.tsx
         2	/api/_mwAuth.ts
         3	/api/auth/dev-token.ts
         4	/api/health.ts
         5	/api/market-data.ts
         6	/api/metrics.ts
         7	/api/metrics/prom.ts
         8	/api/metrics/stream.ts
         9	/api/portfolio/stream.ts
        10	/api/report/wf-pdf.ts
        11	/api/supervisor/config.ts
        12	/api/supervisor/stats.ts
        13	/automation.tsx
        14	/Ayarlar.tsx
        15	/backtest-demo.tsx
        16	/Gozlem.tsx
        17	/index.tsx
        18	/optimize.tsx
        19	/PortfoyYonetimi.tsx
        20	/strategy-lab.tsx
        21	/StratejiJeneratoru.tsx
        22	/Stratejilerim.tsx
        23	/walk-forward.tsx
    == INVENTORY: app ==
         1	/api/admin/reload/route.ts
         2	/api/admin/strategy/compile/route.ts
         3	/api/admin/strategy/optimize/route.ts
         4	/api/admin/strategy/walkforward/route.ts
         5	/api/admin/supervisor/toggle/route.ts
         6	/api/auth/refresh/route.ts
         7	/api/auth/session/route.ts
         8	/api/broker/[exchange]/balance/route.ts
         9	/api/broker/[exchange]/order/route.ts
        10	/api/broker/[exchange]/positions/route.ts
        11	/api/events/ingest/route.ts
        12	/api/live/kill/route.ts
        13	/api/logs/sse/route.ts
        14	/api/protected/broker/binance/balance/route.ts
        15	/api/protected/broker/binance/orders/route.ts
        16	/api/protected/broker/binance/positions/route.ts
        17	/api/protected/broker/bybit/balance/route.ts
        18	/api/protected/broker/bybit/cancel/route.ts
        19	/api/protected/broker/bybit/close/route.ts
        20	/api/protected/broker/bybit/orders/route.ts
        21	/api/protected/broker/bybit/positions/route.ts
        22	/api/protected/broker/okx/balance/route.ts
        23	/api/protected/broker/okx/orders/route.ts
        24	/api/protected/broker/okx/positions/route.ts
        25	/api/protected/logs/audit/route.ts
        26	/api/protected/logs/sse/route.ts
        27	/api/protected/market-data/route.ts
        28	/api/protected/me/route.ts
        29	/api/protected/metrics/stream/route.ts
        30	/api/protected/portfolio/stream/route.ts
        31	/api/public/health/route.ts
        32	/api/public/metrics/prom/route.ts
        33	/api/public/ping/route.ts
        34	/api/report/route.ts
        35	/api/strategy/backtest/route.ts
        36	/api/strategy/generate/route.ts
        37	/api/strategy/optimize/route.ts
        38	/api/supervisor/start/route.ts
        39	/api/supervisor/stop/route.ts
        40	/api/supervisor/toggle/route.ts
        41	/layout.tsx
        42	/portfolio/page.tsx
        43	/reports/page.tsx
        44	/strategy/page.tsx
        45	/supervisor/page.tsx
    == NORMALIZED PATH MAPPING ==
    == CONFLICTS (same normalized path) ==
    == UNIQUE (pages-only) ==
         1	/
         2	/_app
         3	/api/_mwAuth
         4	/api/auth/dev-token
         5	/api/health
         6	/api/market-data
         7	/api/metrics
         8	/api/metrics/prom
         9	/api/metrics/stream
        10	/api/portfolio/stream
        11	/api/report/wf-pdf
        12	/api/supervisor/config
        13	/api/supervisor/stats
        14	/automation
        15	/Ayarlar
        16	/backtest-demo
        17	/Gozlem
        18	/optimize
        19	/PortfoyYonetimi
        20	/strategy-lab
        21	/StratejiJeneratoru
        22	/Stratejilerim
        23	/walk-forward
    == UNIQUE (app-only) ==
         1	/api/admin/reload
         2	/api/admin/strategy/compile
         3	/api/admin/strategy/optimize
         4	/api/admin/strategy/walkforward
         5	/api/admin/supervisor/toggle
         6	/api/auth/refresh
         7	/api/auth/session
         8	/api/broker/[exchange]/balance
         9	/api/broker/[exchange]/order
        10	/api/broker/[exchange]/positions
        11	/api/events/ingest
        12	/api/live/kill
        13	/api/logs/sse
        14	/api/protected/broker/binance/balance
        15	/api/protected/broker/binance/orders
        16	/api/protected/broker/binance/positions
        17	/api/protected/broker/bybit/balance
        18	/api/protected/broker/bybit/cancel
        19	/api/protected/broker/bybit/close
        20	/api/protected/broker/bybit/orders
        21	/api/protected/broker/bybit/positions
        22	/api/protected/broker/okx/balance
        23	/api/protected/broker/okx/orders
        24	/api/protected/broker/okx/positions
        25	/api/protected/logs/audit
        26	/api/protected/logs/sse
        27	/api/protected/market-data
        28	/api/protected/me
        29	/api/protected/metrics/stream
        30	/api/protected/portfolio/stream
        31	/api/public/health
        32	/api/public/metrics/prom
        33	/api/public/ping
        34	/api/report
        35	/api/strategy/backtest
        36	/api/strategy/generate
        37	/api/strategy/optimize
        38	/api/supervisor/start
        39	/api/supervisor/stop
        40	/api/supervisor/toggle
        41	/layout.tsx
        42	/portfolio
        43	/reports
        44	/strategy
        45	/supervisor
    == OUTPUTS ==
     - /tmp/pages_routes.txt
     - /tmp/app_routes.txt
     - /tmp/pages_norm.txt
     - /tmp/app_norm.txt
     - /tmp/conflicts.txt

## Middleware / SSE Matcher
/api/logs/sse matcher dışı ✓

## Prometheus Sanity + Kritik Metrikler
Metrics endpoint erişilemiyor ✗ (http://127.0.0.1:3003/api/public/metrics/prom)
