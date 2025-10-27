# Spark Proxy Security Documentation

## Overview

The Spark Proxy implements two authentication modes for securing communication between the UI and Executor services:

1. **Bearer Token Authentication** (Default)
2. **HMAC-SHA256 Authentication** (Optional)

## Authentication Modes

### Bearer Token Authentication

**Default Mode**: Simple token-based authentication using HTTP Authorization header.

#### Configuration

```bash
# UI (.env.local)
EXECUTOR_TOKEN=dev-secret-change-me
EXECUTOR_AUTH_MODE=bearer

# Executor (.env)
EXECUTOR_TOKEN=dev-secret-change-me
```

#### Flow

1. **UI Request**: Proxy adds `Authorization: Bearer <token>` header
2. **Executor Validation**: Middleware checks token match
3. **Response**: 401 if token invalid, proceed if valid

#### Example

```bash
# Valid request
curl -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-secret-change-me" \
  -d '{"ping":"pong"}'

# Invalid request (returns 401)
curl -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong-token" \
  -d '{"ping":"pong"}'
```

### HMAC-SHA256 Authentication

**Optional Mode**: Cryptographically secure authentication using HMAC signatures.

#### Configuration

```bash
# UI (.env.local)
EXECUTOR_HMAC_SECRET=dev-hmac-change-me
EXECUTOR_AUTH_MODE=hmac

# Executor (.env)
EXECUTOR_HMAC_SECRET=dev-hmac-change-me
```

#### Flow

1. **UI Request**: 
   - Generate timestamp: `ts = Date.now().toString()`
   - Calculate signature: `sig = HMAC_SHA256(body + "." + ts, secret)`
   - Add headers: `x-timestamp: ts`, `x-signature: sig`

2. **Executor Validation**:
   - Check timestamp skew (±5 minutes)
   - Verify HMAC signature
   - Reject if invalid

3. **Response**: 401 if validation fails, proceed if valid

#### Example

```bash
# Valid HMAC request (JavaScript example)
const crypto = require('crypto');
const body = JSON.stringify({ping: "pong"});
const timestamp = Date.now().toString();
const signature = crypto
  .createHmac('sha256', 'dev-hmac-change-me')
  .update(body + '.' + timestamp)
  .digest('hex');

curl -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $timestamp" \
  -H "x-signature: $signature" \
  -d "$body"
```

## Security Features

### Timestamp Skew Protection

- **Window**: ±5 minutes (300,000ms)
- **Purpose**: Prevent replay attacks
- **Validation**: `Math.abs(Date.now() - timestamp) <= 300000`

### Header Allowlist

Only authorized headers are forwarded to the executor:

```typescript
ALLOWED_HEADERS = [
  "content-type",
  "accept", 
  "authorization",
  "idempotency-key",
  "x-request-id",
  "x-timestamp",
  "x-signature",
  "user-agent"
]
```

### Log Redaction

Sensitive headers are masked in logs:

```typescript
// Before: Authorization: Bearer secret-token-123
// After:  Authorization: Bearer ****
```

### Request Tracing

Every request gets a unique ID for correlation:

```typescript
// Auto-generated if not provided
x-request-id: 550e8400-e29b-41d4-a716-446655440000
```

## Error Responses

### Authentication Errors (401)

```json
{
  "ok": false,
  "code": "unauthorized"
}
```

### Rate Limiting (429)

```json
{
  "ok": false,
  "error": "rate_limited",
  "message": "Too many requests"
}
```

### Circuit Breaker (503)

```json
{
  "ok": false,
  "error": "circuit_open",
  "message": "Service temporarily unavailable"
}
```

## Production Considerations

### Token Management

1. **Rotate tokens regularly** (monthly recommended)
2. **Use strong secrets** (32+ characters)
3. **Store securely** (environment variables, secret managers)
4. **Monitor usage** (Prometheus metrics)

### HMAC Best Practices

1. **Clock synchronization** between services
2. **Secure secret storage** (no hardcoding)
3. **Regular secret rotation**
4. **Monitor timestamp skew** in metrics

### Security Headers

```bash
# Additional security headers to consider
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check token/secret configuration
   - Verify auth mode setting
   - Check timestamp skew (HMAC mode)

2. **Timestamp Skew (HMAC)**
   - Synchronize system clocks
   - Check timezone settings
   - Monitor skew metrics

3. **Signature Mismatch (HMAC)**
   - Verify secret is identical
   - Check body encoding
   - Validate timestamp format

### Debug Commands

```bash
# Check auth configuration
curl -X GET http://localhost:3003/api/public/debug

# Test HMAC signature
echo -n '{"ping":"pong"}.1755518526812' | openssl dgst -sha256 -hmac "dev-hmac-change-me"

# Monitor metrics
curl -s http://localhost:3003/api/public/metrics/prom | grep spark_proxy
```

## Migration Guide

### From No Auth to Bearer

1. Set `EXECUTOR_TOKEN` in both services
2. Set `EXECUTOR_AUTH_MODE=bearer`
3. Update client code to include Authorization header
4. Test with smoke scripts

### From Bearer to HMAC

1. Set `EXECUTOR_HMAC_SECRET` in both services
2. Set `EXECUTOR_AUTH_MODE=hmac`
3. Update client code to generate signatures
4. Test timestamp handling
5. Monitor for skew issues

### Rollback Plan

1. Set `EXECUTOR_AUTH_MODE=bearer` (or remove auth)
2. Restart services
3. Verify functionality
4. Investigate issues
5. Re-enable when resolved 