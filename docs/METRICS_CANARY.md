# Desktop AU Smoke (beta channel)

Ortam: `SPARK_UPDATE_CHANNEL=beta`

Beklenen: App başlar → AU "checking-for-update / update-not-available" logları → `%LOCALAPPDATA%\Spark\logs\app-YYYYMMDD.log`

Sunucu: `latest.yml` 200 OK, `Content-Type: text/yaml`, `Cache-Control: no-cache`

## RUN

1) NGINX konfigini etkinleştir (örnek)

```
# http{} içine include ediniz
include config/nginx/snippets/spark-desktop-latest.conf;
```

2) Desktop build+dist

```
pnpm -w --filter desktop-electron build
pnpm -w --filter desktop-electron dist:win
```

3) İmzayı doğrula (lokalde)

```
$exe = Get-ChildItem .\apps\desktop-electron\dist\*.exe | Sort-Object LastWriteTime -Desc | Select-Object -First 1 -Expand FullName
powershell -ExecutionPolicy Bypass -File .\apps\desktop-electron\scripts\verify_signature.ps1 -File $exe
```

4) Yayın: artefaktlar + latest.yml + blockmap’ler → `/desktop/${channel}/` (CI SCP ile yükler)

5) AU SMOKE (beta)

```
$log = "$env:LOCALAPPDATA\Spark\logs\app-$(Get-Date -Format yyyyMMdd).log"
Get-Content $log -Tail 200
```

## EXPECT

- NGINX: `curl -I https://<host>/desktop/beta/latest.yml` → `HTTP/200`, `Content-Type: text/yaml`, `Cache-Control: no-cache`
- App log: `Checking for update` → `Update not available` (veya yeni sürümde download akışı)


