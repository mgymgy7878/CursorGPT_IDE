# Gate C Evidence Helper
# Test sonuçlarını evidence dosyalarına kaydetmek için yardımcı script

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dual_panel", "abort", "limits")]
    [string]$TestType,

    [Parameter(Mandatory=$true)]
    [ValidateSet("PASS", "FAIL")]
    [string]$Status,

    [string]$RequestId = "",
    [string]$Screenshot = "",
    [string]$ConsoleLog = "",
    [string]$Log = "",
    [string]$NetworkDetails = "",
    [string]$Notes = "",
    [string]$AdditionalNotes = ""
)

$ErrorActionPreference = "Stop"

$evidenceFiles = @{
    "dual_panel" = "evidence/gateC_dual_panel_single_stream.txt"
    "abort" = "evidence/gateC_abort_idle_no_error_event.txt"
    "limits" = "evidence/gateC_limits_enforced.txt"
}

$file = $evidenceFiles[$TestType]
if (-not $file) {
    Write-Host "ERROR: Invalid test type: $TestType" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $file)) {
    Write-Host "ERROR: Evidence file not found: $file" -ForegroundColor Red
    exit 1
}

# Read current file
$content = Get-Content $file -Raw

# Update Status line
$content = $content -replace "Status: \[PASS/FAIL.*?\]", "Status: $Status"

# Update Actual Result section based on test type
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

switch ($TestType) {
    "dual_panel" {
        if ($RequestId) {
            $content = $content -replace "requestId: ___", "requestId: $RequestId"
        }
        if ($Screenshot) {
            $notes = if ($Notes) { $Notes } else { $AdditionalNotes }
            $content = $content -replace "\[PASTE OR DESCRIBE NETWORK TAB OBSERVATIONS\]", "Screenshot: $Screenshot`nNetwork Details: $NetworkDetails`n$notes"
        }
        $notes = if ($Notes) { $Notes } else { $AdditionalNotes }
        $content = $content -replace "\[RECORD HERE\]", "Test completed at $timestamp`n$notes"
    }
    "abort" {
        if ($RequestId) {
            $content = $content -replace "requestId: ___", "requestId: $RequestId"
        }
        $logFile = if ($Log) { $Log } elseif ($ConsoleLog) { $ConsoleLog } else { "" }
        if ($logFile) {
            $content = $content -replace "\[PASTE CONSOLE LOGS HERE\]", "Console Log: $logFile`n$AdditionalNotes"
        }
        $notes = if ($Notes) { $Notes } else { $AdditionalNotes }
        $content = $content -replace "\[RECORD HERE\]", "Test completed at $timestamp`n$notes"
    }
    "limits" {
        if ($RequestId) {
            $content = $content -replace "requestId: ___", "requestId: $RequestId"
        }
        if ($Screenshot) {
            $notes = if ($Notes) { $Notes } else { $AdditionalNotes }
            $content = $content -replace "\[PASTE EVIDENCE LOG HERE\]", "Screenshot: $Screenshot`n$notes"
        }
        $notes = if ($Notes) { $Notes } else { $AdditionalNotes }
        $content = $content -replace "\[RECORD HERE\]", "Test completed at $timestamp`n$notes"
    }
}

# Update Conclusion
$content = $content -replace "\[PASS/FAIL\] - .*", "$Status - Test verified"

# Write back
Set-Content -Path $file -Value $content -NoNewline

Write-Host "✅ Updated: $file" -ForegroundColor Green
Write-Host "   Status: $Status" -ForegroundColor $(if ($Status -eq "PASS") { "Green" } else { "Red" })

