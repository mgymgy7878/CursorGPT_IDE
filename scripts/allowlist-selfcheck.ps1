$Out = "evidence\cursor_boot\allowlist_check.txt"
New-Item -Force -ItemType Directory (Split-Path $Out) | Out-Null

$tests = @(
    @{ name = "node -v"; cmd = { node -v }; expect = "auto" }
    @{ name = "pnpm -v"; cmd = { pnpm -v }; expect = "auto" }
    @{ name = "git-safe status"; cmd = { & .\scripts\git-safe.cmd status }; expect = "auto" }
    @{ name = "pm2-safe ls"; cmd = { & .\scripts\pm2-safe.cmd ls }; expect = "auto_or_missing" }
    @{ name = "git status"; cmd = { git status }; expect = "prompt" }
    @{ name = "Remove-Item -WhatIf"; cmd = { Remove-Item .\README.md -WhatIf }; expect = "prompt_or_block" }
    @{ name = "EncodedCommand"; cmd = { powershell -EncodedCommand Zg== }; expect = "prompt_or_block" }
)

$rows = @()
$allOk = $true
foreach ($t in $tests) {
    $ok = $true
    $obs = ""
    try {
        $obs = (& $t.cmd | Out-String).Trim()
    }
    catch {
        $obs = $_.Exception.Message
        # allowlist dışı testlerde hata/prompt beklenebilir; $ok'i burada düşürmeyelim
    }

    # Basit kurallar: expected'e göre $ok belirle
    switch ($t.expect) {
        "auto" {
            # Çalıştıysa genelde bir çıktı olur; hiç çıktı gelmemesi veya "not recognized" = fail
            if ([string]::IsNullOrWhiteSpace($obs) -or $obs -match "not recognized|denied") { $ok = $false }
        }
        "auto_or_missing" { $ok = $true } # pm2 yoksa da sorun değil
        "prompt" { $ok = $obs -match "Permission|not allowed|denied|not recognized" } # ajan prompt/blok davranışını bu şekilde yakalıyoruz
        "prompt_or_block" { $ok = $obs -match "Permission|not allowed|denied|not recognized" }
        default { $ok = $true }
    }

    if (-not $ok) { $allOk = $false }
    $rows += "{0,-26} | expected={1,-16} | observed={2}" -f $t.name, $t.expect, ($obs -replace "`r", "" -replace "`n", " ")
}

$health = if ($allOk) { "GREEN" } else { "YELLOW" }

"=== Allowlist Self-Check ===`n$(Get-Date -Format s)`nHEALTH=$health`n" | Out-File $Out -Encoding UTF8
$rows -join "`n" | Out-File $Out -Append -Encoding UTF8
Write-Host "Wrote $Out (HEALTH=$health)"
