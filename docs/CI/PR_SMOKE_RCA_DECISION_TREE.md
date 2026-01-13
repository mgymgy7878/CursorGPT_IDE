---
Title: CI PR Smoke Standalone Boot RCA Decision Tree
Owner: Spark Eng (Platform)
Status: Stable
LastUpdated: 2025-01-29
Links: PR-#XXX
---

# CI PR Smoke Standalone Boot RCA Decision Tree

## 🎯 Amaç

PR Smoke CI fail'lerini **1-2 dakika içinde** doğru dala düşürmek için interaktif karar ağacı rehberi.

**FigJam Diyagram:** [CI PR Smoke Standalone Boot RCA Decision Tree](https://www.figma.com/board/MKkDKEbZ1LmG33JbKQftm4/CI-PR-Smoke-Standalone-Boot-RCA-Decision-Tree?node-id=0-1)

> **Not:** FigJam linkini almak için: FigJam'de diyagram sayfasını aç → Share → Copy link (view erişimi yeterli). Yukarıdaki `<FIGJAM_LINKINIZ>` placeholder'ını gerçek link ile değiştirin.

---

## 📊 Karar Ağacı Adımları

### 1️⃣ Marker Log → Copy Script Çalıştı mı?

**Kontrol:** Build log'da marker'lar var mı?

```bash
# Build log'da şunları ara:
grep "\[copy-standalone-assets\] START" build.log
grep "\[copy-standalone-assets\] styled-jsx OK" build.log
```

**Dallanma:**

- ✅ **VAR** → 2️⃣'ye git (styled-jsx assert)
- ❌ **YOK** → **ROOT CAUSE:** `postbuild` script çalışmadı
  - **Fix:** `apps/web-next/package.json` → `"postbuild"` script kontrol et
  - **Fix:** `tools/copy-standalone-assets.cjs` dosyası mevcut mu?

---

### 2️⃣ styled-jsx OK + Assert → Standalone Ağacında Var mı?

**Kontrol:** Standalone build'de `styled-jsx/package.json` mevcut mu?

```bash
# İki olası path:
ls apps/web-next/.next/standalone/node_modules/styled-jsx/package.json
ls apps/web-next/.next/standalone/apps/web-next/node_modules/styled-jsx/package.json
```

**Dallanma:**

- ✅ **VAR** → 3️⃣'e git (Runtime "Cannot find module")
- ❌ **YOK** → **ROOT CAUSE:** Copy script çalıştı ama kopyalama başarısız
  - **Fix:** `tools/copy-standalone-assets.cjs` → `fs.cpSync` dereference kontrol et
  - **Fix:** pnpm store'da `styled-jsx` mevcut mu? (`pnpm list styled-jsx`)

---

### 3️⃣ Runtime "Cannot find module" → Hangi Bağlamda?

**Kontrol:** Server log'da hangi modül bulunamadı?

```bash
# Server log'da ara:
grep "Cannot find module" pr-smoke-server.log
```

**Dallanma:**

#### 3a. `require-hook` Bağlamında

- **Pattern:** `Error: Cannot find module 'styled-jsx'` (require-hook yüklendikten sonra)
- **ROOT CAUSE:** Isolate kopyasında modül eksik
- **Fix:** Isolate step'inde `rsync -aL --copy-unsafe-links` çalıştı mı?
- **Fix:** Broken symlink envanteri kontrol et (CI log'da `[pr-smoke] Broken symlink inventory`)

#### 3b. `NODE_PATH` Bağlamında

- **Pattern:** `Error: Cannot find module 'react'` (NODE_PATH ile resolve edilemedi)
- **ROOT CAUSE:** NODE_PATH yanlış veya eksik
- **Fix:** CI log'da `NODE_PATH=$RUNNER_TEMP/standalone-web-next/node_modules:...` kontrol et
- **Fix:** Isolate step'inde NODE_PATH doğru set edildi mi?

#### 3c. `cwd` Bağlamında

- **Pattern:** `Error: Cannot find module './server.js'` (working directory yanlış)
- **ROOT CAUSE:** `ISOLATED_SERVER_DIR` yanlış
- **Fix:** CI log'da `ISOLATED_SERVER_DIR=$RUNNER_TEMP/standalone-web-next/apps/web-next` kontrol et
- **Fix:** `find "$TARGET" -type f -name server.js` sonucu doğru mu?

#### 3d. Ancestor Leakage

- **Pattern:** `Error: Cannot find module 'next'` (ancestor node_modules'den yüklenmeye çalışıyor)
- **ROOT CAUSE:** Isolate başarısız, repo root'taki node_modules'e erişiyor
- **Fix:** Isolate step'inde `$RUNNER_TEMP` kullanıldı mı? (ancestor'dan izole)
- **Fix:** CI log'da `ISOLATED_STANDALONE_ROOT=$RUNNER_TEMP/standalone-web-next` kontrol et

---

### 4️⃣ Isolate + Dereference + Broken Symlink Inventory → Kopya Deterministik mi?

**Kontrol:** CI log'da broken symlink envanteri var mı?

```bash
# CI log'da ara:
grep "\[pr-smoke\] Broken symlink inventory" pr-smoke-server.log
grep "BROKEN:" pr-smoke-server.log
```

**Dallanma:**

- ✅ **0 broken symlink** → 5️⃣'e git (Require-hook preflight)
- ⚠️ **>0 broken symlink (pre-isolate)** → Normal (pnpm store symlink'leri)
- ❌ **>0 broken symlink (post-isolate)** → **ROOT CAUSE:** rsync dereference başarısız
  - **Fix:** `rsync -aL --copy-unsafe-links` çalıştı mı?
  - **Fix:** rsync exit code 23 → warning olarak loglandı mı?
  - **Fix:** Post-isolate broken symlink'ler kritik modülleri etkiliyor mu?

**Not:** rsync exit 23 (broken symlink) **warning** olarak kabul edilir, ama preflight fail ederse job fail eder.

---

### 5️⃣ Require-hook Preflight (next + styled-jsx + react + react-dom) → Server Start Öncesi Fail-Fast

**Kontrol:** Runtime preflight PASS mi?

```bash
# CI log'da ara:
grep "Runtime preflight" pr-smoke-server.log
grep "✅.*resolved:" pr-smoke-server.log
grep "❌.*resolution failed" pr-smoke-server.log
```

**Dallanma:**

- ✅ **TÜMÜ PASS** → 6️⃣'ye git (Server start)
- ❌ **BİRİ FAIL** → **ROOT CAUSE:** Kritik modül eksik (rsync 23'ten sonra gerçek eksik)
  - **Fix:** Hangi modül fail? (`next`, `styled-jsx`, `react`, `react-dom`, `scheduler`)
  - **Fix:** Isolate kopyasında modül mevcut mu? (`ls -la $RUNNER_TEMP/standalone-web-next/node_modules/...`)
  - **Fix:** require-hook altında resolve edilemiyor → NODE_PATH veya modül yapısı yanlış

**Kontrol Edilen Modüller:**

1. `next/package.json` (Next.js core)
2. `styled-jsx/package.json` (Next.js internal)
3. `react/package.json` (React core)
4. `react-dom/package.json` (React DOM)
5. `scheduler/package.json` (React internal, optional)

---

### 6️⃣ Server Start → Health Endpoint 200

**Kontrol:** `/api/health` 200 dönüyor mu?

```bash
# CI log'da ara:
grep "Health is up" pr-smoke-server.log
curl -fsS http://127.0.0.1:3003/api/health
```

**Dallanma:**

- ✅ **200 OK** → ✅ **PASS** (PR Smoke başarılı)
- ❌ **Timeout / 500 / Connection refused** → **ROOT CAUSE:** Server start başarısız
  - **Fix:** Server log'u kontrol et (`pr-smoke-server.log`)
  - **Fix:** Port 3003 kullanımda mı? (`lsof -i :3003`)
  - **Fix:** NODE_PATH doğru mu? (preflight PASS ama server start fail → runtime error)

---

## 🔍 Hızlı Debug Komutları

### CI Log'da Marker Kontrolü

```bash
# Build log'da marker'lar:
grep -E "\[copy-standalone-assets\] (START|styled-jsx OK)" build.log

# Isolate step'inde broken symlink:
grep "\[pr-smoke\] Broken symlink inventory" pr-smoke-server.log

# Runtime preflight:
grep -E "(Runtime preflight|✅.*resolved|❌.*resolution failed)" pr-smoke-server.log
```

### Local Test (WSL/Linux)

```bash
# Standalone build:
cd apps/web-next
pnpm build

# Copy assets:
node ../../tools/copy-standalone-assets.cjs

# Isolate test:
SOURCE=".next/standalone"
TARGET="/tmp/standalone-test"
rsync -aL --copy-unsafe-links "$SOURCE/" "$TARGET/"

# Broken symlink check:
find "$TARGET" -xtype l | wc -l

# Runtime preflight test:
cd "$TARGET/apps/web-next"
NODE_PATH="$TARGET/node_modules:$TARGET/apps/web-next/node_modules" \
  node -e "require('next/dist/server/require-hook'); \
    console.log('next:', require.resolve('next/package.json')); \
    console.log('react:', require.resolve('react/package.json')); \
    console.log('react-dom:', require.resolve('react-dom/package.json'));"
```

---

## 📋 Merge Checklist (CI Gate Odaklı)

PR merge edilmeden önce şunlar **PASS** olmalı:

- [ ] **pr-smoke içinde:** `[copy-standalone-assets] START` ve `styled-jsx OK` marker'ları var
- [ ] **pr-smoke içinde:** Broken symlink envanteri loglanıyor (pre/post isolate)
- [ ] **Runtime preflight:** `next`, `styled-jsx`, `react`, `react-dom` resolve PASS
- [ ] **rsync 23:** Warning olarak kabul ediliyor, preflight fail ederse job fail ediyor
- [ ] **Server log:** `Cannot find module ...` yok (preflight ile yakalanıyor)
- [ ] **/api/health:** 200 dönüyor ve route-200 timeout değil
- [ ] **Required checks:** ✅ → Squash & Merge + branch delete

### 🚦 Merge Hazırlık Kontrolü (Tek Komut)

**Hardening tamam ama merge = required check'ler yeşil olmalı.**

```bash
# PR numarasını parametre yap:
gh pr checks <PR_NO> --repo mgymgy7878/CursorGPT_IDE

# Örnek (PR #33 için):
gh pr checks 33 --repo mgymgy7878/CursorGPT_IDE

# Beklenen çıktı (tüm check'ler ✅):
# ✅ PR Smoke
# ✅ Validate Workflow Fork Guards
# ✅ ux_ack
```

**Yeşil olduğunda:**

1. GitHub web UI'dan **Squash & Merge** → branch delete (otomatik veya manuel)
2. Veya CLI ile:
   ```bash
   gh pr merge <PR_NO> --repo mgymgy7878/CursorGPT_IDE --squash --delete-branch
   # Örnek (PR #33 için):
   gh pr merge 33 --repo mgymgy7878/CursorGPT_IDE --squash --delete-branch
   ```

**Kırmızı check varsa:**

- [RCA Decision Tree](docs/CI/PR_SMOKE_RCA_DECISION_TREE.md) ile fail'i sınıflandır
- [FigJam Diyagram](https://www.figma.com/board/MKkDKEbZ1LmG33JbKQftm4/CI-PR-Smoke-Standalone-Boot-RCA-Decision-Tree?node-id=0-1) ile görsel rehberlik al

---

## 🎓 Öğrenilen Dersler

### rsync Exit 23 (Broken Symlink)

- **Davranış:** `--copy-unsafe-links` ile broken symlink'leri atlar, exit 23 döner
- **Yaklaşım:** 23'ü **warning** olarak kabul et, ama **preflight fail ederse job fail et**
- **Neden:** rsync 23 kritik modülleri atlayabilir → preflight deterministik yakalar

### Require-hook Preflight

- **Neden:** Server runtime ile aynı resolution path'i kullanır
- **Kapsam:** `next`, `styled-jsx`, `react`, `react-dom`, `scheduler` (optional)
- **Timing:** Server start **öncesi** fail-fast (runtime error'dan önce)

### Broken Symlink Envanteri

- **Amaç:** CI log'da "hangi linkler kırık" net kalsın (debug altın değerinde)
- **Timing:** Pre-isolate ve post-isolate (kopya deterministik mi?)
- **Limit:** İlk 200 broken symlink loglanıyor (çok fazla olursa truncate)

---

## 🔗 İlgili Dosyalar

- **Workflow:** `.github/workflows/pr-smoke.yml`
- **Copy Script:** `tools/copy-standalone-assets.cjs`
- **Build Config:** `apps/web-next/next.config.mjs` (standalone output)
- **Package Script:** `apps/web-next/package.json` (postbuild)

---

## 📝 Changelog

- **2025-01-29:** Initial version - CI preflight hardening ile birlikte oluşturuldu
  - Broken symlink envanteri eklendi
  - Runtime preflight genişletildi (react, react-dom, scheduler)
  - rsync 23 handling iyileştirildi

---

**Son Güncelleme:** 2025-01-29
**Sahip:** Spark Eng (Platform)
**Durum:** ✅ Stable
