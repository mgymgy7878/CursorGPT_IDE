# Incident Response Runbook

## Quick Reference

### Critical Alerts
- **RunnerMetricsDown**: Executor metrics endpoint down
- **RunnerPredictiveBreachSoon**: Predictive breach incoming
- **RunnerConfidenceDrops**: Confidence score below threshold

### Response Steps
1. **Immediate**: Check executor service status
2. **Investigate**: Review metrics endpoint and logs
3. **Escalate**: Contact platform team if unresolved
4. **Document**: Update incident log

### Escalation Contacts
- **Platform Team**: platform-team@spark.com
- **On-Call**: +1-XXX-XXX-XXXX
- **Slack**: #platform-alerts

### Recovery Procedures
- Restart executor service
- Reload Prometheus configuration
- Validate metrics endpoint
- Run GREEN validation
