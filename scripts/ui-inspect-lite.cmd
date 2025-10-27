@echo off
set UI=http://127.0.0.1:3003
set OUT=evidence\ui\login-lite
mkdir "%OUT%" 2>nul

curl -s %UI%/api/public/health > "%OUT%\health.json"
powershell -NoP -C "(Invoke-WebRequest '%UI%/login').Content" > "%OUT%\login.html"
powershell -NoP -C "(Invoke-WebRequest '%UI%/').Content"     > "%OUT%\root.html"
curl -s -X POST %UI%/api/public/auth/demo-login -H "content-type: application/json" -d "{\"role\":\"admin\"}" > "%OUT%\demo_login.json"
curl -s %UI%/api/public/canary/status > "%OUT%\canary.json"

(
  echo [ASSERT] login html length > 200
  for /f %%L in ('powershell -NoP -C "(Get-Content ''%OUT%\login.html'').Length"') do echo LOGIN_LEN=%%L
  echo [ASSERT] root html length > 200
  for /f %%L in ('powershell -NoP -C "(Get-Content ''%OUT%\root.html'').Length"') do echo ROOT_LEN=%%L
  echo [ASSERT] canary ok:true
  findstr /i "\"ok\": *true" "%OUT%\canary.json"
) > "%OUT%\asserts.txt" 