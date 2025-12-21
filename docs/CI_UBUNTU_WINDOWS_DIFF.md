# CI Ubuntu vs Windows Render Farkı — Çözüm Rehberi

Durum: Sorun giderme / alternatif çözümler

Sürüm: 1.0

---

## 0) Sorun

**Belirti:**
- Local (Windows) testler PASS
- CI (Ubuntu) testler FAIL (snapshot diff)
- Diff'te font render farkları, layout kaymaları görülüyor

**Neden:**
- Ubuntu ve Windows farklı font rendering kullanır
- Sistem fontları farklı (Arial vs DejaVu Sans)
- Anti-aliasing farkları
- Pixel density farkları

---

## 1) Çözüm A: Windows Runner Kullan

**Avantaj:** Local ile CI aynı render engine (tutarlı)

**Değişiklik:**
```yaml
# .github/workflows/ui-visual-regression.yml
jobs:
  visual:
    runs-on: windows-latest  # ubuntu-latest yerine
    timeout-minutes: 20
```

**Notlar:**
- Windows runner biraz daha yavaş olabilir
- PowerShell script'leri zaten hazır (`ci-visual-regression.ps1`)
- Font rendering local ile %100 aynı

---

## 2) Çözüm B: Playwright Docker Image Kullan

**Avantaj:** Tam deterministik ortam (her yerde aynı)

**Değişiklik:**
```yaml
# .github/workflows/ui-visual-regression.yml
jobs:
  visual:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.56.1-focal
      options: --user root
    timeout-minutes: 20
```

**Notlar:**
- Docker container içinde çalışır
- Font rendering tam kontrol altında
- Daha yavaş başlangıç (image pull)
- Network ayarları gerekebilir (host network)

**Alternatif (Playwright'ın resmi Docker image'ı):**
```yaml
container:
  image: mcr.microsoft.com/playwright:v1.56.1-focal
  options: --user root --network host
```

---

## 3) Karar Matrisi

| Çözüm | Hız | Tutarlılık | Karmaşıklık | Öneri |
|-------|-----|------------|-------------|-------|
| **A) Windows Runner** | Orta | Yüksek (local ile aynı) | Düşük | ✅ **Önerilen** (local Windows ise) |
| **B) Docker Image** | Yavaş | Çok Yüksek (deterministik) | Orta | ✅ Alternatif (cross-platform) |

---

## 4) Uygulama

### 4.1 Çözüm A'yı Seçersen (Windows Runner)

**Değişiklik:**
```yaml
# .github/workflows/ui-visual-regression.yml
jobs:
  visual:
    runs-on: windows-latest  # Değişiklik burada
```

**Script:**
- `ci-visual-regression.ps1` kullan (zaten hazır)
- Bash script'e gerek yok

**Test:**
```yaml
- name: Run visual regression (golden master)
  run: powershell -File apps/web-next/scripts/ci-visual-regression.ps1
```

### 4.2 Çözüm B'yi Seçersen (Docker)

**Değişiklik:**
```yaml
# .github/workflows/ui-visual-regression.yml
jobs:
  visual:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.56.1-focal
      options: --user root --network host
```

**Notlar:**
- Container içinde Node/pnpm kurulumu gerekebilir
- Network ayarları (host network) gerekli
- Font rendering tam kontrol altında

---

## 5) İlk PR'da Diff Çıkarsa

**Akış:**
1. PR açıldı, CI fail oldu
2. Artifact indir (`playwright-report/`)
3. Diff'e bak:
   - **Font farkı** → Bu dokümana göre A veya B'yi uygula
   - **Layout farkı** → Gerçek bug olabilir, kontrol et
   - **Renk farkı** → Color profile farkı, genelde ignore edilebilir

**Aksiyon:**
```bash
# Çözüm A'yı uygula (Windows runner)
# .github/workflows/ui-visual-regression.yml'de runs-on: windows-latest yap

# Baseline snapshot'ları Windows'ta yeniden oluştur
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts --update-snapshots

# Commit + push
git add apps/web-next/tests/visual
git commit -m "chore(ci): switch to windows-latest for visual regression (font consistency)"
git push
```

---

## 6) Hızlı Referans

### 6.1 Windows Runner (Çözüm A)

**Workflow:**
```yaml
runs-on: windows-latest
```

**Script:**
```powershell
powershell -File apps/web-next/scripts/ci-visual-regression.ps1
```

### 6.2 Docker Image (Çözüm B)

**Workflow:**
```yaml
runs-on: ubuntu-latest
container:
  image: mcr.microsoft.com/playwright:v1.56.1-focal
  options: --user root --network host
```

**Script:**
```bash
bash apps/web-next/scripts/ci-visual-regression.sh
```

---

## 7) İlgili Dokümanlar

- `docs/BASELINE_SNAPSHOTS.md` - Baseline snapshot oluşturma
- `docs/CI_PR_SMOKE_RCA.md` - CI/PR Smoke & RCA karar ağacı
- `.github/workflows/ui-visual-regression.yml` - GitHub Actions workflow

