# SPARK TRADING PLATFORM - BACKUP ROTATION SCRIPT (PowerShell)
# Son 3 backup'ı saklar, eski olanları siler

param(
    [int]$MaxBackups = 3,
    [string]$BackupDir = "backups",
    [string]$LogFile = "logs/backup-rotation.log"
)

# Log dizinini oluştur
$LogDir = Split-Path $LogFile -Parent
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Log fonksiyonu
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

Write-Log "🔄 Backup rotasyon işlemi başlatılıyor..."

# Backup dizinini kontrol et
if (!(Test-Path $BackupDir)) {
    Write-Log "❌ Backup dizini bulunamadı: $BackupDir"
    exit 1
}

# Mevcut backup'ları listele ve tarihe göre sırala
$Backups = Get-ChildItem -Path $BackupDir -Directory | 
    Where-Object { $_.Name -like "config-*" } | 
    Sort-Object LastWriteTime -Descending

Write-Log "📊 Toplam backup sayısı: $($Backups.Count) (Maksimum: $MaxBackups)"

# Eğer 3'ten fazla backup varsa, eski olanları sil
if ($Backups.Count -gt $MaxBackups) {
    $ToDelete = $Backups | Select-Object -Skip $MaxBackups
    
    Write-Log "🗑️  Silinecek backup sayısı: $($ToDelete.Count)"
    
    # Eski backup'ları sil
    foreach ($Backup in $ToDelete) {
        Write-Log "🗑️  Siliniyor: $($Backup.Name)"
        Remove-Item -Path $Backup.FullName -Recurse -Force
        Write-Log "✅ Silindi: $($Backup.Name)"
    }
    
    Write-Log "✅ Backup rotasyon tamamlandı"
} else {
    Write-Log "ℹ️  Backup sayısı limit içinde ($($Backups.Count)/$MaxBackups)"
}

# GPT_Backups klasörünü de temizle (eğer varsa)
if (Test-Path "GPT_Backups") {
    Write-Log "🧹 GPT_Backups klasörü temizleniyor..."
    Remove-Item -Path "GPT_Backups" -Recurse -Force
    Write-Log "✅ GPT_Backups klasörü temizlendi"
}

# Temp dosyaları temizle
Write-Log "🧹 Geçici dosyalar temizleniyor..."
Get-ChildItem -Path . -Filter "temp_*.json" -File -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path . -Filter "*.tmp" -File -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Log "✅ Geçici dosyalar temizlendi"

# Disk kullanımını raporla
$DiskUsage = (Get-ChildItem -Path $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum
$DiskUsageMB = [math]::Round($DiskUsage / 1MB, 2)
Write-Log "💾 Backup dizini boyutu: $DiskUsageMB MB"

Write-Log "🎯 Backup rotasyon işlemi tamamlandı!"
