# Instant Fix — One Command Recovery

**Problem:** Internal Server Error at http://127.0.0.1:3003  
**Solution:** One PowerShell command

---

## ⚡ Instant Fix (Copy-Paste)

```powershell
# Stop all, clean .env.local, clear cache, ready to restart
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Set-Location apps/web-next; @'
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_GUARD_VALIDATE_URL=https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml
'@ | Out-File .env.local -Encoding utf8 -Force; If (Test-Path .next) { Remove-Item .next -Recurse -Force }; Write-Host "✅ Reset complete! Now run:" -ForegroundColor Green; Write-Host "  Terminal 1: pnpm ws:dev" -ForegroundColor Cyan; Write-Host "  Terminal 2: pnpm dev" -ForegroundColor Cyan
```

**Then start servers:**
```powershell
# Terminal 1
pnpm ws:dev

# Terminal 2  
pnpm dev
```

**Verify:** http://127.0.0.1:3003/dashboard

---

## 🔍 Quick Checks

### Endpoints (should return JSON)
```powershell
curl http://127.0.0.1:3003/api/public/engine-health
curl http://127.0.0.1:3003/api/public/error-budget
```

**Expected:** `{ "status": "OK", "source": "mock", ... }`

### Status Bar
- API: ✅ (mock)
- WS: ✅ (if ws:dev running)
- Engine: ✅ (mock)

---

## 📋 Checklist

- [ ] `.env.local` has NO `ENGINE_URL` or `PROMETHEUS_URL`
- [ ] `.next` cache cleared
- [ ] `/api/public/*` returns JSON
- [ ] `ws:dev` running on port 4001
- [ ] Dashboard loads without 500 error

---

## 🔧 If Still Failing

### Check Dev Terminal Output
```powershell
# Watch for errors
Get-Content evidence\ui\web-next-dev.log -Tail 50 -Wait
```

**Common errors:**
- "Cannot find module" → Restart dev server
- "Address in use" → Port conflict (see Instant Fix above)
- "Unexpected token" → Check recent file changes

### Verify .env.local
```powershell
cat apps/web-next/.env.local
```

**Should contain ONLY these 3 lines:**
- `NEXT_PUBLIC_API_URL=...`
- `NEXT_PUBLIC_WS_URL=...`
- `NEXT_PUBLIC_GUARD_VALIDATE_URL=...`

**Should NOT contain:**
- `ENGINE_URL=...` ❌
- `PROMETHEUS_URL=...` ❌

---

## 🚀 Enable Real Backend (When Ready)

**Only when backend services are running:**

```powershell
# Add to .env.local (don't replace, just add)
@'

# Real Backend Integration
ENGINE_URL=http://127.0.0.1:3001
PROMETHEUS_URL=http://localhost:9090
'@ | Add-Content apps/web-next/.env.local

# Restart dev
pnpm dev
```

**Verify real mode:**
```powershell
curl http://127.0.0.1:3003/api/public/engine-health
# Should return: "source": "real" (not "mock")
```

---

## 📝 Notes

### Electron js-yaml Error
- **Not related** to web-next
- Separate desktop app issue
- See `TROUBLESHOOTING.md` → "Electron Desktop App Issues"

### Mock vs Real Mode
**Mock (default):**
- No backend needed
- Fast development
- All status dots green

**Real (when configured):**
- Backend services required (ports 3001, 4001, 9090)
- Tests actual integration
- More debugging needed

---

## 🆘 Alternative Methods

### Method 1: Automated Script
```powershell
.\scripts\reset-to-mock.ps1
```

### Method 2: Manual Steps
See `ISSUE_500_RECOVERY.md`

### Method 3: Full Troubleshooting
See `TROUBLESHOOTING.md` → "Internal Server Error (500)"

---

**✅ Instant fix restores mock mode in 10 seconds** 🚀

*Most common cause: .env.local + cache. One command fixes both.*

