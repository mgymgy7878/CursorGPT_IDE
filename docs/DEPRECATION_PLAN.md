# Deprecation Plan for Fusion Gate Root Alias Routes

## Current State (v1.3.4-p4)

- **Prefixed routes**: `/api/public/fusion/risk.gate/status`, `/api/public/fusion/risk.gate/apply` ✅
- **Root alias routes**: `/risk.gate/status`, `/risk.gate/apply` ✅ (compatibility)
- **Status**: Both sets return 200 OK, root alias is temporary compatibility layer

## Deprecation Timeline

### Phase 1: v1.3.5 Release (Next Minor Version)

**Actions:**
- Add `Deprecation: true` HTTP header to all root alias responses
- Add `Link: <https://docs.your-domain.com/fusion-gate-migration>; rel="deprecation"; type="text/html"` header
- Log warning message for each request to `/risk.gate/*` endpoints
- Update all internal clients (web-next, services) to use prefixed URIs
- Update Nginx/web proxy configurations to target prefixed endpoints

**Client Migration Checklist:**
- [ ] web-next service API calls → prefixed URIs
- [ ] Internal service calls → prefixed URIs  
- [ ] Nginx upstream definitions → prefixed endpoints
- [ ] Load balancer configurations → prefixed endpoints
- [ ] Monitoring/alerting → prefixed endpoints

### Phase 2: v1.4 Release (Major Version)

**Actions:**
- Remove root alias routes (`/risk.gate/*`) from spark-executor service
- Return `410 Gone` status code with migration message
- Add redirect header to prefixed endpoint (if feasible and safe)

**Expected Behavior:**
- Requests to `/risk.gate/*` → `410 Gone` + migration message
- Prefixed routes continue to work normally
- All clients must be migrated before this phase

## Migration Steps for Clients

### 1. Identify Current Usage
```bash
# Find all calls to root alias routes
grep -r "risk\.gate" src/
grep -r "/risk\.gate" nginx/
grep -r "risk\.gate" config/
```

### 2. Update API Calls
```javascript
// Before (deprecated)
const response = await fetch('/risk.gate/status');

// After (prefixed)
const response = await fetch('/api/public/fusion/risk.gate/status');
```

### 3. Update Nginx Configuration
```nginx
# Before (deprecated)
location /risk.gate/ {
    proxy_pass http://executor:4001/risk.gate/;
}

# After (prefixed)
location /api/public/fusion/risk.gate/ {
    proxy_pass http://executor:4001/api/public/fusion/risk.gate/;
}
```

### 4. Update Monitoring
```yaml
# Before (deprecated)
- name: "Fusion Gate Status"
  url: "http://executor:4001/risk.gate/status"

# After (prefixed)
- name: "Fusion Gate Status"
  url: "http://executor:4001/api/public/fusion/risk.gate/status"
```

## Rollback Plan

If issues arise during migration:

1. **v1.3.5**: Revert to v1.3.4-p4 (root alias still available)
2. **v1.4**: Hotfix to re-enable root alias temporarily
3. **Communication**: Notify all clients of extended deprecation timeline

## Success Criteria

- [ ] All internal clients migrated to prefixed URIs
- [ ] Nginx/proxy configurations updated
- [ ] Monitoring/alerting updated
- [ ] No traffic to root alias routes for 48 hours
- [ ] All tests passing with prefixed endpoints

## Communication Plan

1. **v1.3.5 Release**: Announce deprecation in release notes
2. **Migration Period**: Send notifications to all client teams
3. **v1.4 Release**: Final notice before removal
4. **Post-removal**: Support for migration issues

## Rationale

- **API Consistency**: Enforces clear and consistent API contract
- **Reduced Ambiguity**: Eliminates potential routing conflicts
- **Best Practices**: Aligns with API versioning and management standards
- **Maintenance**: Reduces code complexity and maintenance burden