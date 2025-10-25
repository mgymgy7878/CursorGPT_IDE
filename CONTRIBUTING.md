# Contributing to Spark Trading Platform

Katkıda bulunduğunuz için teşekkürler! Aşağıdaki kurallar projemizin kalitesini ve güvenliğini korumak için kritiktir.

---

## 📋 Pull Request Kuralları

### 1. UX-ACK Zorunluluğu

**Her PR açıklamasında `UX-ACK:` satırı zorunludur.**

```markdown
UX-ACK: ✅ I reviewed the changes and confirm [brief description]
```

Bu kural `.github/workflows/ux-ack.yml` tarafından otomatik olarak kontrol edilir.

### 2. Fork Guard Zorunluluğu (Secrets için)

**Secrets kullanan tüm GitHub Actions workflow adımlarında fork guard zorunludur:**

```yaml
- name: Step using secrets
  if: ${{ !github.event.pull_request.head.repo.fork }}
  env:
    SECRET_KEY: ${{ secrets.SECRET_KEY }}
  run: |
    # your code
```

**Neden gerekli?**
- Fork PR'lar varsayılan olarak repository secrets'larına erişemez (GitHub güvenlik politikası)
- Fork guard olmadan workflow fail eder
- Guard validator (`.github/workflows/guard-validate.yml`) bu kuralı otomatik kontrol eder

**Yerel doğrulama:**
```powershell
powershell -ExecutionPolicy Bypass -File .github/scripts/validate-workflow-guards.ps1
```

### 3. Path Filters (CI Verimliliği)

Workflow'lar yalnızca ilgili değişikliklerde çalışır:

**Docs Lint:**
- Trigger: `docs/**`, `README.md`
- Skip: `.github/**`, `apps/**`, `services/**`

**Headers & Standards:**
- Trigger: `apps/**`, `services/**`, `deploy/nginx/**`
- Skip: `**/*.md`, `docs/**`

**CI Verify:**
- Trigger: `**/*.ts`, `**/*.tsx`, `apps/**`, `services/**`
- Skip: `docs/**`, `.github/**`

**Guard Validate:**
- Trigger: `.github/workflows/**`, `.github/scripts/**`, `.github/*.md`

---

## 🔧 Yerel Geliştirme

### Kurulum
```bash
# Dependencies
pnpm -w install

# Development
pnpm --filter web-next dev          # Frontend (port 3003)
pnpm --filter @spark/executor dev   # Executor service
```

### Test
```bash
# Unit tests
pnpm test

# E2E tests
pnpm --filter web-next test:e2e

# Type check
pnpm -w -r typecheck
```

### Lint
```bash
# ESLint
pnpm --filter web-next lint

# Markdownlint (docs)
markdownlint docs/**/*.md

# Guard validator
./.github/scripts/validate-workflow-guards.ps1
```

---

## 📦 Commit Kuralları

**Conventional Commits kullanıyoruz:**

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**
- `feat`: Yeni özellik
- `fix`: Bug fix
- `docs`: Dokümantasyon
- `ci`: CI/CD değişiklikleri
- `perf`: Performance iyileştirmesi
- `refactor`: Refactoring
- `test`: Test ekleme/düzeltme
- `chore`: Dependency updates, etc.

**Örnekler:**
```
feat(dashboard): add error budget widget
fix(executor): handle reconnection on WebSocket disconnect
docs(api): update strategy endpoints
ci(guards): add fork guard to canary workflow
```

---

## 🚀 PR Süreci

### 1. Branch Oluştur
```bash
git checkout -b feat/my-feature
# or
git checkout -b fix/bug-description
```

### 2. Değişiklikleri Yap
- Küçük, odaklı commit'ler
- Test ekle/güncelle
- Dokümantasyonu güncelle

### 3. Yerel Doğrulama
```bash
pnpm typecheck
pnpm test
pnpm lint
```

### 4. PR Aç
- **Başlık:** Conventional commit formatı
- **Açıklama:** Değişiklikleri açıkla
- **UX-ACK:** Zorunlu satırı ekle

```markdown
## UX-ACK Onayı

UX-ACK: ✅ I reviewed the changes; [brief description]. No runtime impact.

## Summary
- Feature X added
- Test coverage: 85%
- No breaking changes

## Testing
- Unit tests: PASS
- E2E tests: PASS
- Local smoke: PASS
```

### 5. CI Kontrolleri
PR açıldığında otomatik çalışan kontroller:
- ✅ UX-ACK Gate
- ✅ Guard Validate (eğer `.github/` değişti)
- ✅ Docs Lint (eğer `docs/` değişti)
- ✅ Headers Smoke (eğer app/service değişti)
- ✅ CI (eğer kod değişti)

### 6. Review & Merge
- En az 1 onay gerekli
- Tüm CI checks green olmalı
- Squash merge tercih edilir

---

## 🔐 Güvenlik

### Secret Kullanımı
- **Asla** hardcoded secret commit etme
- GitHub Secrets kullan
- Her secret-using step'e fork guard ekle

### Dependency Updates
- `pnpm audit` düzenli çalıştır
- Kritik güvenlik güncellemelerini hemen yap
- CHANGELOG'u güncelle

---

## 📝 Dokümantasyon

### Markdown Standartları
- Markdownlint kurallarına uy (`.markdownlint.json`)
- YAML frontmatter `.github/*.md` dosyalarında zorunlu:

```yaml
---
Title: Document Title
Owner: Spark Eng (Platform)
Status: Stable
LastUpdated: YYYY-MM-DD
Links: PR-#XXX
---
```

### API Dokümantasyonu
- Yeni endpoint eklendiğinde `docs/API.md` güncelle
- OpenAPI/Swagger spec kullan (gelecekte)

---

## 🐛 Bug Raporlama

GitHub Issues kullan:

```markdown
**Bug Tanımı**
Kısa ve net açıklama.

**Reproduksiyon Adımları**
1. Şunu yap
2. Bunu gör

**Beklenen Davranış**
Ne olmalıydı?

**Gerçek Davranış**
Ne oldu?

**Çevre**
- OS: [Windows/Linux/macOS]
- Node: [version]
- Browser: [if applicable]

**Ekran Görüntüsü / Log**
[varsa ekle]
```

---

## 🎯 Özellik İstekleri

```markdown
**Özellik Açıklaması**
Ne istiyorsunuz?

**Kullanım Senaryosu**
Neden gerekli?

**Önerilen Çözüm**
Nasıl implemente edilmeli? (opsiyonel)

**Alternatifler**
Başka çözümler düşündünüz mü?
```

---

## 📚 Kaynaklar

- **Main README:** [README.md](README.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API Docs:** [docs/API.md](docs/API.md)
- **Workflows:** [.github/workflows/](.github/workflows/)
- **Guard Validator:** [.github/scripts/validate-workflow-guards.ps1](.github/scripts/validate-workflow-guards.ps1)

---

## 🤝 Yardım

Sorunuz mu var? 

- GitHub Discussions kullanın
- Issue açın
- Mevcut dokümantasyonu inceleyin

**Katkılarınız için teşekkürler!** 🚀

