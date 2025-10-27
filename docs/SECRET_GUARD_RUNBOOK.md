# Secret Guard Runbook

## Hızlı Doğrulama (Yerel)

```bash
# Manuel tarama (kanıt dosyası yazar)
gitleaks detect -c .gitleaks.toml --no-banner --redact \
  --report-format sarif --report-path runtime/gitleaks.sarif \
  && echo PASS>runtime/leaks_status.txt || echo FAIL>runtime/leaks_status.txt
```

**PASS ise:** ✅ Tamam  
**FAIL ise:** SARIF'i aç → sızıntıyı düzelt → yeniden dene

## Olay Anı Runbook (2 Dakikalık Reçete)

### 1. Derhal Rotate
- Sızdırılan anahtar/secret → provider'da iptal + yeni anahtar üret
- Tüm ortamlarda secret'ı revoke et

### 2. Kod Temizliği
- Sızıntıyı kaldır
- Gerekirse `git revert` veya `git fix-up`

### 3. Geçmiş Temizliği (Gerekirse)
```bash
# git filter-repo ile eski blob'ları sil
git filter-repo --invert-paths --path "dosya_adi.txt"
# veya BFG kullan
bfg --delete-files "dosya_adi.txt"
```

### 4. Yayılmayı Önle
- İlgili ortamlarda secret'ı revoke et
- Audit log kaydı al
- Ekip üyelerini bilgilendir

### 5. Guard Yeniden Çalıştır
- PR'da Secret Guard PASS olana kadar
- Lokal test: `.\gitleaks.exe detect -c .gitleaks.toml`

## DONE Tanımı (6 Madde)

- ✅ **Hooks aktif:** `.husky/pre-commit` ve `.husky/pre-push` çalıştırılabilir (Git Bash)
- ✅ **Lokal kanıt:** `runtime/leaks_status.txt = PASS` (SARIF varsa `runtime/gitleaks.sarif`)
- ✅ **CI yeşil:** Actions → Secret Guard / secret-guard = PASS (artifact: gitleaks-sarif)
- ✅ **Code Scanning:** Security → Code scanning alerts'ta gitleaks.sarif görünüyor
- ✅ **Branch Protection:** Required checks'te Secret Guard / secret-guard (ve Structure Guard) işaretli
- ✅ **Pin & perms:** Workflow'da `permissions: {contents: read, security-events: write}` ve gitleaks v8.18.4 pinli

## Windows Akışı Notu

Hook'lar Git Bash üzerinden garantili çalışır. GUI istemcilerde de (Git hooks) tetiklenir; bir sorun olursa commit/push'ları terminalden yaparak test edin.

## Küçük Ama Etkili Sertleştirmeler (Opsiyonel)

### Weekly Doctor'a Ekleme
```yaml
- name: Weekly gitleaks scan
  run: |
    gitleaks detect -c .gitleaks.toml --redact --report-format sarif
```

### Allowlist Diyet
- `.gitleaks.toml`'da sadece zararsız yollar/örnek anahtarlar kalsın
- **Gerçek secret asla allowlist edilmesin**

### Sürüm Bakımı
- Her sprint başı "gitleaks pin bump" (örn. v8.18.x→v8.19.x)
- Tek satır değişiklik

## Güvenlik Katmanları

1. **Pre-commit Hook:** Commit öncesi anlık kontrol
2. **Pre-push Hook:** Push öncesi commit aralığı kontrolü
3. **CI/CD Pipeline:** GitHub Actions ile otomatik tarama
4. **SARIF Raporlama:** GitHub Security tablosu entegrasyonu

## Önemli Notlar

- **Gerçek secret'ı allowlist'e asla ekleme**
- **İhlal durumunda hemen rotate et**
- **Geçmiş temizliği için git filter-repo kullan**
- **Windows'ta Git Bash ile çalışır** 