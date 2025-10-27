# Operations Runbook

## Proxy Operations

### Overview
The proxy system routes POST requests from the web frontend to the executor backend service. It includes hardening features like timeouts, size limits, and kill-switch functionality.

### Configuration

#### Environment Variables
- `EXECUTOR_ORIGIN`: Backend service URL (default: http://127.0.0.1:4001)
- `PROXY_KILL_SWITCH`: Emergency disable (0=normal, 1=disabled)

#### Endpoints
- `POST /api/public/*`: Proxy to executor
- `GET /api/public/metrics/prom`: Prometheus metrics
- `GET /api/local/health`: Local health check

### Monitoring

#### Prometheus Metrics
```
spark_proxy_requests_total{path,code}     # Request count by path and status
spark_proxy_errors_total{reason}          # Error count by reason
spark_proxy_duration_seconds{path}        # Request duration histogram
spark_proxy_body_rejected_total           # Body size rejections
```

#### Key Metrics to Watch
- `spark_proxy_errors_total`: Should be low (< 1% of requests)
- `spark_proxy_duration_seconds`: P95 < 5s
- `spark_proxy_body_rejected_total`: Should be 0 in normal operation

### Troubleshooting

#### Common Issues

**1. Proxy Returns 502 Bad Gateway**
```
Symptoms: All proxy requests fail with 502
Diagnosis: Executor service is down or unreachable
Solution: 
  - Check executor service: curl http://127.0.0.1:4001/api/public/health
  - Restart executor: cd services/executor && pnpm dev
  - Check network connectivity
```

**2. Proxy Returns 503 Service Unavailable**
```
Symptoms: All proxy requests fail with 503
Diagnosis: Kill-switch is active
Solution:
  - Check .env.local: PROXY_KILL_SWITCH=0
  - Restart web service to reload config
```

**3. Proxy Returns 413 Payload Too Large**
```
Symptoms: Large requests fail with 413
Diagnosis: Request body exceeds 10MB limit
Solution:
  - Reduce request payload size
  - Consider streaming for large data
  - Check if limit is appropriate for use case
```

**4. Proxy Returns 408 Request Timeout**
```
Symptoms: Requests timeout after 15 seconds
Diagnosis: Executor is slow or overloaded
Solution:
  - Check executor performance
  - Monitor executor metrics
  - Consider increasing timeout if needed
```

**5. Proxy Returns 400 Bad Request**
```
Symptoms: Requests fail with 400
Diagnosis: Invalid path segments or malformed request
Solution:
  - Check URL format: /api/public/[valid-segments]
  - Validate request headers
  - Check request body format
```

#### Debug Commands

**Health Check**
```bash
# Backend health
curl http://127.0.0.1:4001/api/public/health

# Proxy health
curl http://localhost:3000/api/local/health

# Metrics
curl http://localhost:3000/api/public/metrics/prom
```

**Proxy Test**
```bash
# Windows
scripts/test-proxy.cmd

# Linux/Mac
chmod +x scripts/test-proxy.sh
./scripts/test-proxy.sh
```

**Manual Testing**
```bash
# Echo test
curl -X POST http://localhost:3000/api/public/echo \
  -H "Content-Type: application/json" \
  -d '{"ping":"pong"}'

# Kill-switch test
PROXY_KILL_SWITCH=1 curl -X POST http://localhost:3000/api/public/echo \
  -H "Content-Type: application/json" \
  -d '{"ping":"pong"}'
```

### Emergency Procedures

#### Kill-Switch Activation
```bash
# Quick disable
echo "PROXY_KILL_SWITCH=1" >> apps/web-next/.env.local
# Restart web service
cd apps/web-next && pnpm dev
```

#### Kill-Switch Deactivation
```bash
# Re-enable
echo "PROXY_KILL_SWITCH=0" >> apps/web-next/.env.local
# Restart web service
cd apps/web-next && pnpm dev
```

#### Service Restart
```bash
# Stop all services
taskkill /f /im node.exe  # Windows
pkill -f node             # Linux/Mac

# Start executor
cd services/executor && pnpm dev

# Start web (in new terminal)
cd apps/web-next && pnpm dev
```

### Performance Tuning

#### Timeout Configuration
- Default: 15 seconds
- Adjust in route handler: `CONFIG.TIMEOUT_MS`
- Consider executor response times

#### Size Limits
- Default: 10MB
- Adjust in route handler: `CONFIG.MAX_BODY_SIZE`
- Monitor `spark_proxy_body_rejected_total`

#### Header Allowlist
- Current: content-type, accept, authorization, idempotency-key, x-request-id, user-agent
- Add new headers in route handler: `CONFIG.ALLOWED_HEADERS`

### Security

#### Header Filtering
- Only allowed headers are forwarded
- Authorization headers are masked in logs
- Sensitive headers (cookies, etc.) are dropped

#### Path Validation
- Only alphanumeric, underscore, hyphen allowed in path segments
- Prevents path traversal attacks

#### Error Handling
- Stack traces are not exposed to clients
- Generic error messages for security

### Logs

#### Log Format
```
[proxy] POST called with params: { path: ['echo'] }
[proxy] → http://127.0.0.1:4001/api/public/echo method:POST
[proxy] Filtered headers: { "content-type": "application/json" }
[proxy] upstream status: 200
```

#### Log Redaction
- Authorization headers are masked: `Bearer ****`
- No sensitive data in logs
- Request bodies are not logged

### Alerts

#### Recommended Alerts
- `spark_proxy_errors_total > 0` for 5 minutes
- `spark_proxy_duration_seconds > 10` for 5 minutes
- `spark_proxy_body_rejected_total > 0` for 1 minute
- Executor health check fails for 2 minutes

#### SLO Targets
- Availability: 99.9%
- Latency P95: < 5 seconds
- Error rate: < 1%
- Body rejection rate: < 0.1% 

# Observability

- Paneller: ai_token_in_total, ai_token_out_total, ai_cost_usd_total, ai_router_choice_total, ai_json_out_total, ai_guarded_actions_total, ai_sse_clients, ai_override_total
- Örnek PromQL:
  - sum(rate(ai_token_out_total[5m])) by (model)
  - sum(rate(ai_cost_usd_total[15m])) by (provider)
  - sum(increase(ai_guarded_actions_total{confirmed="true"}[1d]))
  - max(ai_sse_clients)
  - sum(increase(ai_override_total[1h])) by (op) 

## Drift Explain
- Komut: `/drift.explain symbol=BTCUSDT window=24h --json`
- Metrik: `ai_drift_explain_total`
- Panel: Drift Explain requests (5m rate)

## Drift Compare
- Komut: `/drift.compare symbol=BTCUSDT baseline=YYYY-MM-DD window=24h --json`
- Metrik: `ai_drift_compare_total`
- Panel: Drift Compare requests (5m rate)

## Model Hint
- Komut: `/model.hint symbol=ETHUSDT tf=4h max_latency_ms=1200 cost_tier=mid --json`
- Metrik: `ai_model_hint_total`
- Panel: Model Hint requests (5m rate)

## Routing Meta
- SSE meta: `routing=override|policy|auto` ve `routingReason=...` satırları

## Audit UI v2
- Sort: kolon başlığına tıkla (▲/▼)
- CSV: "CSV indir" ile tabloyu dışa aktar
- Bucket: 1h / 6h / 1d hızlı tarih aralığı

## ChatDock autosend
- `NEXT_PUBLIC_PREFILL_AUTOSEND=1` → prefill sonrası otomatik gönderim 