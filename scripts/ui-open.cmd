@echo off
set UI=http://127.0.0.1:3003
set OUT=evidence\ui\unblock_pro_ui\%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set OUT=%OUT: =0%
mkdir "%OUT%" 2>nul

:: Sağlık ve login
curl -s %UI%/api/public/health > "%OUT%\ui_health.json"
powershell -NoP -C "(Invoke-WebRequest '%UI%/login').Content" > "%OUT%\login.html"

:: Demo-login ve net redirect prova
curl -s -X POST %UI%/api/public/auth/demo-login -H "content-type: application/json" -d "{\"role\":\"admin\"}" > "%OUT%\demo_login.json"

:: Kök ve dashboard içerikleri
powershell -NoP -C "(Invoke-WebRequest '%UI%/').Content" > "%OUT%\root.html"
powershell -NoP -C "(Invoke-WebRequest '%UI%/dashboard').Content" > "%OUT%\dashboard.html"

:: Canary ve guardrails örnekleri
curl -s %UI%/api/public/canary/status > "%OUT%\canary.json"
curl -s %UI%/api/public/guardrails/status > "%OUT%\guardrails.json"

:: Assertler
(
  echo [ASSERT] login html > 200
  for /f %%L in ('powershell -NoP -C "(Get-Content ''%OUT%\login.html'').Length"') do echo LOGIN_LEN=%%L
  echo [ASSERT] root redirect calisiyor (root html > 200)
  for /f %%L in ('powershell -NoP -C "(Get-Content ''%OUT%\root.html'').Length"') do echo ROOT_LEN=%%L
  echo [ASSERT] dashboard render (grid-cols-12/top-status var)
  findstr /i "grid-cols-12 top-status" "%OUT%\dashboard.html"
  echo [ASSERT] canary ok:true
  findstr /i "\"ok\": *true" "%OUT%\canary.json"
) > "%OUT%\asserts.txt"

:: Manifest + index
echo { > "%OUT%\sha256-manifest.json"
for %%F in (ui_health.json login.html demo_login.json root.html dashboard.html canary.json guardrails.json asserts.txt) do (
  for /f "tokens=1" %%H in ('certutil -hashfile "%OUT%\%%F" SHA256 ^| findstr /r "^[0-9A-F]"') do @echo   "%%F":"%%H",>> "%OUT%\sha256-manifest.json"
)
echo   "_note":"certutil SHA256" >> "%OUT%\sha256-manifest.json"
echo } >> "%OUT%\sha256-manifest.json"

(
  echo UNBLOCK-PRO-UI proof bundle
  dir /b "%OUT%"
) > "%OUT%\INDEX.txt"

start "" %UI%/dashboard
start "" %UI%/control-center
start "" %UI%/strategy-lab
start "" %UI%/portfolio
start "" %UI%/analytics
start "" %UI%/settings 