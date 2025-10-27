# Boot Runner - Early Crash Visibility

## How to Run

```bash
# Environment setup
Get-Content ops\staging.env | ForEach-Object { if ($_ -notmatch '^\s*(#|$)') { $n,$v = $_ -split '=',2; [Environment]::SetEnvironmentVariable($n,$v,'Process') } }
$env:HOST = "0.0.0.0"
$env:PORT = "4001"
$env:LOG_LEVEL = "debug"
$env:NODE_OPTIONS = "--trace-uncaught --trace-warnings --report-uncaught-exception --report-on-fatalerror --report-directory=.dev --report-filename=executor-diag.json"

# Kill any existing processes on port 4001
netstat -ano | findstr :4001 | ForEach-Object { ($_ -split '\s+')[-1] } | ForEach-Object { if ($_ -match '^\d+$') { taskkill /PID $_ /F } }

# Run with boot runner (foreground)
cd services/executor
pnpm dlx tsx src/boot.ts
```

## Collecting Crash Evidence

If the service fails to start, check:

1. **Console stderr output** - Look for `[BOOT]` prefixed error messages
2. **Diagnostic report** - Check `.dev/executor-diag.json` for Node.js crash reports
3. **Process list** - Verify no processes are listening on port 4001

## Expected Success Output

```
[BOOT] env { HOST: '0.0.0.0', PORT: 4001, NODE_ENV: 'development' }
server.listened {"address":"0.0.0.0","family":"IPv4","port":4001}
```

## Verification Commands

```powershell
# Check if port is listening
Get-NetTCPConnection -LocalPort 4001 -State Listen | Format-Table -Auto LocalAddress,LocalPort,OwningProcess

# Test health endpoint
Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -TimeoutSec 3

# Test metrics endpoint
(Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -TimeoutSec 3).Content | Select-String "ai_payload_|ai_chunk_|sse_retry_"
```

## Common Root Causes

1. **ESM/CJS mismatch** - Check for prom-client or other module compatibility issues
2. **Workspace path/alias** - Verify @spark/* imports are correctly resolved
3. **Environment issues** - Check if Zod/config parsing fails at import time
4. **Wrong CWD** - Ensure running from correct directory (services/executor)
