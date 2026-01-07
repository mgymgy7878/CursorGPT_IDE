@echo off
rem Fast Startup durumunu kontrol eder

setlocal EnableExtensions

echo ========================================
echo Fast Startup Check
echo ========================================
echo.

echo [1/2] Hibernation status:
powercfg /a 2>nul | findstr /I "hibernate"
if %errorlevel%==0 (
  echo   ⚠️  Hibernation enabled (Fast Startup may be active)
) else (
  echo   ✅ Hibernation disabled (Fast Startup off)
)
echo.

echo [2/2] Current hibernation setting:
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Power" /v HiberFileSizePercent 2>nul | findstr "HiberFileSizePercent"
if %errorlevel%==0 (
  echo   ⚠️  Hibernation file exists (Fast Startup likely enabled)
) else (
  echo   ✅ Hibernation file not configured
)
echo.

echo ========================================
echo Fast Startup Info
echo ========================================
echo.
echo Fast Startup (Hibrit Kapanış) bazen Task/Startup trigger'larını
echo tutarsız yapabilir. Eğer reboot sonrası daemon başlamıyorsa:
echo.
echo Disable Fast Startup:
echo   powercfg /h off
echo.
echo Re-enable (if needed):
echo   powercfg /h on
echo.
echo Manual method:
echo   Denetim Masası -> Güç Seçenekleri ->
echo   "Güç düğmelerinin yapacaklarını seç" ->
echo   "Hızlı başlatmayı aç" -> KAPAT
echo.

pause
exit /b 0

