#!/usr/bin/env bash
# SPARK TRADING PLATFORM - BACKUP ROTATION SCRIPT
# Son 3 backup'ı saklar, eski olanları siler

set -euo pipefail

# Konfigürasyon
BACKUP_DIR="backups"
MAX_BACKUPS=3
BACKUP_PREFIX="config-"
LOG_FILE="logs/backup-rotation.log"

# Log dizinini oluştur
mkdir -p "$(dirname "$LOG_FILE")"

# Log fonksiyonu
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔄 Backup rotasyon işlemi başlatılıyor..."

# Backup dizinini kontrol et
if [ ! -d "$BACKUP_DIR" ]; then
    log "❌ Backup dizini bulunamadı: $BACKUP_DIR"
    exit 1
fi

# Mevcut backup'ları listele ve tarihe göre sırala
backups=($(ls -1t "$BACKUP_DIR" | grep "^$BACKUP_PREFIX" | head -n -1))

# Eğer 3'ten fazla backup varsa, eski olanları sil
if [ ${#backups[@]} -gt $MAX_BACKUPS ]; then
    log "📊 Toplam backup sayısı: ${#backups[@]} (Maksimum: $MAX_BACKUPS)"
    
    # Silinecek backup'ları hesapla
    to_delete=($(ls -1t "$BACKUP_DIR" | grep "^$BACKUP_PREFIX" | tail -n +$((MAX_BACKUPS + 1))))
    
    log "🗑️  Silinecek backup sayısı: ${#to_delete[@]}"
    
    # Eski backup'ları sil
    for backup in "${to_delete[@]}"; do
        if [ -d "$BACKUP_DIR/$backup" ]; then
            log "🗑️  Siliniyor: $backup"
            rm -rf "$BACKUP_DIR/$backup"
            log "✅ Silindi: $backup"
        fi
    done
    
    log "✅ Backup rotasyon tamamlandı"
else
    log "ℹ️  Backup sayısı limit içinde (${#backups[@]}/$MAX_BACKUPS)"
fi

# GPT_Backups klasörünü de temizle (eğer varsa)
if [ -d "GPT_Backups" ]; then
    log "🧹 GPT_Backups klasörü temizleniyor..."
    rm -rf GPT_Backups
    log "✅ GPT_Backups klasörü temizlendi"
fi

# Temp dosyaları temizle
log "🧹 Geçici dosyalar temizleniyor..."
find . -name "temp_*.json" -type f -delete 2>/dev/null || true
find . -name "*.tmp" -type f -delete 2>/dev/null || true
log "✅ Geçici dosyalar temizlendi"

# Disk kullanımını raporla
disk_usage=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "N/A")
log "💾 Backup dizini boyutu: $disk_usage"

log "🎯 Backup rotasyon işlemi tamamlandı!"
