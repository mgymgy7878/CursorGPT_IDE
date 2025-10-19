# Canary & SLO Automation Playbook

## 1. Canary Dry-Run (UI Stabilize)
```json
{
  "action": "/canary/run",
  "params": {
    "profile": "demo",
    "scope": "ui-core",
    "artifacts": true
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "UI stabilize: olay kapanÄ±ÅŸÄ± iÃ§in kanÄ±t"
}
```

## 2. SLO Health Check (P95/Staleness/Error)
```json
{
  "action": "/tools/get_metrics",
  "params": {
    "set": [
      "ui_http_p95_ms",
      "ui_data_staleness_s",
      "ui_error_rate_s"
    ]
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "SLO doÄŸrulamasÄ±"
}
```

## 3. Alert Template (Early Warning)
```json
{
  "action": "/alerts/create",
  "params": {
    "name": "UI SLO Breach",
    "expr": "(ui_http_p95_ms > 1200) or (ui_data_staleness_s > 30)",
    "for": "2m",
    "severity": "warning",
    "labels": {
      "service": "web-next",
      "env": "demo"
    }
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "Erken ihlal uyarÄ±sÄ±"
}
```

## 4. Usage

### Canary Run
```bash
curl -X POST http://localhost:3003/api/canary/run \
  -H "Content-Type: application/json" \
  -d @canary-dry-run.json
```

### Metrics Check
```bash
curl -X POST http://localhost:3003/api/tools/get_metrics \
  -H "Content-Type: application/json" \
  -d @slo-health.json
```

### Alert Create
```bash
curl -X POST http://localhost:3003/api/alerts/create \
  -H "Content-Type: application/json" \
  -d @alert-template.json
```

## 5. Expected Results

- Canary: PASS, all routes render
- Metrics: P95<1200ms, Staleness<30s, Error<1%
- Alert: Created, notifying slack:#spark-alerts

