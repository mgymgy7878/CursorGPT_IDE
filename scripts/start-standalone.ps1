param([int]$Port=3004)
try { npx -y kill-port $Port 3000 | Out-Null } catch {}
$env:PORT = "$Port"
$env:HOSTNAME = "127.0.0.1"
node "apps/web-next/.next/standalone/server.js"


