---
Title: GitHub Actions Context Warnings Explanation
Owner: Spark Eng (Platform)
Status: Stable
LastUpdated: 2025-10-25
Links: PR-#3
---

# GitHub Actions Context Uyarıları — Açıklama

## Özet

VS Code'da GitHub Actions workflow dosyalarında görülen **"Context access might be invalid"** uyarıları **gerçek CI hataları değildir**. Bu uyarılar, VS Code'un GitHub Actions eklentisinin statik analizinin yan ürünüdür ve runtime'da çözümlenen context'leri (örn. `secrets.*`, `vars.*`, `github.*`) dosya içinde değerlendirememesinden kaynaklanır.

## Teknik Detaylar

### Neden Oluşur?

VS Code eklentisi workflow dosyalarını **statik olarak** inceler ancak:
- Secret değerlerini runtime öncesinde göremez
- Var değişkenlerinin varlığını doğrulayamaz
- GitHub context'lerinin runtime'da hangi değerlere sahip olacağını bilemez

Bu yüzden "invalid olabilir" der (kesin hatadır demiyor). GitHub bu konuda açıkça "false positive" ürettiğini kabul ediyor.

**Referanslar:**
- [GitHub Contexts Reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [GitHub Expressions](https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions)

### Fork PR'lar ve Secret Politikası

GitHub'ın resmi kuralı: **fork'tan tetiklenen workflow'lara repository secret'ları geçmez**. Bu tasarım gereğidir ve güvenlik nedeniyledir. Bu yüzden secret kullanan adımlar için fork kontrolü önemlidir.

## Çözüm: Koşullu Guard Kalıbı

Aşağıdaki kalıp hem güvenlik hem de uyarı gürültüsünü azaltır:

```yaml
env:
  SMOKE_TOKEN: ${{ secrets.SMOKE_TOKEN || '' }}   # boş string fallback

jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - name: Run canary smoke
        # Secret varsa VE çalışma fork PR'ından gelmiyorsa çalıştır
        if: ${{ env.SMOKE_TOKEN != '' && !github.event.pull_request.head.repo.fork }}
        run: pnpm run smoke
```

### Kalıbın Faydaları

1. **Fork PR'ları güvenle ele alır** — Secret yok ise adım atlanır
2. **Gürültüyü azaltır** — Uyarı görünse de CI'da gerçek doğrulama yapılır
3. **Güvenliği artırır** — Fork'lardan secret sızması engellenir
4. **Açık ve dokümante** — Neden koşul olduğu koda yansır

## Proje İçinde Uygulama

Bu projede aşağıdaki workflow'larda koşullu guard uygulanmıştır:

- `.github/workflows/canary-smoke.yml` — SMOKE_TOKEN
- `.github/workflows/contract-chaos-tests.yml` — PACT_BROKER_TOKEN, SLACK_WEBHOOK_URL
- `.github/workflows/p0-chain.yml` — SSH_HOST/USER/KEY, CDN_HOST
- `.github/workflows/ux-ack.yml` — FREEZE var (zaten koşullu)

## Sonuç

✅ **VS Code'daki uyarılar bilgilendiricidir, CI'ı bozmaz**  
✅ **Koşullu guard'lar hem güvenlik hem de uyarı azaltma sağlar**  
✅ **GitHub'ın kendi dokümanı false positive kabul ediyor**

CI tarafında gerçek kontroller (pnpm version match, frozen lockfile, strict peer deps) korunmuştur.

