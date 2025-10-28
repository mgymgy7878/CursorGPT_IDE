# P0 Chain - Production Deployment Guide

**Proje:** Spark Trading Platform  
**Tarih:** 2025-10-24  
**Workflow:** `.github/workflows/p0-chain.yml`

---

## 🎯 Overview

P0 Chain workflow, production deployment pipeline'ını otomatize eder:

1. **Atomic Publish** - `latest.yml` dosyasını atomik olarak günceller
2. **NGINX Reload** - Production sunucuda NGINX'i yeniden yükler
3. **CDN Head Check** - CDN üzerinde `latest.yml`'yi doğrular
4. **Smoke Test** - Metrics endpoint'lerini test eder
5. **Verify** - Auto-detect ve Content-Type doğrulaması
6. **Final Summary** - Kanıtları toplar ve artifact olarak yükler

---

## 📋 Prerequisites

### GitHub Side
- [x] GitHub billing çözüldü
- [x] Repository public veya private (billing issue resolved)
- [x] Default branch: `main`
- [x] Workflow file: `.github/workflows/p0-chain.yml` on main branch
- [x] GitHub CLI installed and authenticated

### Production Server Side
- [ ] SSH access configured
- [ ] SSH key authorized (`~/.ssh/authorized_keys`)
- [ ] NGINX installed and configured
- [ ] `/var/www/desktop` directory exists
- [ ] Correct permissions for deploy user

### Secrets Required
- [ ] `SSH_HOST` - Production server hostname/IP
- [ ] `SSH_USER` - SSH username (with sudo rights for nginx)
- [ ] `SSH_KEY` - SSH private key (authorized on server)
- [ ] `CDN_HOST` - CDN hostname for latest.yml

---

## 🚀 Quick Start

### Option 1: Automated Script

**DRY-RUN (test parameters):**
```powershell
powershell -File scripts/p0_production_setup.ps1 `
  -SSHHost "prod.example.com" `
  -SSHUser "deploy" `
  -CDNHost "cdn.example.com" `
  -DryRun
```

**PRODUCTION (real execution):**
```powershell
powershell -File scripts/p0_production_setup.ps1 `
  -SSHHost "prod.yourdomain.com" `
  -SSHUser "deploy" `
  -CDNHost "cdn.yourdomain.com"
```

**Custom SSH key:**
```powershell
powershell -File scripts/p0_production_setup.ps1 `
  -SSHHost "prod.example.com" `
  -SSHUser "deploy" `
  -CDNHost "cdn.example.com" `
  -SSHKeyPath "C:\custom\path\to\key"
```

### Option 2: Manual Step-by-Step

See **Manual Setup** section below.

---

## 🔧 Manual Setup

### Step 1: GitHub CLI Auth

```powershell
# Check auth status
gh auth status

# If not authenticated:
gh auth login

# Expected output:
# ✓ Logged in to github.com account mgymgy7878
# - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

---

### Step 2: Set Production Secrets

#### 2.1 SSH_HOST

```powershell
gh secret set SSH_HOST --repo mgymgy7878/CursorGPT_IDE --body "prod.yourdomain.com"

# Examples:
# - prod.spark.trading
# - 192.168.1.100
# - production-server.example.com
```

#### 2.2 SSH_USER

```powershell
gh secret set SSH_USER --repo mgymgy7878/CursorGPT_IDE --body "deploy"

# Requirements:
# - User must have sudo rights for 'nginx'
# - User should be dedicated deploy user (not root)
```

#### 2.3 SSH_KEY

```powershell
# From default location
Get-Content $HOME\.ssh\id_rsa -Raw | gh secret set SSH_KEY --repo mgymgy7878/CursorGPT_IDE --body -

# From custom location
Get-Content C:\path\to\your\private_key -Raw | gh secret set SSH_KEY --repo mgymgy7878/CursorGPT_IDE --body -

# Requirements:
# - Private key format: OpenSSH or PEM
# - Public key added to server's ~/.ssh/authorized_keys
# - Key permissions: 600 (read/write for owner only)
```

**Security Checklist:**
- [ ] Key is production-only (not used for other purposes)
- [ ] Key has passphrase protection (optional but recommended)
- [ ] Public key authorized on server
- [ ] Key permissions correct: `chmod 600 ~/.ssh/id_rsa`

#### 2.4 CDN_HOST

```powershell
gh secret set CDN_HOST --repo mgymgy7878/CursorGPT_IDE --body "cdn.yourdomain.com"

# Examples:
# - cdn.spark.trading
# - files.example.com
# - static.yourdomain.com
```

---

### Step 3: Verify Secrets

```powershell
# List all secrets
gh secret list --repo mgymgy7878/CursorGPT_IDE

# Expected output:
# NAME      UPDATED
# CDN_HOST  X seconds ago
# SSH_HOST  X seconds ago
# SSH_KEY   X seconds ago
# SSH_USER  X seconds ago
```

**Note:** Secret **values** are never displayed (security).

---

### Step 4: Workflow Visibility Check

```powershell
# Check workflow list
gh workflow list | findstr p0-chain

# Expected:
# P0 Chain  active  123456789

# Check default branch
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'

# Expected: main
```

**Important:** `workflow_dispatch` only works on default branch.

---

### Step 5: Trigger Workflow

```powershell
# Trigger P0 Chain workflow
gh workflow run p0-chain.yml --ref main

# Expected:
# ✓ Created workflow_dispatch event for p0-chain.yml at main
# To see runs for this workflow, try: gh run list --workflow="p0-chain.yml"
```

---

### Step 6: Watch Run

```powershell
# Wait for run to start
Start-Sleep -Seconds 5

# Get latest run ID
$run = (gh run list --workflow=p0-chain.yml --limit 1 --json databaseId -q '.[0].databaseId')
Write-Host "Run ID: $run" -ForegroundColor Cyan

# Watch run (live updates)
gh run watch $run

# Or compact mode:
# gh run watch $run --compact
```

**Expected Job Sequence:**
1. ✅ `publish_atomic_latest_yml` (10-15s)
2. ✅ `nginx_reload` (5-10s)
3. ✅ `cdn_head_check` (5s)
4. ✅ `smoke_json_prom` (45s)
5. ✅ `verify_auto_detect` (10s)
6. ✅ `final_summary_artifact` (5s)

**Total Duration:** ~90 seconds

---

### Step 7: Download Artifacts

```powershell
# Create evidence directory
New-Item -ItemType Directory -Force -Path evidence | Out-Null

# Download artifacts
gh run download $run -n p0-artifacts -D evidence

# Expected files:
# evidence/
#   - final_summary.txt
#   - head_response.txt
#   - smoke.json
#   - verify.log
```

**If artifacts not found:**
```
Error: no artifact matches any of the names or patterns provided
```

**Reason:** Workflow failed before `final_summary_artifact` job. Check job logs:
```powershell
gh run view $run --log-failed
```

---

### Step 8: View Final Summary

```powershell
# First line (quick summary)
Get-Content evidence/final_summary.txt | Select-Object -First 1

# Expected:
# FINAL SUMMARY | CI:PASS | NGINX:PASS | PROM-CT:PASS | STANDALONE:PASS

# Full report
Get-Content evidence/final_summary.txt
```

---

## 🔍 Validation Checks

### Prometheus Content-Type

**Local Check:**
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:3004/api/public/metrics.prom" -Method Head -UseBasicParsing | 
  Select-Object -ExpandProperty Headers | 
  Select-Object -ExpandProperty 'Content-Type'

# Expected:
# text/plain; version=0.0.4; charset=utf-8
```

**Production CDN Check:**
```bash
curl -I https://cdn.yourdomain.com/desktop/latest.yml

# Expected headers:
# HTTP/1.1 200 OK
# Content-Type: application/x-yaml; charset=utf-8
# Cache-Control: no-cache
```

**Prometheus Metrics:**
```bash
curl -I https://your-server.com/api/public/metrics.prom

# Expected:
# Content-Type: text/plain; version=0.0.4; charset=utf-8
```

---

### Next.js Standalone

**Build Check:**
```powershell
# Check if standalone server.js exists
Test-Path "apps/web-next/.next/standalone/server.js"

# Expected: True
```

**Start Server:**
```powershell
cd apps/web-next
$env:PORT = "3004"
$env:HOSTNAME = "127.0.0.1"
node .next/standalone/server.js

# Expected:
# ▲ Next.js 14.2.13
# - Local: http://127.0.0.1:3004
# ✓ Ready in 279ms
```

**Note:** Do NOT use `next start` in standalone mode.

---

### NGINX Configuration

**Production Server `/etc/nginx/sites-available/desktop`:**

```nginx
server {
    listen 80;
    server_name cdn.yourdomain.com;

    location /desktop/ {
        root /var/www;
        
        # YAML file headers
        location ~ /desktop/latest\.yml$ {
            add_header Content-Type "application/x-yaml; charset=utf-8";
            add_header Cache-Control "no-cache";
            add_header Access-Control-Allow-Origin "*";
        }
        
        # Auto-index for directory listing
        autoindex on;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/desktop /etc/nginx/sites-enabled/
sudo nginx -t
sudo nginx -s reload
```

---

## 🛠️ Troubleshooting

### Sorun: "missing server host"

**Belirti:**
```
Error: missing server host
```

**Çözüm:**
```powershell
# Secrets tanımlı mı kontrol et
gh secret list --repo mgymgy7878/CursorGPT_IDE

# SSH_HOST, SSH_USER, SSH_KEY olmalı
```

---

### Sorun: SSH Connection Failed

**Belirti:**
```
Error: Permission denied (publickey)
```

**Çözüm:**

**1. Production sunucuda authorized_keys kontrolü:**
```bash
# SSH key'in public kısmını sunucuya ekle
cat ~/.ssh/id_rsa.pub | ssh deploy@prod.yourdomain.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Permissions düzelt
ssh deploy@prod.yourdomain.com "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

**2. SSH key formatını kontrol et:**
```powershell
# Key başlangıcı şu şekilde olmalı:
Get-Content $HOME\.ssh\id_rsa | Select-Object -First 1

# Expected:
# -----BEGIN OPENSSH PRIVATE KEY-----
# veya
# -----BEGIN RSA PRIVATE KEY-----
```

---

### Sorun: NGINX Reload Failed

**Belirti:**
```
Error: nginx: configuration file test failed
```

**Çözüm:**

**1. NGINX config test:**
```bash
sudo nginx -t

# Expected:
# nginx: configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**2. Deploy user sudo permissions:**
```bash
# /etc/sudoers.d/deploy
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload
```

---

### Sorun: CDN HEAD Check Failed

**Belirti:**
```
Error: HTTP 404 or wrong Content-Type
```

**Çözüm:**

**1. File exists:**
```bash
ls -la /var/www/desktop/latest.yml

# Should exist with correct permissions
```

**2. NGINX serving:**
```bash
curl -I http://localhost/desktop/latest.yml

# Expected: HTTP 200
```

**3. DNS resolution:**
```bash
nslookup cdn.yourdomain.com

# Should resolve to your server IP
```

---

### Sorun: Smoke Test Failed

**Belirti:**
```
SMOKE: FAIL
```

**Çözüm:**

**1. Port accessibility:**
```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 3004

# Expected: TcpTestSucceeded : True
```

**2. Metrics endpoint:**
```bash
curl http://127.0.0.1:3004/api/public/metrics.prom

# Should return Prometheus metrics
```

---

## 📊 Expected Workflow Output

### Successful Run

```
✓ publish_atomic_latest_yml in 12s
  ✓ Atomic Publish
  
✓ nginx_reload in 8s
  ✓ Reload NGINX
  
✓ cdn_head_check in 5s
  ✓ HEAD latest.yml
  
✓ smoke_json_prom in 45s
  ✓ Smoke JSON/Prom
  
✓ verify_auto_detect in 10s
  ✓ Verify
  
✓ final_summary_artifact in 5s
  ✓ Final Summary
  ✓ Upload artifact

✓ Run P0 Chain completed with 'success'
```

### Artifacts Content

**`evidence/final_summary.txt`:**
```
FINAL SUMMARY | CI:PASS | NGINX:PASS | PROM-CT:PASS | STANDALONE:PASS
```

**`evidence/head_response.txt`:**
```
HTTP/1.1 200 OK
Content-Type: application/x-yaml; charset=utf-8
Cache-Control: no-cache
...
```

**`evidence/smoke.json`:**
```json
{
  "ready_via": "prom",
  "port": 3004,
  "smoke_result": "PASS",
  "msgs_delta": 5,
  "staleness": 1.2
}
```

**`evidence/verify.log`:**
```
SUMMARY HEALTH:True REDIR1:True REDIR2:True UXACK:UX-ACK:6f982abc75df LINT:ADVISORY_PASS RESULT:PASS ✅ PORT:3004 SOURCE:prom STRICT:False
```

---

## 📚 Technical References

### GitHub Actions & Secrets

**Manual Workflow Trigger:**
- [GitHub Docs - Manually running a workflow](https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow)
- Requires `workflow_dispatch` event
- Only works on default branch

**GitHub CLI Secrets:**
- [gh secret set](https://cli.github.com/manual/gh_secret_set)
- Secrets encrypted at rest
- Never displayed in logs or API responses

### Next.js Standalone

**Configuration:**
- [next.config.js - output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- `output: 'standalone'` - recommended for production
- Custom server not supported in standalone mode
- Use `node .next/standalone/server.js` (NOT `next start`)

**Environment Variables:**
```bash
PORT=3004           # Server port
HOSTNAME=0.0.0.0    # Bind address (0.0.0.0 = all interfaces)
NODE_ENV=production # Environment
```

### Prometheus Content-Type

**Specification:**
- [Prometheus Content Negotiation](https://prometheus.io/docs/instrumenting/content_negotiation/)
- [OpenMetrics Spec](https://prometheus.io/docs/specs/om/open_metrics_spec/)
- Required: `text/plain; version=0.0.4`
- Version `0.0.4` stable since 2014

**Example Response:**
```
HTTP/1.1 200 OK
Content-Type: text/plain; version=0.0.4; charset=utf-8
Cache-Control: no-cache

# TYPE spark_ws_staleness_seconds gauge
spark_ws_staleness_seconds 0.566
```

### NGINX Headers

**Setting Cache-Control:**
- [NGINX add_header](https://nginx.org/en/docs/http/ngx_http_headers_module.html)
- [Cache-Control Headers Guide](https://webdock.io/en/docs/webdock-control-panel/optimizing-performance/setting-cache-control-headers-common-content-types-nginx-and-apache)

**Example:**
```nginx
location /desktop/latest.yml {
    add_header Content-Type "application/x-yaml; charset=utf-8";
    add_header Cache-Control "no-cache";
}
```

---

## 🎯 Complete Execution Example

```powershell
# === P0 CHAIN - PRODUCTION EXECUTION ===

# 1. Auth
gh auth status

# 2. Set Secrets (REPLACE WITH REAL VALUES!)
gh secret set SSH_HOST --repo mgymgy7878/CursorGPT_IDE --body "prod.spark.trading"
gh secret set SSH_USER --repo mgymgy7878/CursorGPT_IDE --body "deploy"
Get-Content $HOME\.ssh\id_rsa -Raw | gh secret set SSH_KEY --repo mgymgy7878/CursorGPT_IDE --body -
gh secret set CDN_HOST --repo mgymgy7878/CursorGPT_IDE --body "cdn.spark.trading"

# 3. Verify
gh secret list --repo mgymgy7878/CursorGPT_IDE

# 4. Trigger
gh workflow run p0-chain.yml --ref main

# 5. Wait & Get Run ID
Start-Sleep -Seconds 5
$run = (gh run list --workflow=p0-chain.yml --limit 1 --json databaseId -q '.[0].databaseId')
Write-Host "Run ID: $run"

# 6. Watch
gh run watch $run

# 7. Download Artifacts
New-Item -ItemType Directory -Force -Path evidence | Out-Null
gh run download $run -n p0-artifacts -D evidence

# 8. View Summary
Get-Content evidence/final_summary.txt | Select-Object -First 1

# Expected:
# FINAL SUMMARY | CI:PASS | NGINX:PASS | PROM-CT:PASS | STANDALONE:PASS
```

---

## 📋 Post-Deployment Checklist

After successful P0 Chain run:

- [ ] `final_summary.txt` shows all PASS
- [ ] `latest.yml` accessible on CDN
- [ ] Metrics endpoints responding (200 OK)
- [ ] Content-Type headers correct
- [ ] NGINX reloaded successfully
- [ ] No errors in workflow logs
- [ ] Artifacts downloaded successfully

---

## 🔗 Related Documentation

- [METRICS_CANARY.md](./METRICS_CANARY.md) - Prometheus CT & smoke test details
- [DEPLOY_STANDALONE.md](./DEPLOY_STANDALONE.md) - Next.js standalone deployment
- [LINT_STRICT_PLAN.md](./LINT_STRICT_PLAN.md) - ESLint/TS strict mode plan

---

## 📞 Support

**GitHub Actions Issues:**
- Check workflow logs: `gh run view <RUN_ID> --log-failed`
- View on GitHub: <https://github.com/mgymgy7878/CursorGPT_IDE/actions>

**SSH/NGINX Issues:**
- Test SSH: `ssh -i ~/.ssh/id_rsa deploy@prod.yourdomain.com`
- Test NGINX: `sudo nginx -t`

**Secrets Issues:**
- List secrets: `gh secret list --repo mgymgy7878/CursorGPT_IDE`
- Update secret: `gh secret set <NAME> --repo <REPO> --body "<VALUE>"`

---

**Last Updated:** 2025-10-24  
**Maintained By:** DevOps Team  
**Next Review:** After first successful production run
