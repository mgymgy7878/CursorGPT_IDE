# Guardrails Runbook

## Overview
Guardrails system for risk management and parameter approval. Provides param-diff approval workflow and risk gate protection.

## Environment Variables

### Risk Thresholds
- `RISK_MAX_NOTIONAL`: Maximum portfolio notional value
- `RISK_MAX_DRAWDOWN_PCT`: Maximum drawdown percentage
- `RISK_PNL_DAY_LIMIT`: Daily PnL loss limit

## API Endpoints

### Parameter Management
- `POST /params/submit` - Submit new parameter set (enqueued as pending)
- `GET /params/pending` - List pending parameter changes
- `POST /params/approve` - Approve parameter changes (confirm_required)

### Canary Testing
- `GET /canary/strategies?dry=true` - Simulate plan→order path, report would-block reasons

## Approval Policy

### Confirm Required (confirm_required=true)
- Live trade/cancel operations
- Threshold changes
- Parameter modifications
- Model promotions

### No Confirmation Required
- Dry-run operations
- Reporting/analytics
- Read-only operations

## Risk Gate Logic

### Blocking Conditions
1. **Max Notional**: Portfolio value exceeds `RISK_MAX_NOTIONAL`
2. **Max Drawdown**: Current drawdown exceeds `RISK_MAX_DRAWDOWN_PCT`
3. **PnL Day Limit**: Daily loss exceeds `RISK_PNL_DAY_LIMIT`

### Metrics
- `guardrails_blocks_total{reason}` - Blocked actions by reason
- `guardrails_param_diff_pending_total{strategy}` - Pending parameter changes
- `guardrails_param_apply_total{status}` - Applied parameter changes
- `canary_ack_ms{route,status}` - Canary test latency

## Smoke Testing

### Local Smoke Test
```bash
pnpm -w build && node services/executor/dist/index.cjs
pwsh ./scripts/guardrails-smoke.ps1
```

### CI Smoke Test
- Automatic on push/PR
- Tests param submission, pending queue, canary strategies
- Validates guardrails metrics presence

## Audit Trail

### Audit Fields
- `action`: Operation type (order.block, param.approve, etc.)
- `reason`: Block reason or approval rationale
- `th`: Risk thresholds at time of decision
- `ctx`: Context (portfolio state, drawdown, etc.)

### UI Integration
- "Reason + Evidence" display for all decisions
- Parameter review page for approve/deny workflow
- Copilot suggestions with automatic evidence attachment

## Rollback Procedures

### Parameter Rollback
1. Revert to previous parameter set
2. Update pending queue
3. Reset metrics counters

### Risk Gate Rollback
1. Adjust risk thresholds
2. Clear blocked orders queue
3. Reset guardrails metrics

## Troubleshooting

### Common Issues
1. **Metrics Missing**: Verify guardrails package import
2. **Canary Failures**: Check risk threshold configuration
3. **Param Queue Issues**: Verify in-memory queue state

### Logs
- Service logs: `logs/executor-combined.log`
- Error logs: `logs/executor-error.log`
- Audit logs: Check audit trail for decision history

## Persistence

### JSONL Storage
- **Pending**: `data/guardrails/pending-YYYYMMDD.jsonl`
- **History**: `data/guardrails/history-YYYYMMDD.jsonl`
- **Rotation**: Automatic cleanup after 7 days
- **Backup**: Files preserved for audit trail

### File Structure
```
data/guardrails/
├── pending-20250102.jsonl
├── history-20250102.jsonl
└── ...
```

## Alerts

### Prometheus Alerts
- **GuardrailsParamPendingTooLong**: Pending > 2h (warning)
- **GuardrailsParamQueueLarge**: Queue size > 10 (warning)
- **GuardrailsBlocksHigh**: High block rate (critical)

### Alert Configuration
```yaml
# ops/prometheus/guardrails-alerts.yml
groups:
- name: guardrails
  rules:
  - alert: GuardrailsParamPendingTooLong
    expr: max_over_time(guardrails_pending_age_seconds[5m]) > 7200
    for: 10m
    labels: { severity: warning }
    annotations: { summary: "Param diff pending > 2h", runbook: "docs/GUARDRAILS_RUNBOOK.md" }
```

## Audit Trail

### Audit Fields
- **action**: Operation type (order.block, param.approve, param.deny)
- **reason**: Block reason or approval rationale
- **th**: Risk thresholds at time of decision
- **ctx**: Context (portfolio state, drawdown, etc.)
- **actor**: User/system performing action
- **ts**: Timestamp of decision

### Evidence Collection
- **Canary**: Block/allow decisions with evidence
- **Params**: Approval/denial with reasoning
- **History**: Complete audit trail in JSONL

## DB Persist (Executor)

### Prisma Mode
- **ENV set edilirse**: `PRISMA_DATABASE_URL` → ParamChange & AuditEvent tabloları aktif
- **ENV yoksa**: JSONL fallback (`data/guardrails/*`)
- **CI**: `guardrails-db-smoke` workflow
- **Rollback**: ENV'i temizle → servis otomatik JSONL moda döner

### Database Schema
```sql
-- ParamChange table
CREATE TABLE param_change (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy VARCHAR NOT NULL,
  diff JSONB NOT NULL,
  new_params JSONB NOT NULL,
  status VARCHAR DEFAULT 'pending',
  requested_by VARCHAR NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  decided_by VARCHAR,
  decided_at TIMESTAMP
);

-- AuditEvent table  
CREATE TABLE audit_event (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR NOT NULL,
  reason VARCHAR,
  actor VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  ts TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables
- `PRISMA_DATABASE_URL`: PostgreSQL connection string
- `X-Actor`: HTTP header for actor identification (defaults to 'system')

## Next Steps (48h Plan)

### T0-T8: Bootstrap ✅
- Apply guardrails patch
- Run smoke tests
- Verify metrics collection

### T8-T24: Persistence ✅
- JSONL-based persistence implemented
- Audit trail with evidence
- Alert configuration ready

### T24-T48: DB Persist ✅
- Prisma schema with ParamChange & AuditEvent
- Runtime switch between DB and JSONL
- CI workflow for DB smoke testing
- Actor-based audit trail

### T48-T72: UI Integration
- Parameter review page
- Approve/deny workflow
- Copilot evidence attachment
- Dashboard integration
