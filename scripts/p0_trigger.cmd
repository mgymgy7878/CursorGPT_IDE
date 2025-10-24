@echo off
REM P0 Workflow Trigger Script
REM This script triggers the P0 Chain workflow after default branch is changed to 'main'

echo Checking default branch...
gh api repos/mgymgy7878/CursorGPT_IDE -q ".default_branch"

echo.
echo Triggering P0 Chain workflow...
gh workflow run p0-chain.yml --ref main

echo.
echo Listing recent workflow runs...
gh run list --limit 5

echo.
echo Done! Check workflow status at: https://github.com/mgymgy7878/CursorGPT_IDE/actions
