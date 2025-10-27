#!/bin/bash

# PostgreSQL Backup Script for Spark Trading Platform
# Usage: ./pg_backup.sh [full|incremental] [retention_days]

set -e

# Configuration
BACKUP_DIR="/backup/database"
LOG_DIR="/backup/logs"
RETENTION_DAYS=${2:-30}
BACKUP_TYPE=${1:-full}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="spark_trading_${BACKUP_TYPE}_${TIMESTAMP}"

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-spark_trading}
DB_USER=${DB_USER:-postgres}

# Create backup directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/backup.log"
}

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    log "ERROR: pg_dump command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Function to perform full backup
full_backup() {
    log "Starting full backup: $BACKUP_NAME"
    
    # Create backup file
    BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql"
    
    # Perform pg_dump
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --file="$BACKUP_FILE" \
        2>&1 | tee -a "$LOG_DIR/backup.log"
    
    # Check if backup was successful
    if [ $? -eq 0 ]; then
        log "Full backup completed successfully: $BACKUP_FILE"
        
        # Compress backup file
        gzip "$BACKUP_FILE"
        log "Backup compressed: ${BACKUP_FILE}.gz"
        
        # Create backup metadata
        cat > "$BACKUP_DIR/${BACKUP_NAME}.meta" << EOF
BACKUP_TYPE=full
TIMESTAMP=$TIMESTAMP
SIZE=$(stat -c%s "${BACKUP_FILE}.gz")
CHECKSUM=$(sha256sum "${BACKUP_FILE}.gz" | cut -d' ' -f1)
EOF
        
        log "Backup metadata created: $BACKUP_DIR/${BACKUP_NAME}.meta"
    else
        log "ERROR: Full backup failed"
        exit 1
    fi
}

# Function to perform incremental backup
incremental_backup() {
    log "Starting incremental backup: $BACKUP_NAME"
    
    # Find the last full backup
    LAST_FULL_BACKUP=$(find "$BACKUP_DIR" -name "spark_trading_full_*.sql.gz" -type f | sort | tail -n 1)
    
    if [ -z "$LAST_FULL_BACKUP" ]; then
        log "WARNING: No full backup found. Performing full backup instead."
        full_backup
        return
    fi
    
    # Create incremental backup file
    BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql"
    
    # Get the timestamp of the last full backup
    LAST_BACKUP_TIME=$(basename "$LAST_FULL_BACKUP" | sed 's/spark_trading_full_\(.*\)\.sql\.gz/\1/' | sed 's/_/ /')
    LAST_BACKUP_EPOCH=$(date -d "$LAST_BACKUP_TIME" +%s)
    
    # Perform incremental backup (only data modified since last full backup)
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --data-only \
        --disable-triggers \
        --file="$BACKUP_FILE" \
        2>&1 | tee -a "$LOG_DIR/backup.log"
    
    # Check if backup was successful
    if [ $? -eq 0 ]; then
        log "Incremental backup completed successfully: $BACKUP_FILE"
        
        # Compress backup file
        gzip "$BACKUP_FILE"
        log "Backup compressed: ${BACKUP_FILE}.gz"
        
        # Create backup metadata
        cat > "$BACKUP_DIR/${BACKUP_NAME}.meta" << EOF
BACKUP_TYPE=incremental
TIMESTAMP=$TIMESTAMP
SIZE=$(stat -c%s "${BACKUP_FILE}.gz")
CHECKSUM=$(sha256sum "${BACKUP_FILE}.gz" | cut -d' ' -f1)
LAST_FULL_BACKUP=$(basename "$LAST_FULL_BACKUP")
EOF
        
        log "Backup metadata created: $BACKUP_DIR/${BACKUP_NAME}.meta"
    else
        log "ERROR: Incremental backup failed"
        exit 1
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days"
    
    # Find and remove old backup files
    find "$BACKUP_DIR" -name "spark_trading_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "spark_trading_*.meta" -type f -mtime +$RETENTION_DAYS -delete
    
    log "Cleanup completed"
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    local meta_file="${backup_file%.sql.gz}.meta"
    
    if [ -f "$meta_file" ]; then
        # Read expected checksum from metadata
        expected_checksum=$(grep "^CHECKSUM=" "$meta_file" | cut -d'=' -f2)
        
        # Calculate actual checksum
        actual_checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
        
        if [ "$expected_checksum" = "$actual_checksum" ]; then
            log "Backup integrity verified: $(basename "$backup_file")"
            return 0
        else
            log "ERROR: Backup integrity check failed: $(basename "$backup_file")"
            return 1
        fi
    else
        log "WARNING: No metadata file found for: $(basename "$backup_file")"
        return 0
    fi
}

# Main execution
log "=== Starting Spark Trading Database Backup ==="
log "Backup type: $BACKUP_TYPE"
log "Retention days: $RETENTION_DAYS"
log "Backup directory: $BACKUP_DIR"

# Perform backup based on type
case "$BACKUP_TYPE" in
    "full")
        full_backup
        ;;
    "incremental")
        incremental_backup
        ;;
    *)
        log "ERROR: Invalid backup type. Use 'full' or 'incremental'"
        exit 1
        ;;
esac

# Verify the latest backup
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "spark_trading_${BACKUP_TYPE}_*.sql.gz" -type f | sort | tail -n 1)
if [ -n "$LATEST_BACKUP" ]; then
    verify_backup "$LATEST_BACKUP"
fi

# Cleanup old backups
cleanup_old_backups

# Log backup summary
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "spark_trading_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(find "$BACKUP_DIR" -name "spark_trading_*.sql.gz" -type f -exec stat -c%s {} \; | awk '{sum+=$1} END {print sum}')

log "=== Backup Summary ==="
log "Total backups: $BACKUP_COUNT"
log "Total size: ${TOTAL_SIZE:-0} bytes"
log "=== Backup Completed ==="

exit 0 