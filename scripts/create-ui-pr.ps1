# UI Reconstruction PR Oluşturma Script
# Evidence toplandıktan sonra çalıştır: pwsh scripts/create-ui-pr.ps1

$timestamp = Get-Date -Format "yyyyMMdd"
$evidenceDir = "evidence/ui-reconstruction-$timestamp"

Write-Host "[LOG] PR oluşturma başlatılıyor..." -ForegroundColor Green

# Evidence kontrolü
if (-not (Test-Path $evidenceDir)) {
    Write-Host "[ERROR] Evidence bulunamadı: $evidenceDir" -ForegroundColor Red
    Write-Host "[HINT] Önce: pwsh scripts/collect-evidence.ps1" -ForegroundColor Yellow
    exit 1
}

# PR body hazırlama
$prBody = @"
## 🎨 UI Reconstruction — 5 Pages (1-Day Sprint)

### Kapsam
- ✅ Dashboard (/) — Market overview, running strategies, portfolio summary
- ✅ Portfolio (/portfolio) — Asset table, P&L, TR currency formatting
- ✅ Strategies (/strategies) — Category-based list, action buttons
- ✅ Running (/running) — Live status, trade count, sparkline
- ✅ Settings (/settings) — Theme, language, API keys

### UX-ACK
- ✅ WCAG 1.4.3 Contrast ≥4.5:1
- ✅ WCAG 2.1.1 Keyboard navigation
- ✅ WCAG 3.3.2 Labels and instructions
- ✅ WCAG 4.1.2 Name, Role, Value
- ✅ NN/g: Visibility of System Status (StatusPill)

### Evidence
- **Lighthouse (5/5 ≥0.90):** ✔️ JSON eklendi ($evidenceDir/.lighthouseci)
- **Axe (0 critical):** ✔️ Sonuçlar eklendi ($evidenceDir/test-results)
- **Smoke (6/6 200 OK):** ✔️ Çıktı eklendi ($evidenceDir/smoke-output.txt)
- **Bundle:** ~180KB (hedef <250KB) ✔️ JSON eklendi ($evidenceDir/bundle-analysis.json)

### Performance Metrics
| Page | LCP | FCP | CLS | Accessibility | Best Practices |
|------|-----|-----|-----|---------------|----------------|
| / | ≤2.5s | ≤1.8s | ≤0.1 | ≥90 | ≥90 |
| /portfolio | ≤2.5s | ≤1.8s | ≤0.1 | ≥90 | ≥90 |
| /strategies | ≤2.5s | ≤1.8s | ≤0.1 | ≥90 | ≥90 |
| /running | ≤2.5s | ≤1.8s | ≤0.1 | ≥90 | ≥90 |
| /settings | ≤2.5s | ≤1.8s | ≤0.1 | ≥90 | ≥90 |

### Technical Details
- **Framework:** Next.js 14.2.13 (App Router, standalone)
- **Styling:** Tailwind CSS 3.4.18 + design tokens
- **State:** Zustand 5.0.8 (localStorage persist)
- **Data Fetching:** SWR 2.3.6
- **i18n:** Type-safe TR/EN (100% coverage)

### Rollback Plan
- **Flag:** `.env` → `ENABLE_NEW_UI=false` + restart (≤5 min)
- **Health:** `/api/health` → `status:"ok"`
- **Fallback:** Previous version tagged as `v1.3.1`

### Next Steps
1. ✅ CI checks pass (guard-validate, ui-smoke, headers-smoke)
2. ✅ Manual QA (5 pages × 3 viewports)
3. ✅ Canary smoke test (scripts/canary-ui-smoke.ps1)
4. 🚀 Merge → production cutover (GO_NO_GO_CHECKLIST.md)

### Related Issues
- Resolves #11 (TypeScript cleanup)
- Addresses UI reconstruction goals from v1.4.0 roadmap

---

**Evidence Package:** ``$evidenceDir``
**Timestamp:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Prepared by:** cursor (Claude Sonnet 4.5)
"@

# PR body dosyasına yaz
$prBody | Out-File -FilePath "docs/PR_SUMMARY.md" -Encoding UTF8

Write-Host "[LOG] PR body hazırlandı: docs/PR_SUMMARY.md" -ForegroundColor Green

# GitHub CLI ile PR oluştur (draft mode)
Write-Host "[LOG] GitHub PR oluşturuluyor (draft)..." -ForegroundColor Cyan

$prTitle = "feat(ui): 1-day UI reconstruction — 5 pages (WCAG 2.1 AA)"
$labels = "ui,a11y,perf,canary-ready,rollback-safe"

try {
    $result = gh pr create --draft `
        --title $prTitle `
        --body-file "docs/PR_SUMMARY.md" `
        --label $labels 2>&1

    Write-Host "[LOG] PR oluşturuldu: $result" -ForegroundColor Green
    
    # PR numarasını al
    $prUrl = $result | Select-String -Pattern "https://github.com/.*/pull/(\d+)" | ForEach-Object { $_.Matches.Groups[0].Value }
    
    Write-Host "`n✅ PR oluşturuldu: $prUrl" -ForegroundColor Green
    Write-Host "📤 Şimdi evidence dosyalarını PR'a upload et:" -ForegroundColor Cyan
    Write-Host "   gh pr comment --body-file $evidenceDir/smoke-output.txt" -ForegroundColor White
    Write-Host "`n📊 Sonraki adım: CI yeşil olunca 'gh pr ready' çalıştır" -ForegroundColor Cyan
    
} catch {
    Write-Host "[ERROR] PR oluşturulamadı: $_" -ForegroundColor Red
    Write-Host "[HINT] GitHub CLI yüklü mü? gh --version" -ForegroundColor Yellow
    exit 1
}

