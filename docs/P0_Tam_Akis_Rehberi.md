## P0 Tam Akış Çalıştırma Rehberi (Ortam Değişkenli, Güvenli)

### Amaç
Atomic publish → NGINX reload → CDN HEAD → Smoke/Canary → Verify zincirini tek seferde ve güvenli şekilde (gizli bilgileri betiğe gömmeden) çalıştırmak.

### Ön Koşullar
- Windows PowerShell ve OpenSSH (ssh/scp)
- Docker Desktop açık
- Depo kök dizini: `C:\dev`
- Gerekirse CI ajanında `tools/release/atomic_publish.ps1` erişimi

### Ortam Değişkenleri (Gizli Bilgiler Yerelinizde Kalır)
```powershell
$ENV:REMOTE_USER = "opsuser"          # örnek; gerçek değeri yerelde girin
$ENV:REMOTE_HOST = "your-nginx.host"  # örnek; gerçek değeri yerelde girin
$ENV:CDN_HOST    = "your.cdn.domain"  # örnek; gerçek değeri yerelde girin
```

### Tam P0 Akışı (Önerilen: birleşik betikle)
```powershell
cd C:\dev\CursorGPT_IDE
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\p0_pass_runner.ps1
```
- Bu betik sırasıyla şunları yapar:
  - Electron build + dist
  - `tools/release/atomic_publish.ps1`
  - Uzak NGINX reload + CDN HEAD (200/text/yaml/no-cache)
  - `scripts\smoke_v2.ps1` (P0 eşdeğer)
  - `tools\release\verify.ps1` (kanıt toplama)

### Alternatif (Uzak hazır değilse): Sadece Smoke + Verify
```powershell
cd C:\dev\CursorGPT_IDE
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke_v2.ps1

cd C:\dev
pwsh -NoProfile -ExecutionPolicy Bypass -File .\tools\release\verify.ps1
```
- Not: Bu modda `NGINX:HEAD_OK` kısmı atlanır; diğer kanıtlar üretilir.

### Readiness Notu (Smoke için)
- Smoke readiness öncelikle `metrics.prom` ile yapılır.
- `metrics.prom` 404 dönerse JSON fallback devreye girer: `GET /api/public/metrics` 200 ise READY kabul edilir.
- Prometheus text formatı `text/plain; version=0.0.4`; fallback yalnızca readiness içindir.

### Beklenen Final Çıktı
```
FINAL SUMMARY — Signature:N/A | AtomicPublish:OK | SHA512:OK | AU(beta)SMOKE:PASS | NGINX:HEAD_OK | DESKTOP:FALLBACK_OK
```

### NGINX HEAD İçin Gerekli Konfig Özeti
`config/nginx.conf` içinde `/desktop/` bloğu:
- `types { text/yaml yml; }`
- `add_header Cache-Control "no-cache" always;` (+ `Pragma: no-cache`)

Uzak deploy + reload akışı (p0 betiği tarafından yönetilir):
```powershell
scp config/nginx.conf "$ENV:REMOTE_USER@$ENV:REMOTE_HOST:/tmp/spark-ta.nginx"
ssh "$ENV:REMOTE_USER@$ENV:REMOTE_HOST" "sudo mv /tmp/spark-ta.nginx /etc/nginx/sites-available/spark-ta && sudo nginx -t && sudo systemctl reload nginx"
```

HEAD testi:
```powershell
curl -I https://$ENV:CDN_HOST/desktop/latest.yml
# Beklenen başlıklar: 200 OK / Content-Type: text/yaml / Cache-Control: no-cache
```

### Kanıt Dosyaları (örnek)
- `evidence\sha_check.txt`
- `evidence\au_latest_yml_headers.txt`
- `evidence\au_smoke_tail.txt`

### Hızlı Teşhis (Hata Olursa)
- SSH/SCP: `ssh -V`, `scp -V`; uzak tarafta `sudo` yetkisi
- NGINX: `nginx -t` temiz mi; `sites-enabled` linki doğru mu
- HEAD: Yol `https://$ENV:CDN_HOST/desktop/latest.yml`, başlıklar `text/yaml` ve `no-cache` geliyor mu
- Smoke/Canary: Docker çalışır durumda mı; metrikler (ws staleness, msgs_total delta) ilerliyor mu
- Verify: `evidence\` altındaki dosyalar üretildi mi; özet satır oluştu mu

### Güvenlik Notu
- SSH/CDN değerlerini betiğe gömmeyin; yalnızca `$ENV:` üzerinden yerel oturumda set edin.
- Bu değerleri sürüm kontrolüne koymayın.


