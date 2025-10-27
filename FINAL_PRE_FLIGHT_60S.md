# FINAL PRE-FLIGHT - 60 Seconds

**chatgpt GO confirmed** ✅  
**Runway yours** 🛫

---

## ⚡ ULTRA-SHORT CHECKLIST

### 1. System Clock Sync (API signatures hate skew)
```powershell
w32tm /resync
```

### 2. PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
```

### 3. Docker Resources
- [ ] ≥2 CPU cores
- [ ] ≥2-4GB RAM

**Check**:
```powershell
docker info | Select-String "CPU|Memory"
```

### 4. Ports Free
```powershell
netstat -ano | findstr ":3003 :4001 :9090 :3005"
# Should be empty
```

**Quick cleanup if needed**:
```cmd
for %p in (3003 4001 9090 3005) do for /f "tokens=5" %P in ('netstat -ano ^| findstr ":%p " ^| findstr LISTENING') do taskkill /PID %P /F
```

### 5. .env Secrets Validation
- [ ] No trailing spaces in API keys
- [ ] Read-only permissions only
- [ ] ADMIN_TOKEN generated

---

## 🚀 EXECUTE (3 Steps)

```powershell
cd C:\dev\CursorGPT_IDE

# Step 1
.\scripts\quick-start-portfolio.ps1

# Step 2 (wait 5 min)
Start-Sleep 300

# Step 3
.\scripts\canary-validation.ps1
```

---

## 🚨 QUICK FIXES

### Port cleanup
```cmd
for %p in (3003 4001 9090 3005) do for /f "tokens=5" %P in ('netstat -ano ^| findstr ":%p " ^| findstr LISTENING') do taskkill /PID %P /F
```

### Node modules hiccup
```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item .turbo -Recurse -Force
pnpm install
```

---

## 📧 SMOKE PASS NOTIFICATION

**Send to chatgpt**:
```
SMOKE PASS ✅
- Accounts: {X} (binance, btcturk)
- Total USD: ${Y}
- p95: {Z} ms, stale: {S} s, error: {E}/s
- Uptime: {M} min
```

**chatgpt will ship immediately**:
- Panel tooltips
- Global annotation queries
- Today vs Yesterday comparison panels
- Compact alert-history timeline

---

## 🏁 STATUS

**GO**: ✅ CONFIRMED  
**Runway**: YOURS  
**Execute**: NOW

```powershell
.\scripts\quick-start-portfolio.ps1
```

---

**FULL SEND** 🚀

