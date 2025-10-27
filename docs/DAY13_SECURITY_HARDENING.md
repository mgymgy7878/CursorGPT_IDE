# DAY-13 Security Hardening Pack - Operations Guide

## Overview

DAY-13 Security Hardening Pack, production-grade güvenlik, mTLS, key pinning, signed audit trail ve supply chain güvenliği sağlayan kapsamlı bir sistemdir. Certificate pinning, cryptographic audit logs, admin guardrails ve vulnerability scanning ile sistem güvenliğini artırır.

## Components

### 1. mTLS (Optional)
- **TLS Server**: HTTPS server with optional mTLS
- **Client Certificate**: Mutual TLS authentication
- **Certificate Management**: Development and production certs
- **Fallback**: Graceful fallback to HTTP

### 2. Key Pinning (SPKI)
- **Outbound TLS**: SPKI SHA256 pinning for external hosts
- **Host Validation**: Configurable host list for pinning
- **Pin Rotation**: Support for multiple pins during rotation
- **Error Handling**: Clear error messages for pin failures

### 3. Signed Audit Trail
- **Ed25519 Signatures**: Cryptographic audit log signing
- **Chain Verification**: Tamper-evident audit chain
- **Hash Verification**: SHA256 hash verification
- **Real-time Logging**: Critical operation logging

### 4. Admin Guard
- **Token-based Authentication**: Admin token validation
- **Protected Routes**: Security endpoints protection
- **Access Logging**: Admin access tracking
- **IP Tracking**: Request source logging

### 5. Secret Rotation
- **Hot Reload**: Runtime secret rotation
- **Client Re-initialization**: Exchange client refresh
- **Cache Flush**: Configuration cache clearing
- **WebSocket Renewal**: Connection refresh

### 6. Supply Chain Security
- **OSV Scanner**: Open source vulnerability scanning
- **Trivy**: Container image vulnerability scanning
- **SBOM Generation**: Software bill of materials
- **Cosign Attestation**: Cryptographic attestation

## Environment Variables

```bash
# ---- TLS SERVER (optional mTLS) ----
TLS_ENABLED=false
TLS_KEY_FILE=runtime/certs/server.key
TLS_CERT_FILE=runtime/certs/server.crt
TLS_CLIENT_CA_FILE=runtime/certs/clients_ca.crt
TLS_REQUEST_CLIENT_CERT=true

# ---- TLS OUTBOUND PINNING ----
PIN_SPki_SHA256_BASE64=                               # örn: "W6ph5...="
PIN_HOSTS=api.binance.com,testnet.binance.vision

# ---- AUDIT TRAIL ----
AUDIT_PRIV_KEY_FILE=runtime/keys/audit_ed25519.key
AUDIT_PUB_KEY_FILE=runtime/keys/audit_ed25519.pub
AUDIT_LOG_DIR=runtime/audit
AUDIT_ENABLE=true

# ---- ADMIN GUARD ----
ADMIN_TOKEN_FILE=runtime/admin_token.txt

# ---- SECURITY ROTATION ----
ROTATION_ALLOW_INPLACE=true
```

## Certificate Operations

### Development Certificate Generation
```bash
# Generate development certificates
.\runtime\sec_gen_certs.cmd

# Expected output:
# - runtime\certs\server.key (server private key)
# - runtime\certs\server.crt (server certificate)
# - runtime\certs\client.key (client private key)
# - runtime\certs\client.crt (client certificate)
# - runtime\certs\clients_ca.crt (client CA for mTLS)
```

### Production Certificate Setup
```bash
# For production, use proper CA-signed certificates
# Place certificates in runtime/certs/ directory
# Set TLS_ENABLED=true in environment
```

### TLS Testing
```bash
# Test TLS server
set TLS_ENABLED=true
# Start executor
curl -k -s -o NUL -w "%{http_code}\n" https://127.0.0.1:4001/api/public/health

# Expected: 200 (with -k for self-signed certs)
```

## Key Pinning Operations

### SPKI Hash Generation
```bash
# Get SPKI hash for a host
openssl s_client -connect api.binance.com:443 -servername api.binance.com < /dev/null 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64

# Expected output: Base64 encoded SPKI hash
```

### Pin Configuration
```bash
# Set pin in environment
set PIN_SPki_SHA256_BASE64=YOUR_SPKI_HASH_HERE
set PIN_HOSTS=api.binance.com,testnet.binance.vision

# Test pinning
curl -s -o NUL -w "%{http_code}\n" http://127.0.0.1:4001/api/private/health

# Expected: 200 (if pin is correct), error (if pin is wrong)
```

### Pin Rotation
```bash
# During certificate rotation, support multiple pins
set PIN_SPki_SHA256_BASE64=OLD_HASH,NEW_HASH

# After rotation period, update to new hash only
set PIN_SPki_SHA256_BASE64=NEW_HASH
```

## Audit Trail Operations

### Key Generation
```bash
# Generate Ed25519 audit keys
.\runtime\sec_gen_audit_keys.cmd

# Expected output:
# - runtime\keys\audit_ed25519.key (private key)
# - runtime\keys\audit_ed25519.pub (public key)
```

### Audit Verification
```bash
# Verify audit trail integrity
.\runtime\sec_audit_verify.cmd YOUR_ADMIN_TOKEN

# Expected response:
{
  "ok": true,
  "count": 42,
  "message": "All entries verified"
}
```

### Audit Log Structure
```json
{
  "ts": 1704067200000,
  "type": "order.post",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "quantity": "0.001"
  },
  "prevHash": "abc123...",
  "sig": "base64_signature",
  "hash": "def456..."
}
```

## Admin Guard Operations

### Admin Token Setup
```bash
# Create admin token file
echo "your-secure-admin-token-here" > runtime/admin_token.txt

# Test admin access
curl -s -H "X-Admin-Token: your-secure-admin-token-here" http://127.0.0.1:4001/api/private/security/status

# Expected: 200 with security status
```

### Admin Endpoints
```bash
# Security status
GET /api/private/security/status

# Audit verification
GET /api/private/security/audit/verify

# Secret rotation
POST /api/private/security/rotate/reload
```

### Access Control
```bash
# Unauthorized access (should return 401)
curl -s -H "X-Admin-Token: BAD_TOKEN" http://127.0.0.1:4001/api/private/security/status

# Authorized access (should return 200)
curl -s -H "X-Admin-Token: YOUR_ADMIN_TOKEN" http://127.0.0.1:4001/api/private/security/status
```

## Secret Rotation Operations

### Hot Reload
```bash
# Trigger secret rotation
.\runtime\sec_rotate_reload.cmd YOUR_ADMIN_TOKEN

# Expected response:
{
  "reloaded": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "note": "Inject real reload hooks"
}
```

### Rotation Hooks (Implementation)
```typescript
// Example rotation hooks to implement:
// 1. BinancePrivateClient re-initialization
// 2. WebSocket listen-key renewal
// 3. Exchange info cache flush
// 4. Tenant configuration reload
```

## Supply Chain Security

### GitHub Actions Security Gate
```yaml
# Automatic security checks on PR/push:
# - OSV Scanner: Open source vulnerabilities
# - Trivy: Container image vulnerabilities
# - SBOM: Software bill of materials
# - Dependency audit: npm audit
```

### Vulnerability Scanning
```bash
# Local OSV scanning
osv-scanner .

# Local Trivy scanning
trivy image spark-executor:test

# Local dependency audit
pnpm audit --audit-level=high
```

### SBOM Generation
```bash
# Generate SBOM
syft packages . -o spdx-json > sbom-spdx.json

# Verify SBOM
syft verify sbom-spdx.json
```

## Security Testing

### TLS/mTLS Testing
```bash
# 1. Generate certificates
.\runtime\sec_gen_certs.cmd

# 2. Enable TLS
set TLS_ENABLED=true

# 3. Test HTTPS
curl -k -s -o NUL -w "%{http_code}\n" https://127.0.0.1:4001/api/public/health

# Expected: 200
```

### SPKI Pinning Testing
```bash
# 1. Set wrong pin (should fail)
set PIN_SPki_SHA256_BASE64=WRONG_HASH
curl -s -o NUL -w "%{http_code}\n" http://127.0.0.1:4001/api/private/health

# Expected: Error due to pin mismatch

# 2. Set correct pin (should work)
set PIN_SPki_SHA256_BASE64=CORRECT_HASH
curl -s -o NUL -w "%{http_code}\n" http://127.0.0.1:4001/api/private/health

# Expected: 200
```

### Audit Trail Testing
```bash
# 1. Generate audit keys
.\runtime\sec_gen_audit_keys.cmd

# 2. Trigger audit events (place orders, etc.)
curl -X POST http://127.0.0.1:4001/api/private/order/shadow -H "Content-Type: application/json" -d '{"symbol":"BTCUSDT"}'

# 3. Verify audit trail
.\runtime\sec_audit_verify.cmd YOUR_ADMIN_TOKEN

# Expected: {"ok": true, "count": N, "message": "All entries verified"}
```

### Admin Guard Testing
```bash
# 1. Test unauthorized access
curl -s -H "X-Admin-Token: BAD" http://127.0.0.1:4001/api/private/security/status

# Expected: {"error": "ADMIN_ONLY"}

# 2. Test authorized access
curl -s -H "X-Admin-Token: YOUR_ADMIN_TOKEN" http://127.0.0.1:4001/api/private/security/status

# Expected: Security status JSON
```

## Monitoring & Alerting

### Security Metrics
```bash
# Check security status
curl -s -H "X-Admin-Token: YOUR_ADMIN_TOKEN" http://127.0.0.1:4001/api/private/security/status

# Expected response:
{
  "tls": true,
  "audit": true,
  "pinning": {
    "enabled": true,
    "hosts": ["api.binance.com", "testnet.binance.vision"]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Audit Monitoring
```bash
# Monitor audit log
tail -f runtime/audit/audit.ndjson

# Check audit integrity
.\runtime\sec_audit_verify.cmd YOUR_ADMIN_TOKEN
```

### TLS Monitoring
```bash
# Check TLS status
curl -k -I https://127.0.0.1:4001/api/public/health

# Check certificate expiry
openssl x509 -in runtime/certs/server.crt -noout -dates
```

## Troubleshooting

### TLS Issues

#### Certificate Problems
```bash
# Check certificate validity
openssl x509 -in runtime/certs/server.crt -text -noout

# Check certificate expiry
openssl x509 -in runtime/certs/server.crt -noout -enddate

# Regenerate certificates
.\runtime\sec_gen_certs.cmd
```

#### mTLS Issues
```bash
# Check client certificate
openssl x509 -in runtime/certs/client.crt -text -noout

# Test mTLS connection
curl -k --cert runtime/certs/client.crt --key runtime/certs/client.key https://127.0.0.1:4001/api/public/health
```

### Pinning Issues

#### Wrong SPKI Hash
```bash
# Get correct SPKI hash
openssl s_client -connect api.binance.com:443 -servername api.binance.com < /dev/null 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64

# Update environment variable
set PIN_SPki_SHA256_BASE64=CORRECT_HASH
```

#### Host Not Pinned
```bash
# Check pinned hosts
echo %PIN_HOSTS%

# Add host to pinning
set PIN_HOSTS=api.binance.com,testnet.binance.vision,your-host.com
```

### Audit Issues

#### Key Problems
```bash
# Regenerate audit keys
.\runtime\sec_gen_audit_keys.cmd

# Check key permissions
ls -la runtime/keys/

# Verify key format
openssl pkey -in runtime/keys/audit_ed25519.key -text -noout
```

#### Verification Failures
```bash
# Check audit log format
tail -n 5 runtime/audit/audit.ndjson

# Manual verification
.\runtime\sec_audit_verify.cmd YOUR_ADMIN_TOKEN

# Check for tampering
diff runtime/audit/audit.ndjson runtime/audit/audit.ndjson.backup
```

### Admin Guard Issues

#### Token Problems
```bash
# Check token file
cat runtime/admin_token.txt

# Regenerate token
echo "new-secure-token-$(date +%s)" > runtime/admin_token.txt

# Test token
curl -s -H "X-Admin-Token: new-secure-token" http://127.0.0.1:4001/api/private/security/status
```

#### Permission Issues
```bash
# Check file permissions
ls -la runtime/admin_token.txt

# Fix permissions
chmod 600 runtime/admin_token.txt
```

## Emergency Procedures

### Certificate Emergency
```bash
# Disable TLS temporarily
set TLS_ENABLED=false

# Restart executor
# Verify HTTP access
curl -s http://127.0.0.1:4001/api/public/health

# Regenerate certificates
.\runtime\sec_gen_certs.cmd

# Re-enable TLS
set TLS_ENABLED=true
```

### Pinning Emergency
```bash
# Disable pinning temporarily
set PIN_SPki_SHA256_BASE64=

# Restart executor
# Verify outbound connections work

# Get correct pin and re-enable
set PIN_SPki_SHA256_BASE64=CORRECT_HASH
```

### Audit Emergency
```bash
# Disable audit temporarily
set AUDIT_ENABLE=false

# Restart executor
# Verify operations work

# Re-enable audit
set AUDIT_ENABLE=true
```

### Admin Token Emergency
```bash
# Generate new admin token
echo "emergency-token-$(date +%s)" > runtime/admin_token.txt

# Test new token
curl -s -H "X-Admin-Token: emergency-token" http://127.0.0.1:4001/api/private/security/status
```

## Best Practices

### Certificate Management
1. **Development**: Use self-signed certificates
2. **Production**: Use CA-signed certificates
3. **Rotation**: Plan certificate rotation schedule
4. **Backup**: Keep certificate backups secure

### Key Pinning
1. **Multiple Pins**: Support pin rotation
2. **Host Validation**: Pin only critical hosts
3. **Error Handling**: Clear error messages
4. **Monitoring**: Monitor pin failures

### Audit Trail
1. **Real-time Logging**: Log critical operations
2. **Chain Integrity**: Verify audit chain regularly
3. **Backup**: Secure audit log backups
4. **Retention**: Define audit log retention policy

### Admin Security
1. **Strong Tokens**: Use cryptographically strong tokens
2. **Token Rotation**: Regular token rotation
3. **Access Logging**: Log all admin access
4. **Principle of Least Privilege**: Minimal admin access

### Supply Chain
1. **Regular Scanning**: Automated vulnerability scanning
2. **SBOM Management**: Maintain accurate SBOM
3. **Dependency Updates**: Regular dependency updates
4. **Attestation**: Cryptographic attestation for releases

## Security Checklist

### Daily Checks
- [ ] TLS certificate validity
- [ ] SPKI pin verification
- [ ] Audit trail integrity
- [ ] Admin access logs
- [ ] Security endpoint health

### Weekly Reviews
- [ ] Certificate expiry review
- [ ] Pin rotation planning
- [ ] Audit log analysis
- [ ] Admin token rotation
- [ ] Vulnerability scan results

### Monthly Assessments
- [ ] Security policy review
- [ ] Certificate rotation
- [ ] Audit trail backup
- [ ] Admin access review
- [ ] Supply chain security review

---

**Bu operasyon kılavuzu, DAY-13 Security Hardening Pack'in etkili kullanımı için gerekli tüm bilgileri içerir. Tüm operasyonlar production-safe olarak tasarlanmıştır.** 