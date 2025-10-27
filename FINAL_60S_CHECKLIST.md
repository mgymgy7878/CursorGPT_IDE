# FINAL 60S PRE-FLIGHT CHECKLIST

**chatgpt GO confirmed** ✅  
**Ultra-short go-kit**

---

## ⚡ 60-SECOND CHECKS

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

```powershell
docker info | Select-String "CPU|Memory"
```

### 4. Ports Free (3003/4001/9090/3005)
```powershell
netstat -ano | findstr ":3003 :4001 :9090 :3005"
# Empty = GO ✅
```

**Quick cleanup**:
```cmd
for %p in (3003 4001 9090 3005) do for /f "tokens=5" %P in ('netstat -ano ^| findstr ":%p " ^| findstr LISTENING') do taskkill /PID %P /F
```

### 5. .env Secrets
- [ ] No trailing spaces in API keys
- [ ] Read-only permissions only
- [ ] No quotes around values

---

## 🚀 EXECUTE (3 Steps)

```powershell
cd C:\dev\CursorGPT_IDE
.\scripts\quick-start-portfolio.ps1
Start-Sleep 300
.\scripts\canary-validation.ps1
```

---

## 🚨 ONE-LINER FIXES

**Port cleanup**:
```cmd
for %p in (3003 4001 9090 3005) do for /f "tokens=5" %P in ('netstat -ano ^| findstr ":%p " ^| findstr LISTENING') do taskkill /PID %P /F
```

**Node modules**:
```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item .turbo -Recurse -Force
pnpm install
```

---

## 📧 SMOKE PASS FORMAT

```
SMOKE PASS ✅
- Accounts: {X} (binance, btcturk)
- Total USD: ${Y}
- p95: {Z} ms, stale: {S} s, error: {E}/s
- Uptime: {M} min
```

**chatgpt will ship**:
- Panel tooltips
- Global annotations
- Today vs Yesterday
- Alert timeline

---

**FULL SEND** 🚀

