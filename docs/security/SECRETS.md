# Secrets Rehberi

## Altın Kurallar
- **.env* dosyalarını commit etmeyin.** Ör: `.env.local`, `.env`, `apps/web-next/.env.local`.
- Gerçek anahtarları yalnızca **CI/CD Secrets** veya yerel `.env.local` içinde tutun.
- Paylaşım için **placeholder** kullanın: `BINANCE_API_KEY=__REPLACE__`.

## Gitleaks Nasıl Çalışır?
- CI'da **Secret Guard** workflow'u çalışır ve sızıntı bulursa **fail** eder.
- Yerelde: `pnpm run guard:secrets`

## Allowlist İpuçları
- Yanlış-pozitif için `.gitleaks.toml` → `[allowlist]` altına regex/path ekleyin.
- Asla gerçek key'i allowlist etmeyin; sadece **pattern** ekleyin.

## Hızlı Kontrol
```bash
pnpm run guard:secrets
```

## Pre-commit Enforcement (Husky)
Husky ile her commit öncesi otomatik tarama yapılır.

### Kurulum
```bash
pnpm install
pnpm prepare
```

### Davranış
- Gitleaks yüklüyse: staged dosyalar taranır, sızıntı varsa commit engellenir
- Gitleaks yoksa: uyarı verilir ama commit devam eder (geliştirici engellenmez)

## Code Scanning
- CI'da bulunan sızıntılar SARIF formatında raporlanır
- GitHub Security tab → Code scanning alerts bölümünde görünür
- Haftalık otomatik tarama (Pazartesi 02:19 UTC) aktiftir

## Detaylı Kontrol Listesi
Kurulum, sorun giderme ve production-grade özellikler için bkz: [SECRET_GUARD_CHECKLIST.md](./SECRET_GUARD_CHECKLIST.md) 