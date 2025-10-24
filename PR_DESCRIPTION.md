# feat(standards): Prometheus 0.0.4 text metrics + RFC 9512 YAML + evidence

## 🎯 Overview

P0 standards hardening for production-ready metrics and configuration compliance.

### Changes

1. **Prometheus Text Format Endpoint** (`/api/public/metrics.prom`)
   - ✅ Official Content-Type: `text/plain; version=0.0.4; charset=utf-8`
   - ✅ Cache-Control headers
   - ✅ Valid Prometheus exposition format

2. **NGINX Production Configuration** (`deploy/nginx/spark.conf`)
   - ✅ RFC 9512: `application/yaml` media type
   - ✅ Security headers with `always` flag
   - ✅ Rate limiting (API: 10r/s, WS: 100r/s)
   - ✅ SSL/TLS ready
   - ✅ Documented `add_header` inheritance behavior

3. **Environment Variables** (`.env.example`)
   - ✅ SSH deployment placeholders
   - ✅ CDN configuration
   - ✅ Production domain settings

4. **Evidence Collection** (`evidence/`)
   - ✅ Prometheus endpoint HTTP trace
   - ✅ NGINX configuration proofs
   - ✅ Compliance documentation

5. **Automated Testing**
   - ✅ Unit tests (Jest) - Prometheus headers
   - ✅ E2E tests (Playwright) - Runtime validation
   - ✅ CI workflow - Headers smoke tests
   - ✅ NGINX config validation script

## 📋 Verification Commands

### Prometheus Endpoint
```powershell
$r = Invoke-WebRequest http://127.0.0.1:3003/api/public/metrics.prom
$r.Headers['Content-Type']
# Expected: text/plain; version=0.0.4; charset=utf-8
```

### NGINX Configuration
```bash
# Verify YAML media type
grep -n "application/yaml" deploy/nginx/spark.conf

# Verify security headers
grep -n "add_header.*always" deploy/nginx/spark.conf

# Run validation script
chmod +x tools/verify_nginx_headers.sh
./tools/verify_nginx_headers.sh
```

### Smoke Test
```powershell
# Quick headers check
.\scripts\smoke_headers_prom.ps1 -Port 3003
# Expected: SMOKE: PASS
```

## 🧪 Tests Added

| Type | Count | Files |
|------|-------|-------|
| Unit | 6 | `route.test.ts` |
| E2E | 5 | `headers.spec.ts` |
| CI Jobs | 4 | `headers-smoke.yml` |

**Coverage:**
- ✅ Prometheus Content-Type validation
- ✅ Cache-Control headers
- ✅ Text format body validation
- ✅ Metric name regex compliance
- ✅ Security headers presence
- ✅ NGINX configuration syntax

## 📚 References

**Standards:**
- [Prometheus 0.0.4 Format](https://chromium.googlesource.com/external/github.com/prometheus/common/+/refs/tags/v0.63.0/expfmt/expfmt.go)
- [RFC 9512: YAML Media Type](https://www.rfc-editor.org/rfc/rfc9512.html)
- [NGINX Headers Module](https://nginx.org/en/docs/http/ngx_http_headers_module.html)

**Documentation:**
- [docs/METRICS_CANARY.md](docs/METRICS_CANARY.md) - Updated with evidence section
- [evidence/README.md](evidence/README.md) - Compliance proofs

## ⚠️ Notes

### NGINX `add_header` Inheritance

**Important:** Child `location{}` blocks with `add_header` **do NOT** inherit parent headers. Use `always` flag to apply to all response codes (including 4xx, 5xx).

```nginx
# Parent headers (server block)
add_header X-Frame-Options "DENY" always;

# Child location with own add_header - parent headers NOT inherited
location /api/ {
    add_header Cache-Control "no-store" always;
    # Must re-declare X-Frame-Options here if needed
}
```

### Evidence Files

Evidence files are **not committed** to the repository (gitignored). They are generated locally during smoke tests and can be recreated with:

```powershell
# Regenerate evidence
pnpm --filter web-next dev
.\scripts\smoke_headers_prom.ps1
```

## ✅ Checklist

- [x] Prometheus endpoint returns correct Content-Type
- [x] NGINX configuration validated
- [x] Unit tests added and passing
- [x] E2E tests added and passing
- [x] CI workflow configured
- [x] Documentation updated
- [x] Evidence collection automated
- [x] Validation scripts executable

## 🔄 CI Status

GitHub Actions will run:
1. **Unit Tests** - Metrics route headers
2. **Headers Check** - Runtime validation
3. **NGINX Config** - Static analysis
4. **E2E Tests** - Browser-based validation

All must pass before merge.

---

**Branch:** `docs/v1.0-headers-metrics`  
**Commits:** 2 (4d7ef5f, 4ba5b31)  
**Files Changed:** 28  
**Lines Added:** +5,000+

