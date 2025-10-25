# Troubleshooting Guide

**Platform:** Spark Trading  
**Last Updated:** 2025-10-25

---

## Quick Diagnostics

### Port Conflicts

**Symptoms:** "Port already in use" errors

**Check:**
```powershell
Get-NetTCPConnection -LocalPort 3003,4001 -ErrorAction SilentlyContinue
```

**Fix:**
```powershell
# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 3003).OwningProcess

# Kill process (if safe)
Stop-Process -Id <PID>

# OR use different port
pnpm -F web-next dev -- --port 3004
```

---

## Development Servers

### Next.js Not Starting (Port 3003)

**Common Causes:**
1. Port in use
2. .env.local misconfigured
3. Node modules outdated

**Solution:**
```bash
cd apps/web-next

# 1. Check port
Get-NetTCPConnection -LocalPort 3003

# 2. Verify environment
cat .env.local  # Should match .env.example

# 3. Clean install
pnpm clean
pnpm install --frozen-lockfile

# 4. Restart
pnpm dev
```

### WebSocket Server Not Starting (Port 4001)

**Symptoms:** WS status dot stays red

**Solution:**
```bash
cd apps/web-next

# Check if running
Get-NetTCPConnection -LocalPort 4001

# Start dev WS server
pnpm ws:dev

# Verify
# Should see: [dev-ws] listening on ws://127.0.0.1:4001
```

**Note:** WS server is optional for mock mode. Real backend uses different port.

---

## TypeScript Errors

### Build Fails with Type Errors

**Symptoms:** `pnpm build` fails with TypeScript errors

**Diagnosis:**
```bash
cd apps/web-next
pnpm typecheck

# Save for comparison
pnpm typecheck 2>&1 > ../../evidence/ui/types-current.txt
```

**Solutions:**

**1. Quick Fix (Development):**
```bash
# Use development mode (skips type check)
pnpm dev  # No type checking
```

**2. Proper Fix (Follow Issue #11):**
```bash
# See KICKOFF_GUIDE.md for complete fix
# Use centralized types from types/chart.ts
# Apply Zod schemas from schema/api.ts
```

**3. Rollback Recent Changes:**
```bash
git log --oneline -5
git revert <commit-sha>
git push
```

### Recharts Type Conflicts

**Error:** "JSX element class does not support attributes"

**Cause:** Recharts component type mismatch

**Fix:**
```typescript
// Add @ts-ignore with explanation
{/* @ts-ignore - ReferenceLine type issue with recharts */}
<ReferenceLine y={threshold} stroke="#ef4444" />

// OR use centralized types
import type { ChartPoint } from '@/types/chart';
const data: ChartPoint[] = transformedData;
```

---

## CI/CD Issues

### Guard Validate Failing

**Symptoms:** PR blocked by Guard Validate check

**Diagnosis:**
```powershell
# Run locally
.\.github\scripts\validate-workflow-guards.ps1

# Check output
cat evidence/ci/WORKFLOW_GUARDS_EVIDENCE.md
```

**Common Causes:**
1. New workflow using secrets without fork guard
2. Modified existing guard pattern
3. Script syntax error

**Fix:**
```yaml
# Add fork guard to secret-using steps
- name: Step with secret
  if: ${{ !github.event.pull_request.head.repo.fork }}
  env:
    SECRET: ${{ secrets.MY_SECRET || '' }}
```

### UX-ACK Gate Failing

**Symptoms:** PR blocked by ux_ack check

**Fix:** Add to PR description:
```markdown
## UX-ACK

UX-ACK: ✅ I reviewed the changes; [brief description]; no runtime impact.
```

### UI Smoke Test Slow or Flaky

**Symptoms:** Test takes >90s or fails intermittently

**Diagnosis:**
```bash
cd apps/web-next
pnpm test -- --reporter=verbose

# Check endpoint response times
curl -w "@curl-format.txt" http://127.0.0.1:3003/api/public/engine-health
```

**Solutions:**

**1. Reduce Test Timeout:**
```typescript
// tests/health.smoke.ts
const timeout = 3000; // Reduce from 5000
```

**2. Add Retry Logic (CI):**
```yaml
# .github/workflows/ui-smoke.yml
- name: Run smoke tests
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: pnpm -F web-next test:smoke
```

---

## Backend Integration

### Status Dots Not Green

**Symptoms:** API/WS/Engine dots showing red or yellow

**Diagnosis:**

**1. Check Mock Mode (Default):**
```bash
# Should work without backend
cd apps/web-next
cat .env.local  # Should have no ENGINE_URL/PROMETHEUS_URL
pnpm dev

# Expected: API ✅, WS ⚠️, Engine ✅ (mock)
```

**2. Check Real Backend Mode:**
```bash
# Verify backend services running
curl http://127.0.0.1:3001/health       # Engine
curl http://localhost:9090/-/healthy    # Prometheus

# Check WS connection
# Should have executor running on 4001

# Verify .env.local
cat apps/web-next/.env.local
# Should have:
# ENGINE_URL=http://127.0.0.1:3001
# PROMETHEUS_URL=http://localhost:9090
```

**3. Mixed Mode (Hybrid):**
- Set only ENGINE_URL → API/Engine real, WS mock
- Set only PROMETHEUS_URL → API real, Engine/WS mock

### Double WebSocket Connection

**Symptoms:** Slow WS status updates, connection warnings

**Cause:** Both dev-ws and real backend running on 4001

**Fix:**
```bash
# Stop dev-ws when using real backend
# (Find process and kill)
Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.MainWindowTitle -like "*dev-ws*" } | Stop-Process

# OR change dev-ws port
# Edit apps/web-next/scripts/dev-ws.ts: port = 4002
```

---

## Rollback Procedures

### Rollback Single Commit

**Scenario:** Recent change broke something

**Steps:**
```bash
# 1. Find commit
git log --oneline -10

# 2. Revert (creates new commit)
git revert <commit-sha>

# 3. Push
git push

# 4. Verify
pnpm -F web-next typecheck
pnpm -F web-next build
```

### Rollback PR (Already Merged)

**Scenario:** Merged PR causing issues

**Steps:**
```bash
# 1. Find merge commit
git log --oneline --merges -5

# 2. Revert merge
git revert -m 1 <merge-commit-sha>

# 3. Explain in commit
git commit --amend
# Add: "Revert PR #X due to [reason]. See issue #Y."

# 4. Push
git push

# 5. Create issue for proper fix
gh issue create --title "Fix regression from PR #X"
```

### Emergency: Direct Push to Main

**⚠️ Use only in production emergency**

```bash
# 1. Get admin bypass (if needed)
# Contact repo owner for temporary bypass

# 2. Make minimal fix
git checkout main
git pull
# ... make fix ...
git commit -m "hotfix: [critical issue]"

# 3. Push with admin
git push

# 4. Document
gh issue create --title "Hotfix: [what was fixed]" --label "hotfix"

# 5. Re-enable protection
# Restore branch protection rules ASAP
```

---

## Performance Issues

### Build Time Excessive (>5 min)

**Diagnosis:**
```bash
cd apps/web-next
time pnpm build  # Measure

# Check cache
du -sh .next/cache
```

**Solutions:**
```bash
# 1. Clear cache
rm -rf .next

# 2. Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# 3. Check dependencies
pnpm outdated
```

### Type Checking Slow (>30s)

**Solutions:**
```bash
# 1. Use incremental mode (already default)
# 2. Skip lib check
# tsconfig.json: "skipLibCheck": true  # (already set)

# 3. Exclude unnecessary files
# tsconfig.json: "exclude": ["node_modules", ".next"]
```

---

## Security Issues

### Secrets Exposed in Fork PR

**Symptoms:** GitHub Actions trying to use secrets in fork PR

**Expected Behavior:** Should be blocked by fork guard

**Verification:**
```powershell
.\.github\scripts\validate-workflow-guards.ps1
```

**If guard missing:**
```yaml
# Add to workflow step
if: ${{ !github.event.pull_request.head.repo.fork }}
```

### Weekly Audit Failing

**Symptoms:** Guard audit creates issue every Monday

**Diagnosis:**
```powershell
# Run audit manually
gh workflow run guard-audit.yml

# Check run logs
gh run list --workflow=guard-audit.yml --limit 1
gh run view <run-id>
```

**Common Causes:**
1. New workflow without guards
2. Modified guard pattern
3. Validator script outdated

**Fix:** See "Guard Validate Failing" above

---

## Database/State Issues

*(Reserved for future backend integration)*

---

## Getting Help

### Internal Resources

1. **Documentation:**
   - KICKOFF_GUIDE.md — Development guide
   - NEXT_SPRINT_PLAN.md — Sprint planning
   - README.md — Quick start

2. **Evidence:**
   - evidence/ci/ — CI logs
   - evidence/ui/ — UI test results
   - evidence/validation/ — Platform health

3. **Scripts:**
   - scripts/30min-validation.ps1 — Health check
   - scripts/type-delta.ts — TypeScript progress
   - .github/scripts/validate-workflow-guards.ps1 — Security

### External Resources

1. **Next.js:** https://nextjs.org/docs
2. **Recharts:** https://recharts.org/en-US/api
3. **Zod:** https://zod.dev
4. **GitHub Actions:** https://docs.github.com/actions

---

## Common Error Messages

### "Cannot find module '@/types/chart'"

**Solution:**
```bash
# Verify tsconfig paths
cat apps/web-next/tsconfig.json | grep -A 5 '"@/*"'

# Should show:
# "@/*": ["./src/*"]

# Restart dev server
pnpm dev
```

### "Module not found: Can't resolve 'zod'"

**Solution:**
```bash
cd apps/web-next
pnpm add zod
```

### "Context access might be invalid"

**Note:** This is a VS Code false positive. See `.github/WORKFLOW_CONTEXT_WARNINGS.md`

**Solution:** Ignore or disable in `.vscode/settings.json`:
```json
{
  "github-actions.workflows.validateContext": false
}
```

---

*Last Updated: 2025-10-25*  
*For issues not covered here, create GitHub issue with label `question`*
