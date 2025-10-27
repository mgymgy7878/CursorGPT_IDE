# Fusion Gate v1.3.4-p4 Acceptance Criteria

## Definition of Done

### ✅ CI "route-200" Guard
- [ ] GitHub Actions job "Verify Fusion Gate" runs on every PR/push
- [ ] Job fails if `/api/public/fusion/risk.gate/status` returns non-200
- [ ] Job fails if response doesn't contain `"ok": true`
- [ ] Job passes for both status and apply endpoints
- [ ] Build pipeline fails if guard fails

### ✅ Alert Smoke Test (Stage)
- [ ] `RunnerHighRisk-smoke` alert created in stage environment
- [ ] Alert transitions from PENDING → FIRING in Alertmanager
- [ ] Alert automatically resolves when suppressed
- [ ] Alert lifecycle logged and verified
- [ ] Test alert cleaned up after completion

### ✅ Daily Risk Report Integration
- [ ] `fusion_gate_shadow_evidence` section included in daily report
- [ ] Report contains decision_id, timestamp, mode, band, score, action
- [ ] Report includes latency metrics (P50, P95)
- [ ] Report includes endpoint test results
- [ ] Success rate calculated and included

### ✅ Canary → Enforce Transition
- [ ] Enforce transition requires explicit confirmation
- [ ] Pre-flight checks validate executor health
- [ ] Current mode verified before transition
- [ ] Dry-run mode available for testing
- [ ] Rollback plan documented and tested

### ✅ Deprecation Plan
- [ ] Root alias routes return `Deprecation: true` header
- [ ] Audit warnings logged for root alias usage
- [ ] Migration documentation provided
- [ ] Client teams notified of timeline
- [ ] Rollback plan documented

## Success Metrics

### Performance
- [ ] Prefixed endpoints respond < 100ms P95
- [ ] Root alias endpoints respond < 100ms P95
- [ ] No performance degradation during transition

### Reliability
- [ ] 99.9% uptime for both endpoint sets
- [ ] Zero data loss during transitions
- [ ] Graceful error handling

### Security
- [ ] All endpoints require proper authentication
- [ ] Audit logs capture all decisions
- [ ] No sensitive data in logs

## Rollback Criteria

Immediate rollback if:
- [ ] Any endpoint returns 500 errors
- [ ] Performance degrades > 20%
- [ ] Data loss detected
- [ ] Security breach identified

## Monitoring

### Alerts
- [ ] `FusionGateEndpointDown` - Any endpoint returns 4xx/5xx
- [ ] `FusionGateHighLatency` - P95 latency > 200ms
- [ ] `FusionGateErrorRate` - Error rate > 1%

### Dashboards
- [ ] Endpoint availability (4xx/5xx rates)
- [ ] Response time percentiles
- [ ] Request volume by endpoint
- [ ] Error rate trends

## Documentation

- [ ] API documentation updated
- [ ] Migration guide published
- [ ] Runbook procedures documented
- [ ] Troubleshooting guide available
- [ ] Contact information for support

## Testing

### Unit Tests
- [ ] All endpoint handlers tested
- [ ] Error scenarios covered
- [ ] Edge cases validated

### Integration Tests
- [ ] End-to-end workflow tested
- [ ] External dependencies mocked
- [ ] Performance benchmarks met

### User Acceptance Tests
- [ ] Client teams validate migration
- [ ] Performance requirements met
- [ ] User experience validated
