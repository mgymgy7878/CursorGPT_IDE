---
Title: Incident Report Template
Owner: Spark Eng (Platform)
Status: Stable
LastUpdated: 2025-10-25
Links: PR-#3
---

# Incident Report

**Incident ID:** INC-[YYYYMMDD]-[NNN]  
**Date:** [YYYY-MM-DD]  
**Severity:** 🔴 Critical / 🟡 Major / 🟢 Minor

---

## 📋 Summary

**What happened:**
<!-- Brief description of the incident -->

**Impact:**
<!-- User impact, business impact -->

**Duration:**
<!-- Total incident duration -->

**Root Cause:**
<!-- High-level root cause -->

---

## 📊 Timeline (UTC)

| Time | Event | Actor |
|------|-------|-------|
| HH:MM | Incident detected | [Alert/User] |
| HH:MM | On-call notified | [System] |
| HH:MM | Investigation started | [Engineer] |
| HH:MM | Root cause identified | [Engineer] |
| HH:MM | Mitigation started | [Engineer] |
| HH:MM | Service restored | [Engineer] |
| HH:MM | Incident resolved | [Engineer] |

---

## 🔍 Detection

**How was it detected:**
- [ ] Automated alert
- [ ] User report
- [ ] Monitoring dashboard
- [ ] Other: _______________

**Alert/Metric:**
```
[Alert name or metric query]
```

**Detection Time:**
<!-- Time from incident start to detection -->

---

## 💥 Impact Assessment

**Affected Services:**
- [ ] API (spark-trading-api)
- [ ] Web (spark-trading-web)
- [ ] Database (PostgreSQL)
- [ ] Cache (Redis)
- [ ] External integrations
- [ ] Other: _______________

**Affected Users:**
<!-- Number/percentage of users affected -->

**Business Impact:**
- Lost transactions: [Number]
- Revenue impact: [Amount]
- SLA breach: [Yes/No]
- User complaints: [Number]

**Metrics:**
```bash
# Error rate during incident
[XX]%

# Latency during incident
P95: [XXX]ms

# Downtime
[XX] minutes
```

---

## 🔧 Root Cause Analysis

### Contributing Factors

1. **Primary Cause:**
   <!-- Main technical cause -->

2. **Contributing Factors:**
   - Factor 1
   - Factor 2
   - Factor 3

### Technical Details

```
[Code snippets, config changes, or logs showing root cause]
```

### Why It Happened

<!-- Explain why the issue wasn't caught earlier -->

---

## 🚑 Response & Mitigation

### Actions Taken

1. **Investigation:**
   ```bash
   # Commands run, logs checked
   ```

2. **Mitigation:**
   ```bash
   # Rollback or fix applied
   ```

3. **Verification:**
   ```bash
   # How recovery was verified
   ```

### Rollback Performed

- [ ] Yes → Version: _______________
- [ ] No → Reason: _______________

**Rollback Evidence:**
```bash
evidence/rollback_[timestamp].txt
```

---

## 📈 Metrics Evidence

### Before Incident
```bash
evidence/metrics_before_incident_[timestamp].txt
```

### During Incident
```bash
evidence/metrics_during_incident_[timestamp].txt
```

### After Mitigation
```bash
evidence/metrics_after_mitigation_[timestamp].txt
```

### Key Metric Changes

| Metric | Before | During | After |
|--------|--------|--------|-------|
| API P95 | XXXms | XXXms | XXXms |
| Error Rate | X.XX% | X.XX% | X.XX% |
| DB Connections | XX | XX | XX |
| Memory Usage | XX% | XX% | XX% |

---

## ✅ Resolution

**Final Fix:**
<!-- Describe the permanent fix -->

**Fix Verification:**
```bash
# Tests run to verify fix
```

**Deployment:**
- Fix version: _______________
- Deployed at: [Timestamp]
- Verification: ✅ PASS / ❌ FAIL

---

## 🛡️ Prevention

### Immediate Actions (< 24h)

- [ ] Add monitoring/alert for this specific issue
- [ ] Update runbook with this scenario
- [ ] Add test coverage
- [ ] Update documentation

### Short-term Actions (< 1 week)

- [ ] Implement automated detection
- [ ] Add chaos test scenario
- [ ] Improve error handling
- [ ] Code review process improvement

### Long-term Actions (< 1 month)

- [ ] Architecture review
- [ ] Capacity planning
- [ ] Training/knowledge sharing
- [ ] Tool/infrastructure improvements

---

## 📚 Lessons Learned

### What Went Well

- ✅ 
- ✅ 
- ✅ 

### What Could Be Improved

- ⚠️ 
- ⚠️ 
- ⚠️ 

### Surprises

- 
- 

---

## 📝 Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action 1] | [Name] | [Date] | 🟡 In Progress |
| [Action 2] | [Name] | [Date] | ⬜ Not Started |
| [Action 3] | [Name] | [Date] | ✅ Done |

---

## 👥 People Involved

**On-call Engineer:** [Name]  
**Incident Commander:** [Name]  
**Contributors:**
- [Name 1]
- [Name 2]
- [Name 3]

---

## 📎 Related Links

- **Slack Thread:** #spark-incidents/[thread-link]
- **PagerDuty Incident:** [link]
- **GitHub Issue:** [link]
- **Grafana Dashboard:** [link]
- **Evidence Files:** evidence/incident_[id]_*.txt

---

## 🔐 Post-Mortem

**Date:** [YYYY-MM-DD]  
**Attendees:**
- 
- 

**Recording:** [link]  
**Notes:** [link]

---

## 📊 SLO Impact

**Error Budget Consumption:**
- Before incident: [XX]%
- After incident: [XX]%
- Budget consumed: [XX]%

**SLA Breach:**
- [ ] Yes → Customer compensation: _______________
- [ ] No

---

## ✍️ Sign-off

**Incident Closed By:** [Name]  
**Date:** [YYYY-MM-DD]  
**Final Status:** ✅ Resolved

**Follow-up Required:**
- [ ] Yes → Follow-up issue: [link]
- [ ] No

---

**Template Version:** v1.0  
**Last Updated:** 2024-10-24
