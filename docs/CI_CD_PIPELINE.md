cursor (Claude 3.5 Sonnet): CI/CD Pipeline Integration — DOCUMENTATION

# CI/CD Pipeline Integration

## 🔄 Genel Bakış

GitHub Actions ile entegre edilmiş CI/CD pipeline, cursor header kontrolü ve güvenlik taramasını otomatikleştirir. PR'lar için kalite kapıları ve otomatik düzeltme mekanizmaları içerir.

## 📋 Özellikler

- ✅ **Multi-Platform Testing** - Windows, macOS, Linux parallel execution
- ✅ **Auto-Fix Integration** - Otomatik cursor header düzeltme
- ✅ **Quality Gates** - PR'ları bloklayan kalite kontrolleri
- ✅ **Security Scanning** - Gitleaks + CodeQL + Dependency audit
- ✅ **Status Checks** - PR'da görünür durum kontrolleri
- ✅ **Artifact Management** - Hata durumunda dosya yedekleme
- ✅ **Notification System** - PR comment'ları ile bildirim
- ✅ **Cache Optimization** - Hızlı build için cache sistemi

## 🚀 Workflow Dosyaları

### 1. Cursor Header Check (`cursor-header-check.yml`)

**Trigger:** PR ve push (docs/, runtime/logs/, reports/ klasörleri)

**Jobs:**
- `cursor-header-check`: Multi-platform validation
- `security-scan`: Gitleaks integration
- `quality-gate`: Final status check

**Özellikler:**
- Auto-fix ve commit
- PR comment'ları
- Artifact upload
- Status check

### 2. Security Scan (`security-scan.yml`)

**Trigger:** PR, push, scheduled (daily)

**Jobs:**
- `gitleaks`: Secrets detection
- `dependency-check`: npm/pnpm audit
- `codeql`: Static analysis

**Özellikler:**
- SARIF report upload
- PR comment'ları
- Scheduled scanning

## 🔧 Konfigürasyon

### Repository Secrets

```bash
# GitHub repository settings > Secrets and variables > Actions
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Otomatik
SLACK_WEBHOOK_URL: https://hooks.slack.com/...  # Opsiyonel
DISCORD_WEBHOOK_URL: https://discord.com/api/webhooks/...  # Opsiyonel
```

### Branch Protection Rules

```yaml
# Repository settings > Branches > Add rule
Branch name pattern: main
Require status checks to pass before merging:
  - Cursor Header & Security
  - Gitleaks Security Scan
  - CodeQL Analysis
```

### Workflow Permissions

```yaml
# .github/workflows/cursor-header-check.yml
permissions:
  contents: read
  pull-requests: write
  security-events: write
```

## 📊 Workflow Akışı

### PR Açıldığında

1. **Trigger Detection**
   - Dosya değişiklikleri kontrol edilir
   - docs/, runtime/logs/, reports/ klasörleri

2. **Cursor Header Check**
   - Multi-platform parallel execution
   - Windows, macOS, Linux + Node 18, 20

3. **Auto-Fix Process**
   - Guard failure → Auto-fix → Re-check
   - Git commit ile otomatik düzeltme

4. **Security Scan**
   - Gitleaks secrets detection
   - Dependency vulnerability check
   - CodeQL static analysis

5. **Quality Gate**
   - Tüm job'ların sonuçları kontrol edilir
   - PR status güncellenir

6. **Notification**
   - PR comment'ı oluşturulur
   - Status check eklenir

### Push (Main/Develop)

1. **Same Process as PR**
   - Tüm kontroller çalışır
   - Auto-fix aktif

2. **Artifact Management**
   - Failure durumunda dosyalar yedeklenir
   - 7 gün retention

## 🧪 Test Senaryoları

### 1. Başarılı PR

```bash
# 1. Yeni branch oluştur
git checkout -b feature/test-cursor-headers

# 2. Doğru formatta dosya ekle
echo "cursor (Claude 3.5 Sonnet): Test Report" > docs/test.md

# 3. Commit ve push
git add docs/test.md
git commit -m "feat: add test report"
git push origin feature/test-cursor-headers

# 4. PR oluştur
# GitHub'da PR aç → Workflow çalışır → ✅ PASSED
```

### 2. Yanlış Format PR

```bash
# 1. Yanlış formatta dosya ekle
echo "# Test Report" > docs/wrong.md
echo "cursor (Claude 3.5 Sonnet): Test Report" >> docs/wrong.md

# 2. Commit ve push
git add docs/wrong.md
git commit -m "feat: add wrong format report"
git push origin feature/test-cursor-headers

# 3. PR'da workflow çalışır
# 🔧 AUTO-FIXED → Otomatik düzeltme ve commit
```

### 3. Security Violation

```bash
# 1. Secret içeren dosya ekle
echo "API_KEY=sk-1234567890abcdef" > config.env

# 2. Commit ve push
git add config.env
git commit -m "feat: add config"
git push origin feature/test-security

# 3. PR'da security scan çalışır
# ❌ FAILED → Secret detected
```

## 📈 Monitoring ve Analytics

### Workflow Metrics

```yaml
# GitHub Actions Insights
- Success Rate: %95+
- Average Duration: 3-5 minutes
- Auto-fix Rate: %80+
- Security Findings: < 5 per month
```

### Status Dashboard

```bash
# Repository > Actions > Insights
# - Workflow runs
# - Success/failure rates
# - Duration trends
# - Job performance
```

## 🔧 Troubleshooting

### 1. Workflow Failure

```bash
# Check logs
# GitHub > Actions > Workflow runs > Failed run > View logs

# Common issues:
# - Node version mismatch
# - Permission denied
# - Network timeout
# - Dependency conflicts
```

### 2. Auto-fix Not Working

```bash
# Check permissions
# Repository > Settings > Actions > General > Workflow permissions

# Verify git config
# Workflow > Auto-fix step > View logs
```

### 3. Security Scan Issues

```bash
# Check Gitleaks config
# .gitleaks.toml dosyasını kontrol et

# Verify secrets
# Repository > Settings > Secrets and variables > Actions
```

## 🚀 Advanced Features

### 1. Slack/Discord Integration

```yaml
# .github/workflows/cursor-header-check.yml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#ci-cd'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2. Custom Patterns

```javascript
// tools/guards/cursor-header-guard.js
// Regex pattern'ı genişlet
const patterns = [
  /^cursor\s*\(.+?\):\s*/i,
  /^chatgpt\s*\(.+?\):\s*/i,
  /^mehmet\s*\(.+?\):\s*/i
];
```

### 3. Performance Optimization

```yaml
# Cache strategies
- name: Cache node_modules
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
      */*/node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## 📊 Reporting

### PR Comments

```
✅ Cursor Header Check: PASSED

All cursor headers are correctly positioned at line 1.

Details:
- OS: ubuntu-latest
- Node: 20
- Status: success
- Auto-fix: skipped
```

### Status Checks

```
Cursor Header & Security
✅ All quality checks passed
```

### Artifacts

```
cursor-header-failures-ubuntu-latest-20.zip
├── docs/
├── runtime/logs/
└── reports/
```

## 🔄 Güncellemeler

### v1.1 (Gelecek)
- [ ] Slack/Discord webhook integration
- [ ] Advanced pattern matching
- [ ] Performance optimization
- [ ] Custom notification templates

### v1.2 (Gelecek)
- [ ] Multi-repo support
- [ ] Advanced analytics
- [ ] Custom quality gates
- [ ] Rollback protection

## 📞 Destek

### Dokümantasyon
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

### Community
- [GitHub Actions Community](https://github.com/actions)
- [Security Tools](https://github.com/topics/security-tools)

---

**CI/CD Pipeline Integration** - Otomatik kalite kontrol ve güvenlik taraması sistemi 🚀 