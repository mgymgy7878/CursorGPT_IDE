# Internal Server Error (500) — Quick Recovery

**Problem:** http://127.0.0.1:3003 shows "Internal Server Error"  
**Cause:** Backend URL configured but backend not running  
**Fix Time:** 2 minutes

---

## 🚑 Emergency Fix (Automated)

```powershell
# One command to reset everything
.\scripts\reset-to-mock.ps1
```

**Then start servers:**
```bash
# Terminal 1
pnpm -F web-next ws:dev

# Terminal 2
pnpm -F web-next dev
```

**Verify:** http://127.0.0.1:3003/dashboard

---

## 🔧 Manual Fix (If Script Fails)

### 1. Stop Servers
Press `Ctrl+C` in terminals running dev servers

### 2. Clean .env.local

**File:** `apps/web-next/.env.local`

**Remove these lines:**
```bash
ENGINE_URL=...
PROMETHEUS_URL=...
```

**Keep only:**
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
```

### 3. Clear Cache

```powershell
cd apps/web-next
Remove-Item .next -Recurse -Force
pnpm install
```

### 4. Restart

```bash
pnpm dev
```

---

## ✅ Verification

### Test Endpoints

**Engine Health:**
```bash
curl http://127.0.0.1:3003/api/public/engine-health
```
**Expected:**
```json
{
  "status": "OK",
  "running": true,
  "updatedAt": "2025-10-25T...",
  "source": "mock"
}
```

**Error Budget:**
```bash
curl http://127.0.0.1:3003/api/public/error-budget
```
**Expected:**
```json
{
  "status": "OK",
  "errorBudget": 0.98,
  "updatedAt": "2025-10-25T...",
  "source": "mock"
}
```

### Dashboard

**Open:** http://127.0.0.1:3003/dashboard

**Expected Status Bar:**
- API: ✅ (green)
- WS: ✅ (green if ws:dev running, yellow if not)
- Engine: ✅ (green)

---

## 🔍 Still Failing?

### Check Dev Server Output

Look for first error in terminal:

**Common Issues:**

**1. Module Not Found**
```
Error: Cannot find module '@/types/chart'
```
**Fix:** Restart dev server (tsconfig paths issue)

**2. Syntax Error**
```
SyntaxError: Unexpected token
```
**Fix:** Check recent file changes, revert if needed

**3. Port in Use**
```
Error: listen EADDRINUSE: address already in use :::3003
```
**Fix:**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3003).OwningProcess | Stop-Process
```

### Check .env.local

```powershell
cat apps/web-next/.env.local
```

**Must NOT contain:**
- `ENGINE_URL=`
- `PROMETHEUS_URL=`

### Check Browser Console

Press F12, check Console tab for errors:

**Common:**
- "Failed to fetch" → API route failing
- "Hydration error" → SSR/client mismatch
- Module errors → Build issue

---

## 🚀 Enable Real Backend (Later)

**Only when you have backend running:**

### 1. Start Backend Services

```bash
# Strategy Engine (port 3001)
pnpm -F @spark/engine dev

# WebSocket Server (port 4001)
pnpm -F @spark/executor dev

# Prometheus (port 9090) — optional
docker run -p 9090:9090 prom/prometheus
```

### 2. Update .env.local

**Add these lines:**
```bash
ENGINE_URL=http://127.0.0.1:3001
PROMETHEUS_URL=http://localhost:9090
```

### 3. Restart UI

```bash
pnpm -F web-next dev
```

### 4. Verify Real Mode

**Test endpoints:**
```bash
curl http://127.0.0.1:3003/api/public/engine-health
# Should return: "source": "real" (not "mock")
```

**Status bar should show:**
- All green dots
- Real data from backend

---

## 📝 Prevention

### For Development (Mock Mode)

**Never set in .env.local:**
- `ENGINE_URL`
- `PROMETHEUS_URL`

**Backend integration only when:**
1. Backend services are running
2. You specifically want to test real data
3. You're ready to debug backend issues

### For Production

Use environment-specific configs:
- `.env.local` — local development (git-ignored)
- `.env.production` — production settings
- Never commit `.env.local`

---

## 🆘 Quick Commands

```powershell
# Reset to mock mode
.\scripts\reset-to-mock.ps1

# Check what's running
Get-NetTCPConnection -LocalPort 3003,4001

# Kill port 3003
Get-Process -Id (Get-NetTCPConnection -LocalPort 3003).OwningProcess | Stop-Process

# Verify .env
cat apps/web-next/.env.local

# Clear cache
cd apps/web-next; Remove-Item .next -Recurse -Force

# Full restart
pnpm install
pnpm dev
```

---

**✅ After fix: Status bar should be all green (mock mode)**

*Most 500 errors: .env.local + cache issue. Script fixes both.* 🚀

