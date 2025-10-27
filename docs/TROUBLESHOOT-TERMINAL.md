# Windows Terminal Troubleshooting Guide

## Overview

This guide covers common Windows terminal issues when working with the Spark Trading Platform development environment.

## Common Issues & Solutions

### 1. PowerShell Execution Policy

**Problem**: Scripts blocked by execution policy

**Solution**:
```powershell
# Check current policy
Get-ExecutionPolicy

# Set for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or set for all users (requires admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

### 2. Node.js Module Resolution

**Problem**: `Cannot find module` errors

**Solution**:
```powershell
# Clear npm cache
npm cache clean --force

# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
pnpm install
```

### 3. Port Conflicts

**Problem**: `EADDRINUSE` errors

**Solution**:
```powershell
# Find processes using ports
netstat -ano | findstr :3003
netstat -ano | findstr :4001

# Kill specific process
taskkill /PID <process_id> /F

# Kill all Node.js processes
taskkill /IM node.exe /F
```

### 4. Environment Variables Not Loading

**Problem**: `.env.local` changes not reflected

**Solution**:
```powershell
# Restart development server
taskkill /IM node.exe /F
cd apps/web-next
npm run dev

# Or use pnpm
pnpm dev
```

## VS Code Terminal Configuration

### Workspace Settings

The project includes optimized VS Code settings in `.vscode/settings.json`:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "path": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      "args": ["-NoExit", "-Command", "Set-Location '${workspaceFolder}'"]
    }
  },
  "terminal.integrated.cwd": "${workspaceFolder}",
  "terminal.integrated.inheritEnv": true,
  "terminal.integrated.windowsEnableConpty": true
}
```

### Terminal Profiles

**PowerShell (Recommended)**:
- Path: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
- Features: Modern terminal, better Unicode support
- Auto-location: Automatically navigates to workspace folder

**Command Prompt**:
- Path: `C:\Windows\System32\cmd.exe`
- Features: Legacy compatibility
- Use when: PowerShell has issues

## Compatibility Mode

### Legacy Console

If you experience rendering issues:

1. **Enable Legacy Console**:
   - Right-click terminal title bar
   - Select "Properties"
   - Check "Use legacy console"
   - Click "OK"

2. **Disable ConPTY**:
   - Add to VS Code settings:
   ```json
   {
     "terminal.integrated.windowsEnableConpty": false
   }
   ```

### Antivirus Exceptions

**Common AV Software**:

**Windows Defender**:
1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Manage settings"
4. Add exclusions for:
   - Project folder: `C:\dev\CursorGPT_IDE`
   - Node.js: `C:\Program Files\nodejs`
   - pnpm cache: `%LOCALAPPDATA%\pnpm`

**Other AV Software**:
- Add project folder to exclusions
- Exclude Node.js processes
- Allow npm/pnpm network access

## Trace Logging

### Enable Debug Logs

**VS Code Terminal**:
```json
{
  "terminal.integrated.logLevel": "debug"
}
```

**PowerShell**:
```powershell
# Enable verbose logging
$VerbosePreference = "Continue"

# Enable debug logging
$DebugPreference = "Continue"
```

**Node.js**:
```powershell
# Enable Node.js debug logs
$env:DEBUG = "*"

# Or specific modules
$env:DEBUG = "next:*"
```

### Log Locations

**VS Code**:
- Help → Toggle Developer Tools → Console
- Output panel → Terminal

**PowerShell**:
- Transcript: `Start-Transcript -Path "debug.log"`

**Node.js**:
- Console output in terminal
- Log files in project directories

## Performance Optimization

### Terminal Performance

1. **Reduce Buffer Size**:
   ```json
   {
     "terminal.integrated.scrollback": 1000
   }
   ```

2. **Disable GPU Acceleration** (if issues):
   ```json
   {
     "terminal.integrated.gpuAcceleration": "off"
   }
   ```

3. **Use Fast Scrolling**:
   ```json
   {
     "terminal.integrated.fastScrollSensitivity": 5
   }
   ```

### Memory Usage

**Monitor with Task Manager**:
- Press `Ctrl+Shift+Esc`
- Check "Node.js" processes
- Monitor memory usage

**Clean Up**:
```powershell
# Clear terminal buffer
Clear-Host

# Kill zombie processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## WSL Integration

### Default WSL Terminal

If using WSL as default:

```json
{
  "terminal.integrated.defaultProfile.windows": "WSL",
  "terminal.integrated.profiles.windows": {
    "WSL": {
      "path": "C:\\Windows\\System32\\wsl.exe",
      "args": ["-d", "Ubuntu"]
    }
  }
}
```

### WSL Troubleshooting

**WSL Not Starting**:
```powershell
# Enable WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart computer
Restart-Computer
```

## Network Issues

### Proxy Configuration

**Corporate Networks**:
```powershell
# Set proxy for npm
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Set proxy for pnpm
pnpm config set proxy http://proxy.company.com:8080
pnpm config set https-proxy http://proxy.company.com:8080
```

**Firewall Exceptions**:
- Allow Node.js through firewall
- Allow ports 3003, 4001
- Allow npm/pnpm network access

### DNS Issues

**Flush DNS**:
```powershell
ipconfig /flushdns
```

**Use Alternative DNS**:
```powershell
# Set DNS servers
netsh interface ip set dns "Ethernet" static 8.8.8.8
netsh interface ip add dns "Ethernet" 8.8.4.4 index=2
```

## Quick Fixes

### Reset Terminal

```powershell
# Kill all terminals
taskkill /IM node.exe /F
taskkill /IM powershell.exe /F

# Restart VS Code
code .
```

### Reset Environment

```powershell
# Clear all caches
npm cache clean --force
pnpm store prune
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next

# Reinstall
pnpm install
```

### Reset VS Code

```powershell
# Clear VS Code cache
Remove-Item -Recurse -Force "$env:APPDATA\Code\Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Code\CachedData"

# Restart VS Code
code .
```

## Getting Help

### Debug Information

Collect this information when reporting issues:

```powershell
# System info
systeminfo | Select-String "OS Name", "OS Version"

# Node.js version
node --version
npm --version
pnpm --version

# VS Code version
code --version

# Terminal info
$PSVersionTable
```

### Common Commands

```powershell
# Check if ports are in use
netstat -ano | findstr :3003
netstat -ano | findstr :4001

# Check process tree
tasklist /FI "IMAGENAME eq node.exe"

# Check environment variables
Get-ChildItem Env: | Where-Object {$_.Name -like "*NODE*" -or $_.Name -like "*PNPM*"}
``` 