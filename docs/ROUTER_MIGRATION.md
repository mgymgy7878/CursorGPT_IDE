# Router Migration — Konsolidasyon Planı (pages → app)

## Hızlı Özet
- Hedef: **app router**’a konsolidasyon (layout, streaming, edge avantajları).
- Sıra: **Sprint-1** (health/metrics/kök UI) → **Sprint-2** (strategy, logs/sse) → **Sprint-3** (broker/supervisor).
- Kriter: Her taşımada **Typecheck/Build + Smoke + Prom scrape** yeşil.
- Rollback: Sprint başında `git tag pre_router_mig_<DATE>`.

## 1) Çakışma Tablosu
> `scripts/routes_inventory.(sh|ps1)` çıktısından doldurun.

| Path (normalize) | pages kaynağı                       | app kaynağı                         | Karar   | Sprint | Not |
|------------------|-------------------------------------|-------------------------------------|---------|--------|-----|
| /                | pages/index.tsx                     | app/page.tsx (yok)                  | KEEP pages | 1   | Kök UI pages’ta kalacak (şimdilik) |
| /api/health      | pages/api/health.ts                 | app/api/public/health               | KEEP app | 1      | Rewrite: /api/health → /api/public/health |
| /api/metrics     | pages/api/metrics/prom.ts           | app/api/public/metrics/prom         | KEEP app | 1      | Rewrite: /api/metrics → /api/public/metrics/prom |
| /strategy        | pages/strategy/index.tsx            | app/strategy/page.tsx               | KEEP app | 2      | Minimal sayfa eklendi |
| /api/strategy/*  | pages/api/strategy/*                | app/api/strategy/*/route.ts         | KEEP app | 2      | generate/backtest/optimize eklendi |
| /api/logs/sse    | pages/api/logs/sse.ts               | app/api/logs/sse/route.ts           | KEEP app | 2      | Dev’de 401; x-dev-role veya token |
| /api/broker/*   | pages/api/broker/[...].ts | app/api/broker/[exchange]/**     | KEEP app | 3 | RBAC |
| /supervisor/*   | pages/supervisor/*.tsx    | app/supervisor/* + api/supervisor/* | KEEP app | 3 | auth |

... diğer yollar Sprint‑3’te ele alınacaktır.

**Karar Notları**
- **KEEP app** varsayılan. Eğer canlı tüketim `pages`’i kullanıyorsa geçici **rewrite → app** uygulayın.

## 2) Adapter Haritası (pages/api → app/api)
- `pages/api/foo.ts` → `app/api/foo/route.ts`  
- `pages/api/bar/[id].ts` → `app/api/bar/[id]/route.ts`  
- Handler: `NextApiRequest/Response` → `export async function GET/POST(req: Request)`  
- JSON: `NextResponse.json(data, { status })`  
- **SSE**: `ReadableStream` + `Content-Type: text/event-stream`  
- **Auth**: Edge-safe `jose` middleware **veya** endpoint içinde `cookies().get('auth_token')`

### SSE İskeleti
```ts
// app/api/logs/sse/route.ts
import { NextResponse } from 'next/server'
export const GET = async () => {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      const send = (t:string, d:any) =>
        controller.enqueue(enc.encode(`event: ${t}\ndata: ${JSON.stringify(d)}\n\n`))
      const t = setInterval(()=>send('ping', { ts: Date.now() }), 10000)
      // @ts-ignore
      controller._t = t
    },
    cancel() { /* @ts-ignore */ clearInterval(this._t) }
  })
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  })
}
```

## 3) Sprint Planı

### Sprint-1 — health/metrics/kök UI
- Kök: pages/index.tsx → Şimdilik pages’ta kalacak (app/page.tsx yok)
- App mevcut: app/api/public/health, app/api/public/metrics/prom
- Rewrite: /api/health → /api/public/health; /api/metrics (+/prom) → /api/public/metrics/prom
- Smoke: GET /api/health 200 JSON • GET /api/metrics/prom 200 (promtool OK) • / 200 (“Open Metrics Mini” görünür)
- Tag: router_mig_s1_done

### Sprint-2 — strategy, logs/sse
- Eklendi: app/strategy/page.tsx
- Eklendi: app/api/strategy/{generate,backtest,optimize}/route.ts
- Eklendi: app/api/logs/sse/route.ts (dev 401; `x-dev-role` veya `?token=` ile test)
- Smoke: Strategy uçları 200; SSE unauthorized 401, dev-auth ile 200
- Tag: router_mig_s2_done

### Sprint-3 — broker/supervisor
- Taşı: pages/api/broker/* → app/api/broker/*/route.ts
- Taşı: pages/supervisor/* → app/supervisor/*
- Smoke: RBAC korumalı endpoint dev’de 401 → x-dev-role: admin ile 200
- Tag: router_mig_s3_done

## 4) Doğrulama
```
npm --prefix apps/web-next run typecheck || npm --prefix apps/web-next run ts:check
npm --prefix apps/web-next run build
promtool check rules ops/prometheus/alerts.yml (varsa)
npx playwright test --grep @smoke
```

---

# scripts/routes_inventory.sh  _(yeni dosya)_

```bash
#!/usr/bin/env bash
# routes_inventory.sh — pages vs app envanter ve çakışma çıkarıcı
set -euo pipefail
cd "$(dirname "$0")/../.."  # repo kökü
cd apps/web-next

echo "== INVENTORY: pages =="
find pages -type f \( -name "*.tsx" -o -name "*.ts" \) | sed 's#^pages##' | sort > /tmp/pages_routes.txt
cat /tmp/pages_routes.txt | nl

echo "== INVENTORY: app =="
find app -type f \( -name "page.tsx" -o -name "route.ts" \) -o -name "layout.tsx" | sed 's#^app##' | sort > /tmp/app_routes.txt
cat /tmp/app_routes.txt | nl

echo "== NORMALIZED PATH MAPPING =="
awk '{p=$0; gsub(/index\.tsx$/,"",p); gsub(/\.tsx$|\.ts$/,"",p); print p}' /tmp/pages_routes.txt | sort > /tmp/pages_norm.txt
awk '{p=$0; gsub(/\/page\.tsx$/,"",p); gsub(/\/route\.ts$/,"",p); print p}' /tmp/app_routes.txt | sort > /tmp/app_norm.txt

echo "== CONFLICTS (same normalized path) =="
comm -12 /tmp/pages_norm.txt /tmp/app_norm.txt > /tmp/conflicts.txt || true
nl -ba /tmp/conflicts.txt || true

echo "== UNIQUE (pages-only) =="
comm -23 /tmp/pages_norm.txt /tmp/app_norm.txt | nl -ba || true

echo "== UNIQUE (app-only) =="
comm -13 /tmp/pages_norm.txt /tmp/app_norm.txt | nl -ba || true

echo "== OUTPUTS =="
printf " - /tmp/pages_routes.txt\n - /tmp/app_routes.txt\n - /tmp/pages_norm.txt\n - /tmp/app_norm.txt\n - /tmp/conflicts.txt\n"
```

# scripts/routes_inventory.ps1 (yeni dosya)

```powershell
# routes_inventory.ps1 — pages vs app envanter ve çakışma çıkarıcı
Set-StrictMode -Version Latest
$root = Join-Path $PSScriptRoot "..\.."
$web = Join-Path $root "apps\web-next"

$pages = Get-ChildItem (Join-Path $web "pages") -Recurse -Include *.ts,*.tsx | ForEach-Object { $_.FullName.Replace($web, "") }
$app   = Get-ChildItem (Join-Path $web "app")   -Recurse -Include page.tsx,route.ts,layout.tsx | ForEach-Object { $_.FullName.Replace($web, "") }

$pagesNorm = $pages | ForEach-Object { ($_ -replace 'index\.tsx$', '') -replace '\.tsx$|\.ts$', '' } | Sort-Object
$appNorm   = $app   | ForEach-Object { ($_ -replace '\\page\.tsx$','' -replace '\\route\.ts$','') } | Sort-Object

"== CONFLICTS =="; Compare-Object -ReferenceObject $pagesNorm -DifferenceObject $appNorm -IncludeEqual -ExcludeDifferent | ForEach-Object { $_.InputObject }
"== PAGES-ONLY =="; Compare-Object $pagesNorm $appNorm | Where-Object { $_.SideIndicator -eq '<=' } | ForEach-Object { $_.InputObject }
"== APP-ONLY =="; Compare-Object $pagesNorm $appNorm | Where-Object { $_.SideIndicator -eq '=>' } | ForEach-Object { $_.InputObject }
```

## Edge-safe auth — jose geçiş rehberi (diff)
> Bunu koda yapıştırmak istersen hazır dursun; şu an rehber amaçlı.

```diff
- import jwt from 'jsonwebtoken'
+ import { jwtVerify } from 'jose'
  import { NextResponse } from 'next/server'

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  }

  export default async function middleware(req: Request) {
    const url = new URL(req.url)
    // dev bypass (opsiyonel)
    if (process.env.NODE_ENV !== 'production' && (req.headers as any).get?.('x-dev-role')) {
      return NextResponse.next()
    }

    // cookie → token
    // @ts-ignore
    const token = (req as any).cookies?.get?.('auth_token')?.value
    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    try {
+     const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
+     const { payload } = await jwtVerify(token, secret, {
+       issuer: 'spark',
+       audience: 'spark-web',
+       // clockTolerance: '60s'
+     })
+     const headers = new Headers((req as any).headers)
+     headers.set('x-user-id', String(payload.sub || ''))
+     return NextResponse.next({ request: { headers } })
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
```

Risk notları: aud/iss uyuşmazlığı ve saat toleransı en sık hata. SSE için gerekiyorsa matcher’dan hariç tut.

## Sprint-1 Uygulama Check-list (hemen)

- Rollback etiketi at
```
git tag -a pre_router_mig_$(date +%Y%m%d) -m "pre router migration snapshot"
```

- Envanter çıkar
```
bash scripts/routes_inventory.sh
# veya
pwsh -f scripts/routes_inventory.ps1
```

- Çakışma tablosunu doldur → docs/ROUTER_MIGRATION.md

- Smoke çalıştır (CI’da zaten var; lokalde hızlı kontrol):
```
npm --prefix apps/web-next run build
npx playwright test --grep @smoke
``` 