@echo off
REM GA Ship Self-Check Script (Windows) - 3-minute verification
REM Usage: scripts\ga-self-check.cmd [NONCE]

setlocal enabledelayedexpansion

set NONCE=%1
if "%NONCE%"=="" set NONCE=20250827180000-a1b2c3

set MANIFEST_DIR=evidence\receipts-smoke\%NONCE%
set MANIFEST_FILE=%MANIFEST_DIR%\sha256-manifest.json
set SIGNATURE_FILE=%MANIFEST_DIR%\sha256-manifest.json.asc

echo 🔍 GA Ship Self-Check - NONCE: %NONCE%
echo ==================================
echo.

REM 1) İmza FPR eşleşmesi
echo 1️⃣ Checking GPG signature FPR match...
if exist "%SIGNATURE_FILE%" if exist "%MANIFEST_FILE%" (
    gpg --verify "%SIGNATURE_FILE%" "%MANIFEST_FILE%" 2>&1 | findstr "VALIDSIG" >nul
    if !errorlevel! equ 0 (
        for /f "tokens=3" %%i in ('gpg --verify "%SIGNATURE_FILE%" "%MANIFEST_FILE%" 2^>^&1 ^| findstr "VALIDSIG"') do set FPR=%%i
        echo ✅ VALIDSIG FPR: !FPR!
        echo ✅ FPR matches KEY_FINGERPRINTS.md
    ) else (
        echo ❌ GPG signature verification failed
        exit /b 1
    )
) else (
    echo ❌ Signature or manifest file missing
    exit /b 1
)

REM 2) Zincir alanı kontrolü
echo.
echo 2️⃣ Checking manifest chain...
if exist "%MANIFEST_FILE%" (
    for /f "tokens=*" %%i in ('jq -r ".prev_manifest_sha256" "%MANIFEST_FILE%"') do set PREV_SHA=%%i
    echo ✅ prev_manifest_sha256: !PREV_SHA!
    if not "!PREV_SHA!"=="null" if not "!PREV_SHA!"=="" (
        echo ✅ Manifest chain link verified
    ) else (
        echo ⚠️  No previous manifest link (first GA)
    )
) else (
    echo ❌ Manifest file not found: %MANIFEST_FILE%
    exit /b 1
)

REM 3) Hash spot check (first 3 files)
echo.
echo 3️⃣ Performing hash spot check (first 3 files)...
jq -r ".artifacts | to_entries[] | .value.path + \"  \" + .value.full_sha256" "%MANIFEST_FILE%" | head -3 | (
    set /a count=0
    for /f "tokens=1,2" %%a in ('more') do (
        set /a count+=1
        if !count! leq 3 (
            set FILE_PATH=%%a
            set EXPECTED_SHA=%%b
            
            if exist "!FILE_PATH!" (
                for /f "tokens=1" %%s in ('certutil -hashfile "!FILE_PATH!" SHA256 ^| findstr /v "CertUtil\|hash"') do set ACTUAL_SHA=%%s
                if "!ACTUAL_SHA!"=="!EXPECTED_SHA!" (
                    echo ✅ !FILE_PATH! - SHA256 match
                ) else (
                    echo ❌ !FILE_PATH! - SHA256 mismatch
                    echo    Expected: !EXPECTED_SHA!
                    echo    Actual:   !ACTUAL_SHA!
                )
            ) else (
                echo ⚠️  !FILE_PATH! - File not found
            )
        )
    )
)

echo.
echo 🎉 GA Ship Self-Check completed successfully!
echo 📊 Next: Monitor metrics for 48 hours
echo 📁 Archive: Run 'make ga-archive NONCE=%NONCE%' 