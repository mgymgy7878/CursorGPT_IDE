# CI/PR Smoke & Visual Regression — Root Cause Analysis (RCA)

Durum: Kaynak doküman / karar ağacı

Sürüm: 1.0

Figma Board (Design Reference):
- CI-PR-Smoke Standalone Boot RCA Decision Tree: https://www.figma.com/board/MKkDKEbZ1LmG33JbKQftm4/CI-PR-Smoke-Standalone-Boot-RCA-Decision-Tree?t=AO13OvEvjQUuLWMc-1

---

## 0) Amaç

CI/PR pipeline'ında görülen hataları hızlıca triage etmek ve doğru aksiyonu almak.

Bu doküman 3 şeyi aynı anda yapar:
1) False-negative'leri önlemek (port hazır olmadan test başlaması)
2) Beklenen durumları belgelemek (executor kapalı → 503 OK)
3) Snapshot diff'lerini doğru yönetmek (intentional vs bug)

---

## 1) Standalone Boot Senaryosu

### 1.1 CI Pipeline Akışı

```
1. Dev server başlat (background)
   └─ pnpm --filter web-next dev -- --port 3003 --hostname 127.0.0.1

2. Healthz readiness check (45-60sn polling)
   └─ GET http://127.0.0.1:3003/api/healthz
   └─ Beklenen: 200 (UI-only mode) veya 503 (executor kapalı, beklenen)

3. Golden Master testleri çalıştır
   └─ Playwright visual regression
   └─ Snapshot diff kontrolü

4. Dev server durdur (clean stop)
   └─ PID ile graceful shutdown
```

### 1.2 Healthz Endpoint Davranışı

**UI-Only Mode (CI/Visual Regression):**
- Executor kapalı olsa bile → **200 OK** döner
- Body'de `services.executor.status: "DOWN"` olabilir
- **Bu beklenen bir durumdur** (UI-only test)

**Normal Mode (Production/Full Stack):**
- Executor kapalı → **503 Service Unavailable**
- Executor açık → **200 OK**

**CI Script'lerde:**
- Healthz 200 veya 503 → **her ikisi de "ready" kabul edilir**
- Connection refused (ECONNREFUSED) → **retry gerekir**

---

## 2) Karar Ağacı (Decision Tree)

### 2.1 ERR_CONNECTION_REFUSED

```
ERR_CONNECTION_REFUSED görüldü mü?
│
├─ EVET
│  │
│  ├─ Dev server başladı mı? (process check)
│  │  │
│  │  ├─ HAYIR → Dev server başlatılmamış
│  │  │         └─ Aksiyon: Script'i düzelt, dev server'ı background'da başlat
│  │  │
│  │  └─ EVET → Port hazır değil (henüz)
│  │            └─ Aksiyon: Healthz polling süresini artır (45-60sn)
│  │                      Retry interval: 2sn
│  │                      Max retries: 30 (60sn total)
│
└─ HAYIR → Port hazır, testlere devam
```

### 2.2 Healthz 503 Durumu

```
Healthz 503 döndü mü?
│
├─ EVET
│  │
│  ├─ UI-only mode mu? (CI/visual regression)
│  │  │
│  │  ├─ EVET → Beklenen durum (executor kapalı)
│  │  │         └─ Aksiyon: Testlere devam et
│  │  │                   Not: UI-only testler executor'a bağımlı değil
│  │  │
│  │  └─ HAYIR → Full stack test
│  │            └─ Aksiyon: Executor'ı başlat veya test'i skip et
│
└─ HAYIR → Healthz 200, normal akış
```

### 2.3 Snapshot Diff (Golden Master)

```
Snapshot diff çıktı mı?
│
├─ EVET
│  │
│  ├─ Intentional değişiklik mi? (Figma parity, tasarım güncellemesi)
│  │  │
│  │  ├─ EVET → Snapshot'ları güncelle
│  │  │         └─ Aksiyon: --update-snapshots flag ile test çalıştır
│  │  │                   PR'a evidence ekle (before/after screenshot)
│  │  │                   PR description'da "Intentional UI change" belirt
│  │  │
│  │  └─ HAYIR → Bug (drift, regresyon)
│  │            └─ Aksiyon: Bug fix yap
│  │                      Shell kurallarını kontrol et (AppFrame tek otorite)
│  │                      UI_UX_PLAN.md'ye uygun mu?
│
└─ HAYIR → Test PASS, PR merge edilebilir
```

---

## 3) Script İyileştirmeleri

### 3.1 PowerShell Script (ci-visual-regression.ps1)

**Değişiklikler:**
- Healthz polling: 45-60sn (30 retry × 2sn)
- Net hata mesajları (connection refused vs 503)
- PID ile clean stop (Get-Process + Stop-Process)

**Kod:**
```powershell
# Healthz readiness check (45-60sn)
$maxRetries = 30
$retryInterval = 2
$serverReady = $false

for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/healthz" `
            -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop

        # 200 (UI ready) veya 503 (executor kapalı, beklenen) → ready
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server is ready (HTTP $($response.StatusCode))" -ForegroundColor Green
            $serverReady = $true
            break
        } elseif ($response.StatusCode -eq 503) {
            # 503 beklenen (UI-only mode, executor kapalı)
            Write-Host "✅ Server is ready (HTTP 503 - executor down, expected in UI-only mode)" -ForegroundColor Yellow
            $serverReady = $true
            break
        }
    } catch {
        $errorCode = $null
        try {
            $errorCode = $_.Exception.Response.StatusCode.value__
        } catch {
            # StatusCode yok, connection refused olabilir
        }

        if ($errorCode -eq 503) {
            # 503 beklenen (UI-only mode, executor kapalı)
            Write-Host "✅ Server is ready (HTTP 503 - executor down, expected in UI-only mode)" -ForegroundColor Yellow
            $serverReady = $true
            break
        } elseif ($_.Exception -match "ECONNREFUSED|Connection refused|Unable to connect") {
            # Port henüz hazır değil, retry
            Write-Host "⏳ Waiting for port 3003... ($i/$maxRetries)" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    if ($i -lt $maxRetries) {
        Start-Sleep -Seconds $retryInterval
    }
}

if (-not $serverReady) {
    Write-Host "❌ Server failed to start after $($maxRetries * $retryInterval) seconds" -ForegroundColor Red
    Write-Host "   Check: Is port 3003 free? (netstat -ano | findstr :3003)" -ForegroundColor Yellow
    # Clean stop
    Stop-Job -Job $devJob -ErrorAction SilentlyContinue
    Remove-Job -Job $devJob -ErrorAction SilentlyContinue
    # PID ile process'i de durdur (güvenlik için)
    try {
        $process = Get-Process -Id $DEV_PID -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id $DEV_PID -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Process zaten durmuş olabilir
    }
    exit 1
}
```

### 3.2 Bash Script (ci-visual-regression.sh)

**Değişiklikler:**
- Curl ile readiness loop (45-60sn)
- 503'ü "ready" olarak kabul et
- Clean stop (trap + kill)

**Kod:**
```bash
# Healthz readiness check (45-60sn)
MAX_RETRIES=30
RETRY_INTERVAL=2
SERVER_READY=false

for i in $(seq 1 $MAX_RETRIES); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3003/api/healthz 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Server is ready (HTTP 200)"
    SERVER_READY=true
    break
  elif [ "$HTTP_CODE" = "503" ]; then
    # 503 beklenen (UI-only mode, executor kapalı)
    echo "✅ Server is ready (HTTP 503 - executor down, expected in UI-only mode)"
    SERVER_READY=true
    break
  elif [ "$HTTP_CODE" = "000" ]; then
    # Connection refused, retry
    echo "⏳ Waiting for port 3003... ($i/$MAX_RETRIES)"
  else
    echo "⚠️  Unexpected HTTP code: $HTTP_CODE"
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    sleep $RETRY_INTERVAL
  fi
done

if [ "$SERVER_READY" != "true" ]; then
  echo "❌ Server failed to start after $((MAX_RETRIES * RETRY_INTERVAL)) seconds"
  echo "   Check: Is port 3003 free? (lsof -i :3003 or netstat -tuln | grep :3003)"
  # Clean stop
  kill $DEV_PID 2>/dev/null || true
  wait $DEV_PID 2>/dev/null || true
  exit 1
fi
```

---

## 4) Golden Master Test Kapsamı

### 4.1 Mevcut Testler
- ✅ Dashboard (loading/empty/error/data states)
- ✅ Market Data (default/loading/empty states)
- ✅ Strategy Lab (default/loading/empty states)
- ✅ My Strategies (default/loading/empty states)
- ✅ Running Strategies (default/loading/empty states)

### 4.2 Snapshot Path

**Playwright Default:**
- Snapshot'lar test dosyasının yanında `*-snapshots/` klasöründe oluşur
- Örnek: `tests/visual/dashboard-golden-master.spec.ts-snapshots/`

**Commit Edilecek Klasör:**
```bash
apps/web-next/tests/visual/*.spec.ts-snapshots/
```

**Baseline Oluşturma:**
```bash
# 1) Dev server başlat (başka terminal)
pnpm --filter web-next dev -- --port 3003

# 2) Baseline snapshot'ları oluştur
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts --update-snapshots

# 3) Hangi klasör oluştuğunu kontrol et
git status

# 4) Commit et
git add apps/web-next/tests/visual
git commit -m "chore(ui): add baseline golden master snapshots"
git push
```

---

## 5) PR Workflow

### 5.1 Snapshot Diff Çıktığında

**Intentional Change:**
1. PR description'da "Intentional UI change" belirt
2. Figma referansı ekle (link)
3. Before/after screenshot ekle
4. Snapshot'ları güncelle:
   ```bash
   pnpm --filter web-next exec playwright test tests/visual/*.spec.ts --update-snapshots
   ```

**Unintentional Change (Bug):**
1. Shell kurallarını kontrol et (AppFrame tek otorite)
2. UI_UX_PLAN.md'ye uygun mu?
3. Bug fix yap
4. Test PASS olana kadar tekrarla

### 5.2 CI Failure Debug

**GitHub Actions Artifacts:**
- CI failure durumunda otomatik olarak yüklenir:
  - `playwright-report/` - HTML report
  - `test-results/` - Screenshot, trace, video (varsa)

**Artifact İndirme:**
1. GitHub PR sayfasında "Checks" sekmesine git
2. Failed workflow'u aç
3. "Artifacts" bölümünden indir
4. `playwright-report/index.html` dosyasını tarayıcıda aç

**Local Debug:**
```bash
# CI script'i local'de çalıştır
pnpm --filter web-next exec bash ./scripts/ci-visual-regression.sh

# Veya manuel:
pnpm --filter web-next dev -- --port 3003
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts
```

### 5.3 False-Negative Önleme

**CI Script Checklist:**
- [ ] Dev server background'da başlatıldı mı?
- [ ] Healthz polling 45-60sn yapılıyor mu?
- [ ] 503 "ready" olarak kabul ediliyor mu? (UI-only mode)
- [ ] Clean stop yapılıyor mu? (PID ile)

---

## 6) Branch Protection (GitHub Settings)

**"Yeşil değilse merge yok" kuralını kilitlemek için:**

1. GitHub repo → Settings → Branches
2. Branch protection rule ekle (veya mevcut kuralı düzenle)
3. **Required status checks** bölümünde:
   - ✅ `ui-visual-regression` işaretle
   - ✅ "Require branches to be up to date before merging" açık
4. Kaydet

**Sonuç:**
- PR merge edilemez → `ui-visual-regression` check'i yeşil değilse
- Drift otomatik bloklanır → Visual regression fail → PR kırmızı

---

## 7) Hızlı Referans

### 7.1 Komutlar

```bash
# Visual regression test (local)
pnpm --filter web-next dev -- --port 3003
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts

# Snapshot güncelleme
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts --update-snapshots

# Healthz check
curl -v http://127.0.0.1:3003/api/healthz

# Port kontrolü (Windows)
netstat -ano | findstr :3003

# Port kontrolü (Linux/Mac)
lsof -i :3003
```

### 7.2 Beklenen Durumlar

| Durum | HTTP Code | CI'da Beklenen? | Aksiyon |
|-------|-----------|-----------------|---------|
| UI ready, executor açık | 200 | ✅ | Testlere devam |
| UI ready, executor kapalı (UI-only) | 503 | ✅ | Testlere devam |
| Port hazır değil | ECONNREFUSED | ❌ | Retry (45-60sn) |
| Snapshot diff (intentional) | - | ✅ | Update snapshots + evidence |
| Snapshot diff (bug) | - | ❌ | Bug fix |

---

## 8) İlgili Dokümanlar

- `docs/UI_UX_PLAN.md` - UI/UX standartları ve PR protokolü
- `apps/web-next/SHELL_ANAYASA.md` - Shell kuralları
- `apps/web-next/scripts/ci-visual-regression.ps1` - PowerShell CI script
- `apps/web-next/scripts/ci-visual-regression.sh` - Bash CI script
- `.github/workflows/ui-visual-regression.yml` - GitHub Actions workflow
