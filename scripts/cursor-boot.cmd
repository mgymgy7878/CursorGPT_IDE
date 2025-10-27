@echo off
setlocal EnableExtensions
title Cursor Boot - Spark Profile
echo [Cursor-Boot] Starting...
echo.

rem Create evidence folder
if not exist evidence\cursor_boot mkdir evidence\cursor_boot

rem Echo checklist pointers
echo "Open docs\cursor-settings-checklist.md and apply toggles in Cursor Settings UI." > evidence\cursor_boot\summary.txt
echo "Copy docs\cursor-rules-memory.txt into Settings Rules and Memory." >> evidence\cursor_boot\summary.txt
echo "Verify .cursorignore is active (Context Hierarchical Ignore ON)." >> evidence\cursor_boot\summary.txt
echo "Recommended allowlist: node pnpm pnpm run pnpm --filter pnpm -w tsc npx curl Invoke-WebRequest mkdir Move-Item rimraf Get-ChildItem Get-Content type Start-Sleep netstat findstr taskkill cd" >> evidence\cursor_boot\summary.txt

echo [Cursor-Boot] Wrote evidence\cursor_boot\summary.txt
echo Done.
exit /b 0
