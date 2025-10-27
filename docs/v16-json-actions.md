# v1.6 JSON Action Templates

## 1. StreamsLagHigh Alert
```json
{
  "action": "/alerts/create",
  "params": {
    "name": "StreamsLagHigh",
    "expr": "histogram_quantile(0.95, sum by (le,exchange) (rate(ws_gap_ms_bucket[5m]))) > 1500",
    "for": "10m",
    "labels": { "severity": "warning", "component": "streams" }
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "WS lag erken uyarısı"
}
```

## 2. SeqGapBurst Alert
```json
{
  "action": "/alerts/create",
  "params": {
    "name": "SeqGapBurst",
    "expr": "rate(ws_seq_gap_total[5m]) > 0",
    "for": "5m",
    "labels": { "severity": "warning", "component": "streams" }
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Sıra/gap tespiti"
}
```

## 3. Get Status
```json
{
  "action": "/tools/get_status",
  "params": { "detail": true },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Streams/Optimizer/Paper bileşenleri anlık sağlık"
}
```

## 4. Cardinality Advisor
```json
{
  "action": "/advisor/suggest",
  "params": {
    "topic": "streams.cardinality",
    "payload": { 
      "labels": ["exchange","channel","tf"], 
      "avoid": ["symbol","user","ip"] 
    }
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "Kardinalite patlamasını önleme önerileri"
}
```

## 5. Model Promote (Approval Required)
```json
{
  "action": "/model/promote",
  "params": { 
    "component": "optimization-lab", 
    "candidate": "v1.6.0-opt-runner" 
  },
  "dryRun": false,
  "confirm_required": true,
  "reason": "Runner yükseltmesi — onay kapısı"
}
```

## 6. Run Canary
```json
{
  "action": "/canary/run",
  "params": {
    "strategy": "sma_cross",
    "duration": "1h",
    "threshold": 0.05
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Paper-trade canary test"
}
```

## 7. Get Cardinality Status
```json
{
  "action": "/metrics/cardinality",
  "params": {
    "metric": "ws_msgs_total",
    "timeRange": "1h"
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Kardinalite durumu kontrolü"
}
