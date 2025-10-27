cursor (Claude 3.5 Sonnet): Branch Protection Setup — DOCUMENTATION

# Branch Protection Rules Setup

## 🔒 Genel Bakış

GitHub repository'de branch protection rules ayarlayarak, cursor header guard ve security scanning'i zorunlu hale getirir. Bu sayede PR'lar sadece tüm kalite kontrollerini geçtikten sonra merge edilebilir.

## 📋 Gerekli Status Checks

### Cursor Guard Checks
- `Cursor Guard (Node 20 · ubuntu-latest)`
- `Cursor Guard (Node 20 · windows-latest)`
- `Cursor Guard (Node 20 · macos-latest)`

### Security Checks
- `Secret Guard (Gitleaks v8.18.4)`
- `CodeQL (JS/TS)` (opsiyonel)

## 🚀 Kurulum Adımları

### 1. Repository Settings

1. GitHub repository'ye git
2. **Settings** tab'ına tıkla
3. Sol menüden **Branches** seç
4. **Add rule** butonuna tıkla

### 2. Branch Name Pattern

```
Branch name pattern: main
```

### 3. Protection Rules

#### ✅ Require a pull request before merging
- **Require pull request reviews before merging**: ✅
- **Required approving reviews**: `1` (veya daha fazla)
- **Dismiss stale PR approvals when new commits are pushed**: ✅
- **Require review from code owners**: ✅ (eğer CODEOWNERS varsa)

#### ✅ Require status checks to pass before merging
- **Require branches to be up to date before merging**: ✅
- **Status checks that are required**:
  - `Cursor Guard (Node 20 · ubuntu-latest)`
  - `Secret Guard (Gitleaks v8.18.4)`
  - `CodeQL (JS/TS)` (opsiyonel)

#### ✅ Require conversation resolution before merging
- **Require conversation resolution before merging**: ✅

#### ✅ Require signed commits
- **Require signed commits**: ✅ (opsiyonel, güvenlik için)

#### ✅ Require linear history
- **Require linear history**: ✅ (opsiyonel, temiz git history için)

#### ✅ Require deployments to succeed before merging
- **Require deployments to succeed before merging**: ✅ (eğer deployment varsa)

### 4. Restrict pushes that create files that are too large
- **Restrict pushes that create files that are too large**: ✅
- **Maximum file size**: `100 MB`

### 5. Allow force pushes
- **Allow force pushes**: ❌ (güvenlik için kapalı)

### 6. Allow deletions
- **Allow deletions**: ❌ (güvenlik için kapalı)

## 🔧 Konfigürasyon Örnekleri

### Minimal Setup (Sadece Cursor Guard)

```yaml
# Repository > Settings > Branches > Add rule
Branch name pattern: main

Protection rules:
✅ Require a pull request before merging
  - Require pull request reviews before merging: ✅
  - Required approving reviews: 1

✅ Require status checks to pass before merging
  - Require branches to be up to date before merging: ✅
  - Status checks:
    - Cursor Guard (Node 20 · ubuntu-latest)
    - Secret Guard (Gitleaks v8.18.4)

✅ Require conversation resolution before merging: ✅
```

### Full Security Setup

```yaml
# Repository > Settings > Branches > Add rule
Branch name pattern: main

Protection rules:
✅ Require a pull request before merging
  - Require pull request reviews before merging: ✅
  - Required approving reviews: 2
  - Dismiss stale PR approvals when new commits are pushed: ✅
  - Require review from code owners: ✅

✅ Require status checks to pass before merging
  - Require branches to be up to date before merging: ✅
  - Status checks:
    - Cursor Guard (Node 20 · ubuntu-latest)
    - Cursor Guard (Node 20 · windows-latest)
    - Cursor Guard (Node 20 · macos-latest)
    - Secret Guard (Gitleaks v8.18.4)
    - CodeQL (JS/TS)

✅ Require conversation resolution before merging: ✅
✅ Require signed commits: ✅
✅ Require linear history: ✅
✅ Restrict pushes that create files that are too large: ✅ (100 MB)
```

## 🧪 Test Senaryoları

### 1. Başarılı PR

```bash
# 1. Feature branch oluştur
git checkout -b feature/test-protection

# 2. Doğru formatta dosya ekle
echo "cursor (Claude 3.5 Sonnet): Test Report" > docs/test.md

# 3. Commit ve push
git add docs/test.md
git commit -m "feat: add test report"
git push origin feature/test-protection

# 4. PR oluştur
# GitHub'da PR aç → Status checks çalışır → ✅ PASSED → Merge edilebilir
```

### 2. Başarısız PR (Cursor Header Hatası)

```bash
# 1. Yanlış formatta dosya ekle
echo "# Test Report" > docs/wrong.md
echo "cursor (Claude 3.5 Sonnet): Test Report" >> docs/wrong.md

# 2. Commit ve push
git add docs/wrong.md
git commit -m "feat: add wrong format report"
git push origin feature/test-protection

# 3. PR'da status check çalışır
# ❌ FAILED → Cursor Guard (Node 20 · ubuntu-latest) failed
# Merge butonu devre dışı
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
# ❌ FAILED → Secret Guard (Gitleaks v8.18.4) failed
# Merge butonu devre dışı
```

## 📊 Status Check Monitoring

### PR Status Checks

```
✅ Cursor Guard (Node 20 · ubuntu-latest)
✅ Cursor Guard (Node 20 · windows-latest)
✅ Cursor Guard (Node 20 · macos-latest)
✅ Secret Guard (Gitleaks v8.18.4)
✅ CodeQL (JS/TS)
```

### Failed Status Check

```
❌ Cursor Guard (Node 20 · ubuntu-latest)
✅ Cursor Guard (Node 20 · windows-latest)
✅ Cursor Guard (Node 20 · macos-latest)
✅ Secret Guard (Gitleaks v8.18.4)
✅ CodeQL (JS/TS)

Details: Some cursor headers are incorrectly positioned.
```

## 🔧 Troubleshooting

### 1. Status Check Görünmüyor

```bash
# Çözüm: Workflow'u manuel tetikle
# GitHub > Actions > CI — Cursor Guard & Security > Run workflow

# Veya PR'da yeni commit push et
git commit --allow-empty -m "trigger workflow"
git push origin feature/branch
```

### 2. Status Check Sürekli Failed

```bash
# Çözüm: Local'de test et
pnpm guard:cursor
pnpm fix:cursor

# Düzeltmeleri commit et
git add -A
git commit -m "fix: correct cursor headers"
git push origin feature/branch
```

### 3. Auto-fix Çalışmıyor

```bash
# Çözüm: Fork PR'larında auto-fix kapalı
# Same-repo PR'larda çalışır

# Manuel düzeltme gerekli
pnpm fix:cursor
git add -A
git commit -m "fix: cursor headers"
git push origin feature/branch
```

## 🚀 Advanced Configuration

### Multiple Branches

```yaml
# main branch
Branch name pattern: main
Protection rules: [tüm kurallar]

# develop branch
Branch name pattern: develop
Protection rules: [tüm kurallar]

# feature branches (opsiyonel)
Branch name pattern: feature/*
Protection rules: [sadece cursor guard]
```

### Custom Status Checks

```yaml
# Ek status checks ekle
Status checks:
  - Cursor Guard (Node 20 · ubuntu-latest)
  - Secret Guard (Gitleaks v8.18.4)
  - CodeQL (JS/TS)
  - Build Test
  - Unit Tests
  - Integration Tests
```

### Code Owners

```yaml
# .github/CODEOWNERS
# Tüm dosyalar için
* @spark-team

# Docs için
docs/ @spark-docs-team

# Security için
.github/workflows/ @spark-security-team
```

## 📈 Monitoring

### Branch Protection Analytics

```bash
# GitHub Insights > Branches
# - Protection status
# - Merge frequency
# - Status check success rates
# - Review times
```

### Status Check Metrics

```yaml
# GitHub Actions Insights
- Cursor Guard Success Rate: %95+
- Security Scan Success Rate: %98+
- Average Check Duration: 2-4 minutes
- Auto-fix Success Rate: %80+
```

## 🔄 Güncellemeler

### v1.1 (Gelecek)
- [ ] Custom status check patterns
- [ ] Advanced branch protection rules
- [ ] Automated compliance reporting
- [ ] Integration with external tools

### v1.2 (Gelecek)
- [ ] Multi-repo protection rules
- [ ] Advanced analytics dashboard
- [ ] Custom notification rules
- [ ] Automated remediation

## 📞 Destek

### Dokümantasyon
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [Required Reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)

### Community
- [GitHub Community](https://github.com/orgs/community/discussions)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**Branch Protection Setup** - Güvenli ve kaliteli PR merge süreci 🚀 