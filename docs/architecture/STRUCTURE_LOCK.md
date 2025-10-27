# Structure Lock

Bu koruma; **present/missing**, **transpilePackages**, **TS paths**, **workspace globs** ve **dual-import** (bare isimler) kurallarını CI'da zorunlu kılar.

## Nasıl Çalışır?
- `runtime/guard_structure.mjs` kontrol eder ve sonuçları `runtime/structure_report.json` + `runtime/guard_violation.txt` dosyalarına yazar.
- CI job adı: **Structure Guard / structure-guard**. İhlal varsa job **fail** olur.

## Yerelde Çalıştırma
```bash
pnpm run guard:structure
type runtime/structure_report.json
type runtime/guard_violation.txt
```

## Kurallar (özet)

1. **packages/@spark/** paketleri mevcut olmalı (common, paper-broker, exchange-*, types, backtester, auth, security).
2. **apps/web-next/next.config.js** içinde `transpilePackages` listesinde tüm @spark/* olmalı.
3. **tsconfig.base.json** → `compilerOptions.paths["@spark/*"]` tanımlı olmalı.
4. **pnpm-workspace.yaml** globs: packages/*, packages/@spark/*, apps/*, services/*.
5. **Yasak**: `from 'backtester'` | `'auth'` | `'security'` gibi bare importlar (yalnızca `from '@spark/<pkg>'`).

## Sık Karşılaşılan İhlaller & Çözümleri

- **Missing paket**: İlgili paketi geri yükleyin veya path/glob ekleyin.
- **Transpile MISS**: next.config.js → transpilePackages listesine eksik @spark/* ekleyin.
- **Paths MISS**: tsconfig.base.json → paths["@spark/*"] tanımlayın.
- **Dual imports > 0**: Bare import'ları @spark/<pkg> ile düzeltin. 