# ESLint/TypeScript Strict Mode Plan

**Proje:** Spark Trading Platform  
**Tarih:** 2025-10-24  
**Durum:** Advisory Mode (Aşama 1)

---

## 📊 Mevcut Durum

### Lint Sonuçları
- **Toplam Hata:** 324 errors
- **Lint Modu:** Advisory (default)
- **CI Kontrolü:** Kapalı (`ignoreDuringBuilds: true`)
- **Build:** Başarılı (lint hataları build'i engellemez)

### TypeScript Konfigürasyonu
- **Strict Mode:** Kapalı
- **noImplicitAny:** Uyarı seviyesi
- **strictNullChecks:** Uyarı seviyesi

---

## 🎯 3 Aşamalı Strict Geçiş Planı

### Aşama 1: Foundation (Advisory Mode) - **ŞU AN**

**Hedef:** Lint hatalarını katalogla ve kategorize et

**Aksiyonlar:**
1. ✅ ESLint basic rules aktif
2. ✅ Advisory mode (`SPARK_VERIFY_STRICT_LINT=0`)
3. ⚠️ Lint hataları `ADVISORY_WARN` olarak raporlanır
4. ⚠️ Exit kodu: Lint hataları exit kodunu **etkilemez**

**Package.json Scripts:**
```bash
# Advisory mode (hataları gösterir ama exit 0)
pnpm lint:advisory

# Next.js built-in lint
pnpm lint:next

# TypeScript type check
pnpm typecheck
```

**Referanslar:**
- [ESLint CLI](https://eslint.org/docs/latest/use/command-line-interface)
- [TypeScript Strict](https://www.typescriptlang.org/tsconfig/strict.html)

---

### Aşama 2: Progressive Strictness (3-6 ay)

**Hedef:** Hataları aşamalı olarak azalt, kritik kuralları aktifleştir

**Aksiyonlar:**

1. **TypeScript `strict` alt-kurallarını aşamalı aktifleştir:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "noImplicitAny": true,           // Aşama 2.1
       "strictNullChecks": true,        // Aşama 2.2
       "strictFunctionTypes": true,     // Aşama 2.3
       "strictBindCallApply": true,     // Aşama 2.4
       "strictPropertyInitialization": true, // Aşama 2.5
       "noImplicitThis": true,          // Aşama 2.6
       "alwaysStrict": true             // Aşama 2.7
     }
   }
   ```

2. **ESLint kuralları:**
   ```javascript
   // eslint.config.js
   {
     rules: {
       '@typescript-eslint/no-floating-promises': 'error',
       '@typescript-eslint/no-misused-promises': 'error',
       '@typescript-eslint/await-thenable': 'error',
       '@typescript-eslint/no-unused-vars': ['error', { 
         argsIgnorePattern: '^_' 
       }]
     }
   }
   ```

3. **Hata azaltma hedefleri:**
   - Sprint 1: 324 → 250 (-74)
   - Sprint 2: 250 → 175 (-75)
   - Sprint 3: 175 → 100 (-75)
   - Sprint 4: 100 → 50 (-50)
   - Sprint 5: 50 → 0 (-50)

**Öncelik Sırası:**
1. 🔴 **Critical:** Type safety issues (`any`, undefined handling)
2. 🟠 **High:** Promise handling (`async/await`, floating promises)
3. 🟡 **Medium:** Unused variables, imports
4. 🟢 **Low:** Formatting, style issues

**ENV ile Test:**
```bash
# Advisory mode (default - exit 0)
pnpm --filter web-next run lint:advisory

# Strict mode (exit non-zero on lint errors)
SPARK_VERIFY_STRICT_LINT=1 pnpm --filter web-next run lint
```

---

### Aşama 3: Full Strict Mode (6-12 ay)

**Hedef:** Tam strict mode, CI/CD zorunluluğu

**Aksiyonlar:**

1. **TypeScript Full Strict:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true  // Tüm strict kuralları aktif
     }
   }
   ```

2. **ESLint Max Warnings Zero:**
   ```bash
   # Strict lint (max-warnings=0)
   pnpm lint
   # Exit code: non-zero if any warnings/errors
   ```

3. **CI/CD Entegrasyonu:**
   ```yaml
   # .github/workflows/ci.yml
   - name: Lint Check
     run: |
       SPARK_VERIFY_STRICT_LINT=1 pnpm run lint
       pnpm run typecheck
   ```

4. **Pre-commit Hooks:**
   ```json
   // .husky/pre-commit
   pnpm lint:fix
   pnpm typecheck
   ```

**Hedef Sonuç:**
- ✅ **0 lint errors**
- ✅ **0 type errors**
- ✅ **CI/CD strict checks**
- ✅ **Pre-commit auto-fix**

---

## 🔧 Kullanım Örnekleri

### Advisory Mode (Default)
```bash
# Verify script (advisory mode)
powershell -File tools/release/verify.ps1 -Port 3004
# Output: LINT:ADVISORY_WARN | RESULT:PASS ✅
# Exit: 0 (lint hataları exit kodunu etkilemez)
```

### Strict Mode
```bash
# Verify script (strict mode via ENV)
$env:SPARK_VERIFY_STRICT_LINT="1"
powershell -File tools/release/verify.ps1 -Port 3004
# Output: LINT:STRICT_FAIL | RESULT:FAIL ❌
# Exit: 1 (lint hataları fail eder)

# Verify script (strict mode via parameter)
powershell -File tools/release/verify.ps1 -Port 3004 -StrictLint
# Output: LINT:STRICT_FAIL | RESULT:FAIL ❌
# Exit: 1
```

### Lint Scripts
```bash
# Advisory lint (hataları gösterir, exit 0)
pnpm --filter web-next lint:advisory

# Strict lint (hata varsa exit 1)
pnpm --filter web-next lint

# Auto-fix
pnpm --filter web-next lint:fix

# Type check
pnpm --filter web-next typecheck
```

---

## 📈 Progress Tracking

### Sprint Hedefleri

| Sprint | Başlangıç | Hedef | Gerçekleşen | Durum |
|--------|-----------|-------|-------------|-------|
| S1 (Ekim '25) | 324 | 250 | - | 🔄 Planlama |
| S2 (Kasım '25) | 250 | 175 | - | ⏳ Beklemede |
| S3 (Aralık '25) | 175 | 100 | - | ⏳ Beklemede |
| S4 (Ocak '26) | 100 | 50 | - | ⏳ Beklemede |
| S5 (Şubat '26) | 50 | 0 | - | ⏳ Beklemede |

### Kategori Bazlı Hedefler

| Kategori | Mevcut | Hedef | Öncelik |
|----------|--------|-------|---------|
| Type Safety | ~100 | 0 | 🔴 Critical |
| Promise Handling | ~80 | 0 | 🟠 High |
| Unused Vars | ~60 | 0 | 🟡 Medium |
| Formatting | ~84 | 0 | 🟢 Low |

---

## 🚀 Sonraki Adımlar

1. ✅ **Advisory mode'da çalış** (şu anki durum)
2. ⏳ **Lint hatalarını kategorize et** (Sprint 1)
3. ⏳ **TypeScript strict alt-kurallarını tek tek aktifleştir** (Sprint 2-3)
4. ⏳ **ESLint kurallarını aşamalı sıkılaştır** (Sprint 3-4)
5. ⏳ **Full strict mode'a geç** (Sprint 5)
6. ⏳ **CI/CD entegrasyonu** (Sprint 6)

---

## 📚 Kaynaklar

- [ESLint Command Line Interface](https://eslint.org/docs/latest/use/command-line-interface)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig/strict.html)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [Next.js ESLint](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- [@typescript-eslint/eslint-plugin](https://typescript-eslint.io/)

---

**Son Güncelleme:** 2025-10-24  
**Güncelleme Sıklığı:** Sprint bazlı (2 haftada bir)

