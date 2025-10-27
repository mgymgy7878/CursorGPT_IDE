# Scripts — UI Reconstruction Automation

Bu klasör, UI reconstruction sürecini otomatikleştiren script'leri içerir.

## 🚀 Quick Start

**Tüm adımları sırasıyla çalıştır:**
```powershell
pwsh scripts/ui-reconstruction-master.ps1
```

**Sadece evidence topla:**
```powershell
pwsh scripts/collect-evidence.ps1
```

**Sadece PR oluştur:**
```powershell
pwsh scripts/create-ui-pr.ps1
```

**Sadece canary smoke:**
```powershell
pwsh scripts/canary-ui-smoke.ps1
```

---

## 📁 Script Listesi

### 1. `collect-evidence.ps1`
Evidence toplama scripti. Tüm test sonuçlarını, metrik snapshot'larını ve health check'leri bir klasörde toplar.

**Çalıştırma:**
```powershell
pwsh scripts/collect-evidence.ps1
```

**Çıktı:**
```
evidence/ui-reconstruction-YYYYMMDD/
├── .lighthouseci/
├── test-results/
├── smoke-output.txt
├── health-snapshot.json
├── metrics-snapshot.json
└── bundle-analysis.json
```

---

### 2. `create-ui-pr.ps1`
GitHub PR oluşturma scripti. Evidence'leri ekleyerek draft PR açar.

**Çalıştırma:**
```powershell
pwsh scripts/create-ui-pr.ps1
```

**Gereksinimler:**
- GitHub CLI (`gh`) yüklü olmalı
- Evidence klasörü mevcut olmalı (önce `collect-evidence.ps1` çalıştır)

**Çıktı:**
- Draft PR (GitHub)
- `docs/PR_SUMMARY.md` dosyası

---

### 3. `smoke-ui.ps1`
UI smoke test scripti. 6 kritik endpoint'i test eder.

**Çalıştırma:**
```powershell
pwsh scripts/smoke-ui.ps1
```

**Test Edilen Endpoint'ler:**
- `/` (Dashboard)
- `/portfolio`
- `/strategies`
- `/running`
- `/settings`
- `/api/health`

**Çıktı:**
```json
{
  "timestamp": "2025-10-27 15:30:00",
  "total": 6,
  "pass": 6,
  "fail": 0,
  "status": "PASS"
}
```

---

### 4. `canary-ui-smoke.ps1`
Canary smoke test scripti. Production validation için kullanılır.

**Çalıştırma:**
```powershell
pwsh scripts/canary-ui-smoke.ps1
```

**Parametreler:**
```powershell
pwsh scripts/canary-ui-smoke.ps1 -BaseUrl "http://localhost:3003" -Retries 3 -SleepSeconds 5
```

**Testler:**
1. Health Check (retry ile)
2. Critical Pages (5 route)
3. Lighthouse (performance)
4. Bundle Size (<250 MB)

**Exit Codes:**
- `0` — Success (GO)
- `1` — Failure (NO-GO, rollback önerilir)

---

### 5. `take-screenshots.ps1`
Screenshot capture scripti (opsiyonel). Chrome/Chromium ile headless screenshot alır.

**Çalıştırma:**
```powershell
pwsh scripts/take-screenshots.ps1
```

**Parametreler:**
```powershell
pwsh scripts/take-screenshots.ps1 -BaseUrl "http://localhost:3003" -OutputDir "evidence/screenshots"
```

**Gereksinimler:**
- Chrome veya Chromium yüklü olmalı

**Çıktı:**
```
evidence/screenshots/
├── home.png
├── portfolio.png
├── strategies.png
├── running.png
└── settings.png
```

---

### 6. `ui-reconstruction-master.ps1`
Master script. Tüm adımları sırasıyla çalıştırır.

**Çalıştırma:**
```powershell
# Tüm adımlar
pwsh scripts/ui-reconstruction-master.ps1

# Screenshot atla
pwsh scripts/ui-reconstruction-master.ps1 -SkipScreenshots

# PR oluşturma atla
pwsh scripts/ui-reconstruction-master.ps1 -SkipPR

# Canary atla
pwsh scripts/ui-reconstruction-master.ps1 -SkipCanary
```

**Akış:**
1. Evidence toplama → `collect-evidence.ps1`
2. Screenshots (opsiyonel) → `take-screenshots.ps1`
3. PR oluşturma → `create-ui-pr.ps1`
4. Canary smoke (manuel onay) → `canary-ui-smoke.ps1`

---

## 🛡️ Rollback Script (Manual)

**Senaryo:** Canary fail veya production'da sorun

```powershell
# Feature flag kapat
Add-Content -Path "apps/web-next/.env" -Value "ENABLE_NEW_UI=false"

# Rebuild + restart
pnpm -F web-next build
pnpm -F web-next start:prod:standalone

# Verify
curl http://127.0.0.1:3003/api/health
```

---

## 📋 Workflow

```
┌─────────────────────────────────────────────────┐
│ 1. Lokal validation koş (Lighthouse + Axe)     │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 2. Evidence topla: collect-evidence.ps1         │
│    Output: evidence/ui-reconstruction-YYYYMMDD/ │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 3. PR oluştur: create-ui-pr.ps1                 │
│    Output: Draft PR (GitHub)                    │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 4. CI checks bekle (18 workflows)               │
│    Command: gh pr checks <PR> --watch           │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 5. PR ready + merge                             │
│    gh pr ready <PR>                             │
│    gh pr merge <PR> --squash --delete-branch    │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 6. Canary smoke: canary-ui-smoke.ps1            │
│    Exit 0 → GO / Exit 1 → NO-GO (rollback)     │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 7. Cutover: GO_NO_GO_CHECKLIST.md doldur        │
│    Day-0 metrics topla                          │
│    Monitoring aktif (Prometheus + Grafana)      │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria

| Adım | Süre | Başarı Kriteri |
|------|------|----------------|
| Evidence toplama | <2 min | Tüm dosyalar oluştu |
| PR oluşturma | <3 min | Draft PR açıldı |
| CI checks | <10 min | 18/18 workflow green |
| Canary smoke | <5 min | Health + Pages + Bundle PASS |
| Rollback | ≤5 min | Feature flag + restart |

---

## 📚 İlgili Dokümanlar

- **[UI_RECONSTRUCTION_RUNBOOK.md](../docs/UI_RECONSTRUCTION_RUNBOOK.md)** — Detaylı runbook
- **[GO_NO_GO_CHECKLIST.md](../GO_NO_GO_CHECKLIST.md)** — Cutover checklist
- **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** — Sorun giderme
- **[INSTANT_FIX.md](../INSTANT_FIX.md)** — Hızlı kurtarma

---

**Hazırlayan:** cursor (Claude Sonnet 4.5)  
**Tarih:** 27 Ekim 2025  
**Versiyon:** 1.0.0
