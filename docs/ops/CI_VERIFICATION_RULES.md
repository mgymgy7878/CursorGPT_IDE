# CI Verification Kuralları

**Amaç:** CI/CD pipeline'ında tutarlı ve deterministik verification.

---

## 🔄 Verify:CI Seviyeleri

### 1. Minimum CI (PR/Her Commit)
**Komut:** `pnpm verify:ci`

**İçerik:**
- ✅ `pnpm -w -r typecheck` - Tüm workspace'lerde type check
- ✅ `verify:final -SkipExecutorCheck` - Verification script (Executor check skip)

**Neden SkipExecutorCheck?**
- CI ortamında Executor servisi olmayabilir
- Type safety ve script çalışabilirliği kontrolü yeterli
- Hızlı feedback (PR'lar için ideal)

**Kullanım:**
```yaml
# .github/workflows/ci.yml
- name: Verify CI
  run: pnpm verify:ci
```

---

### 2. Full CI (Release Tag/RC Öncesi)
**Komut:** `pnpm verify:ci:full`

**İçerik:**
- ✅ `pnpm -w -r typecheck` - Tüm workspace'lerde type check
- ✅ `verify:final` (SkipExecutorCheck OLMADAN) - Pozitif kanıt paketi

**Neden Full?**
- Release öncesi tüm sistemin çalıştığından emin olmak gerekli
- Executor healthy kontrolü şart
- Altın sinyaller (healthy + db:connected + verified:true) kontrol edilmeli

**Gereksinimler:**
- Executor servisi çalışıyor olmalı
- PostgreSQL container healthy olmalı
- Yaklaşık 10-15 saniye Executor'ın başlaması beklenmeli

**Kullanım:**
```yaml
# .github/workflows/release.yml
- name: Start Services
  run: |
    docker compose up -d postgres
    pnpm --filter @spark/executor dev &
    sleep 15  # Executor başlamasını bekle

- name: Verify Full CI
  run: pnpm verify:ci:full
```

---

## 📋 CI Checklist

### Her PR/Commit
- [ ] `pnpm verify:ci` başarılı
- [ ] Type check geçti
- [ ] Verification script çalıştı (skip ile)

### Release Tag/RC Öncesi
- [ ] `pnpm verify:ci:full` başarılı
- [ ] Type check geçti
- [ ] Verification script çalıştı (skip olmadan)
- [ ] Executor healthy kontrolü geçti
- [ ] Altın sinyaller yeşil

---

## 🔒 Encoding Disiplini

**PowerShell Script'ler:**
- ✅ `Set-Content -Encoding utf8` kullanılmalı (PS7+)
- ❌ `Out-File -Encoding utf8` kullanılmamalı (eski syntax)
- ✅ **PowerShell 7+ zorunlu** (version guard ile kontrol edilir)

**Neden?**
- Checksum tutarlılığı için encoding sabit kalmalı
- JSON/JSONL export'larda encoding farkı checksum hatası yaratır
- PS7+ `Set-Content` daha güvenilir
- PS5.1 vs PS7 encoding farklılıkları (BOM/newline) checksum tutarsızlığı yaratır

**Dosya:** `docs/ops/POWERSHELL_VERSION_REQUIREMENT.md`

**Örnek:**
```powershell
# ✅ Doğru
$content | Set-Content -Encoding utf8 -Path $path

# ❌ Yanlış
$content | Out-File -Encoding utf8 $path
```

---

## 🎯 CI Workflow Örnekleri

### PR Workflow
```yaml
name: CI
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm verify:ci
```

### Release Workflow
```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: spark_trading
          POSTGRES_USER: spark_user
          POSTGRES_PASSWORD: spark_secure_password_2024
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: docker compose up -d postgres
      - run: pnpm exec prisma migrate deploy
      - run: pnpm --filter @spark/executor dev &
      - run: sleep 15
      - run: pnpm verify:ci:full
```

---

**Bu kurallar, CI'da tutarlı ve deterministik verification sağlar.**

