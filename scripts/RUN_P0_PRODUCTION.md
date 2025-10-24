# P0 Chain - Production Execution Quick Guide

**Tarih:** 2025-10-24  
**Repository:** mgymgy7878/CursorGPT_IDE  
**Workflow:** .github/workflows/p0-chain.yml

---

## 🚀 HIZLI BAŞLATMA (Tek Komut)

### Otomatik Script ile:

```powershell
powershell -File scripts/p0_prod_setup.ps1 `
  -SSHHost "GERÇEK_PROD_SERVER" `
  -SSHUser "GERÇEK_SSH_USER" `
  -CDNHost "GERÇEK_CDN_DOMAIN"
```

**Bu script otomatik olarak:**
1. ✅ Auth kontrol eder
2. ✅ Secrets'ları ekler
3. ✅ Workflow'u tetikler
4. ✅ Run'ı izler
5. ✅ Artifacts'ları indirir
6. ✅ Final summary gösterir

---

## 📋 MANUEL ADIM ADIM (Detaylı Kontrol)

### 1️⃣ GitHub CLI Auth Kontrol

```powershell
gh auth status

# Beklenen:
# ✓ Logged in to github.com account mgymgy7878
# - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

**Eğer auth değilse:**
```powershell
gh auth login
```

---

### 2️⃣ Production Secrets Ekle

#### SSH_HOST
```powershell
gh secret set SSH_HOST --repo mgymgy7878/CursorGPT_IDE --body "GERÇEK_PRODUCTION_SERVER"

# Örnekler:
# "prod.spark.trading"
# "192.168.1.100"
```

#### SSH_USER
```powershell
gh secret set SSH_USER --repo mgymgy7878/CursorGPT_IDE --body "GERÇEK_DEPLOY_USER"

# Örnekler:
# "deploy"
# "ubuntu"
```

#### SSH_KEY
```powershell
# Default SSH key ($HOME\.ssh\id_rsa)
Get-Content $HOME\.ssh\id_rsa -Raw | gh secret set SSH_KEY --repo mgymgy7878/CursorGPT_IDE --body -

# Veya custom key
# Get-Content "C:\path\to\key" -Raw | gh secret set SSH_KEY --repo mgymgy7878/CursorGPT_IDE --body -
```

#### CDN_HOST
```powershell
gh secret set CDN_HOST --repo mgymgy7878/CursorGPT_IDE --body "GERÇEK_CDN_DOMAIN"

# Örnekler:
# "cdn.spark.trading"
```

#### Secrets Doğrula
```powershell
gh secret list --repo mgymgy7878/CursorGPT_IDE

# Tüm 4 secret görünmeli:
# CDN_HOST, SSH_HOST, SSH_KEY, SSH_USER
```

---

### 3️⃣ Workflow Görünürlük Kontrol

```powershell
# Workflow default branch'te mi?
gh workflow list | findstr p0-chain

# Beklenen:
# P0 Chain  active  ...

# Default branch
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'

# Beklenen: main
```

---

### 4️⃣ Workflow Tetikle

```powershell
gh workflow run p0-chain.yml --ref main

# Beklenen:
# ✓ Created workflow_dispatch event for p0-chain.yml at main
```

---

### 5️⃣ Run ID Al ve İzle

```powershell
# 5 saniye bekle (run başlasın)
Start-Sleep -Seconds 5

# Run ID al
$run = (gh run list --workflow=p0-chain.yml --limit 1 --json databaseId -q '.[0].databaseId')
Write-Host "Run ID: $run" -ForegroundColor Cyan
Write-Host "URL: https://github.com/mgymgy7878/CursorGPT_IDE/actions/runs/$run" -ForegroundColor Cyan

# Canlı izle
gh run watch $run

# Veya compact mode
# gh run watch $run --compact
```

**Beklenen Başarılı Çıktı:**
```
✓ publish_atomic_latest_yml in 12s
✓ nginx_reload in 8s
✓ cdn_head_check in 5s
✓ smoke_json_prom in 45s
✓ verify_auto_detect in 10s
✓ final_summary_artifact in 5s

✓ Run P0 Chain completed with 'success'
```

---

### 6️⃣ Artifacts İndir

```powershell
# Evidence klasörü oluştur
New-Item -ItemType Directory -Force -Path evidence | Out-Null

# Artifacts indir
gh run download $run -n p0-artifacts -D evidence

# Beklenen:
# evidence/
#   - final_summary.txt
#   - head_response.txt
#   - smoke.json
#   - verify.log
```

---

### 7️⃣ Final Summary Göster

```powershell
# Tek satırlık özet
Get-Content evidence/final_summary.txt | Select-Object -First 1

# Beklenen başarılı çıktı:
# FINAL SUMMARY | CI:PASS | NGINX:PASS | PROM-CT:PASS | STANDALONE:PASS

# Detaylı rapor
Get-Content evidence/final_summary.txt
```

---

## 🔍 Doğrulama Komutları

### Prometheus Content-Type (Production)

```bash
curl -I https://YOUR_CDN_HOST/desktop/latest.yml

# Beklenen:
# HTTP/1.1 200 OK
# Content-Type: application/x-yaml; charset=utf-8
# Cache-Control: no-cache
```

```bash
curl -I https://YOUR_SERVER/api/public/metrics.prom

# Beklenen:
# Content-Type: text/plain; version=0.0.4; charset=utf-8
```

### Next.js Standalone (Local)

```powershell
cd apps/web-next
$env:PORT = "3004"
$env:HOSTNAME = "127.0.0.1"
node .next/standalone/server.js

# Beklenen:
# ▲ Next.js 14.2.13
# - Local: http://127.0.0.1:3004
# ✓ Ready in 279ms
```

---

## ⚠️ Troubleshooting

### Sorun: SSH Connection Failed

**Hata:** `Permission denied (publickey)`

**Kontrol:**
```bash
# SSH bağlantısını test et
ssh YOUR_SSH_USER@YOUR_SSH_HOST

# Eğer bağlanıyorsa, secret doğru eklenmemiş
```

**Çözüm:**
```powershell
# SSH key'i tekrar ekle
Get-Content $HOME\.ssh\id_rsa -Raw | gh secret set SSH_KEY --repo mgymgy7878/CursorGPT_IDE --body -
```

### Sorun: NGINX Reload Failed

**Hata:** `sudo: no tty present and no askpass program specified`

**Çözüm:**
```bash
# Production server'da sudoers ayarla
sudo visudo

# Ekle:
# deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload
```

### Sorun: CDN HEAD Check Failed

**Hata:** `HTTP 404`

**Çözüm:**
```bash
# Production server'da dosya var mı?
ls -la /var/www/desktop/latest.yml

# NGINX config test
sudo nginx -t
```

---

## 📊 BAŞARILI ÇIKTI ÖRNEĞİ

```
Run ID: 18777123456
URL: https://github.com/mgymgy7878/CursorGPT_IDE/actions/runs/18777123456

✓ publish_atomic_latest_yml in 12s
✓ nginx_reload in 8s
✓ cdn_head_check in 5s
✓ smoke_json_prom in 45s
✓ verify_auto_detect in 10s
✓ final_summary_artifact in 5s

✓ Run P0 Chain completed with 'success'

Downloading artifacts...
✓ Artifacts downloaded to evidence/

FINAL SUMMARY | CI:PASS | NGINX:PASS | PROM-CT:PASS | STANDALONE:PASS
```

---

## 🎯 KOMPLE EXECUTION SCRIPT

**Tek script ile tüm işlemleri yap:**

```powershell
# === P0 CHAIN - PRODUCTION FULL EXECUTION ===

# 1. Auth
gh auth status

# 2. Secrets (GERÇEK DEĞERLER!)
gh secret set SSH_HOST --repo mgymgy7878/CursorGPT_IDE --body "prod.yourdomain.com"
gh secret set SSH_USER --repo mgymgy7878/CursorGPT_IDE --body "deploy"
Get-Content $HOME\.ssh\id_rsa -Raw | gh secret set SSH_KEY --repo mgymgy7878/CursorGPT_IDE --body -
gh secret set CDN_HOST --repo mgymgy7878/CursorGPT_IDE --body "cdn.yourdomain.com"

# 3. Verify
gh secret list --repo mgymgy7878/CursorGPT_IDE

# 4. Trigger
gh workflow run p0-chain.yml --ref main

# 5. Watch
Start-Sleep -Seconds 5
$run = (gh run list --workflow=p0-chain.yml --limit 1 --json databaseId -q '.[0].databaseId')
Write-Host "Run ID: $run" -ForegroundColor Cyan
gh run watch $run

# 6. Download
New-Item -ItemType Directory -Force -Path evidence | Out-Null
gh run download $run -n p0-artifacts -D evidence

# 7. Summary
Write-Host "`nFINAL SUMMARY:" -ForegroundColor Cyan
Get-Content evidence/final_summary.txt | Select-Object -First 1
```

---

## 📚 Referanslar

- [GitHub Actions - Manual Workflow Run](https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow)
- [GitHub CLI - gh secret set](https://cli.github.com/manual/gh_secret_set)
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Prometheus Content-Type](https://docs.google.com/document/d/1ZjyKiKxZV83VI9ZKAXRGKaUKK2BIWCT7oiGBKDBpjEY)
- [NGINX add_header](https://nginx.org/en/docs/http/ngx_http_headers_module.html)

---

**HAZIR - Gerçek production secrets girdikten sonra bu komutu çalıştırın!** 🚀

