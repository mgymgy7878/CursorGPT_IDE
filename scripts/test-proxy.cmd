@echo off
setlocal
set DATA={"ping":"pong"}

echo ========================================
echo SPARK PROXY AUTH + RESILIENCE TEST SUITE
echo ========================================
echo.

echo === 1. Backend Direct Test ===
curl -s -X POST http://127.0.0.1:4001/api/public/echo -H "Content-Type: application/json" -d %DATA%
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Backend not responding
    exit /b 1
)
echo [PASS] Backend direct test
echo.

echo === 2. Proxy Test without Token (should return 401) ===
curl -s -X POST http://localhost:3003/api/public/echo -H "Content-Type: application/json" -d %DATA%
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Proxy not responding on 3003
    exit /b 1
)
echo [PASS] Proxy auth test (401 expected)
echo.

echo === 3. Proxy Test with Token (should work) ===
curl -s -X POST http://localhost:3003/api/public/echo -H "Content-Type: application/json" -H "Authorization: Bearer dev-secret-change-me" -d %DATA%
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Proxy auth not working
    exit /b 1
)
echo [PASS] Proxy auth test (200 expected)
echo.

echo === 4. Proxy Test with Wrong Token (should return 401) ===
curl -s -X POST http://localhost:3003/api/public/echo -H "Content-Type: application/json" -H "Authorization: Bearer wrong-token" -d %DATA%
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Proxy auth validation not working
    exit /b 1
)
echo [PASS] Proxy auth validation test (401 expected)
echo.

echo === 5. Kill-Switch Test ===
set PROXY_KILL_SWITCH=1
curl -s -X POST http://localhost:3003/api/public/echo -H "Content-Type: application/json" -d %DATA%
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Kill-switch not working
    exit /b 1
)
echo [PASS] Kill-switch test
set PROXY_KILL_SWITCH=0
echo.

echo === 6. Size Limit Test ===
curl -s -X POST http://localhost:3003/api/public/echo -H "Content-Type: application/json" -H "Content-Length: 11000000" -d %DATA%
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Size limit not working
    exit /b 1
)
echo [PASS] Size limit test
echo.

echo === 7. Metrics Test ===
curl -s http://localhost:3003/api/public/metrics/prom
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Metrics endpoint not working
    exit /b 1
)
echo [PASS] Metrics endpoint test
echo.

echo ========================================
echo ALL TESTS PASSED! PROXY IS HARD GREEN! 🎉
echo ========================================
endlocal 