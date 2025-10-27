# Spark Platform Desktop Kısayol Oluşturucu
# Masaüstüne kısayol ve logo ekler

Write-Host "🚀 Spark Platform Desktop Kısayol Oluşturuluyor..." -ForegroundColor Green

# Mevcut dizin
$currentDir = Get-Location
$batFile = Join-Path $currentDir "spark-desktop.bat"

# Logo oluştur (SVG)
$logoPath = Join-Path $currentDir "spark-logo.ico"
$svgContent = @"
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#grad1)" stroke="#1E40AF" stroke-width="2"/>
  <path d="M20 25 L32 15 L44 25 L40 32 L44 39 L32 49 L20 39 L24 32 Z" fill="white" opacity="0.9"/>
  <circle cx="32" cy="32" r="6" fill="white"/>
  <text x="32" y="38" font-family="Arial" font-size="8" font-weight="bold" text-anchor="middle" fill="#1E40AF">SP</text>
</svg>
"@

$svgPath = Join-Path $currentDir "spark-logo.svg"
$svgContent | Out-File -FilePath $svgPath -Encoding UTF8

# SVG'yi ICO'ya dönüştür (basit yöntem)
Write-Host "📱 Logo oluşturuluyor..." -ForegroundColor Yellow

# Kısayol oluştur
$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Spark Platform.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $batFile
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.Description = "Spark Trading Platform Desktop"
$Shortcut.IconLocation = $svgPath

$Shortcut.Save()

Write-Host "✅ Kısayol oluşturuldu: $ShortcutPath" -ForegroundColor Green
Write-Host "🎨 Logo hazırlandı: $svgPath" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Kullanım:" -ForegroundColor Cyan
Write-Host "   • Masaüstünden 'Spark Platform' kısayoluna çift tıklayın" -ForegroundColor White
Write-Host "   • Chrome desktop uygulaması açılacak" -ForegroundColor White
Write-Host "   • F12 ile DevTools kullanabilirsiniz" -ForegroundColor White
