# Database Restore Talimatları

Bu doküman, Spark Trading Platform veritabanının yedeklerden nasıl geri yükleneceğini açıklar.

## Ön Gereksinimler

- PostgreSQL 12+ yüklü ve çalışır durumda
- `psql` komut satırı aracı mevcut
- Yeterli disk alanı (backup boyutunun en az 2 katı)
- Veritabanı yönetici yetkileri

## Restore Senaryoları

### 1. Tam Sistem Geri Yükleme (Disaster Recovery)

Bu senaryo, tüm sistemi sıfırdan geri yüklemek için kullanılır.

```bash
# 1. Mevcut veritabanını durdur
sudo systemctl stop postgresql

# 2. Veritabanı dizinini yedekle
sudo cp -r /var/lib/postgresql/data /var/lib/postgresql/data.backup.$(date +%Y%m%d_%H%M%S)

# 3. Veritabanı dizinini temizle
sudo rm -rf /var/lib/postgresql/data/*

# 4. PostgreSQL'i başlat
sudo systemctl start postgresql

# 5. Veritabanını oluştur
sudo -u postgres createdb spark_trading

# 6. En son tam yedeği geri yükle
BACKUP_FILE="/backup/database/spark_trading_full_YYYYMMDD_HHMMSS.sql.gz"
gunzip -c "$BACKUP_FILE" | sudo -u postgres psql spark_trading

# 7. Varsa incremental yedekleri uygula
for inc_file in /backup/database/spark_trading_incremental_*.sql.gz; do
    if [ -f "$inc_file" ]; then
        echo "Applying incremental backup: $inc_file"
        gunzip -c "$inc_file" | sudo -u postgres psql spark_trading
    fi
done
```

### 2. Tek Veritabanı Geri Yükleme

Bu senaryo, sadece belirli bir veritabanını geri yüklemek için kullanılır.

```bash
# 1. Mevcut veritabanını yedekle
sudo -u postgres pg_dump spark_trading > /tmp/spark_trading_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Veritabanını sil ve yeniden oluştur
sudo -u postgres dropdb spark_trading
sudo -u postgres createdb spark_trading

# 3. Yedeği geri yükle
BACKUP_FILE="/backup/database/spark_trading_full_YYYYMMDD_HHMMSS.sql.gz"
gunzip -c "$BACKUP_FILE" | sudo -u postgres psql spark_trading
```

### 3. Belirli Tabloları Geri Yükleme

Bu senaryo, sadece belirli tabloları geri yüklemek için kullanılır.

```bash
# 1. Sadece belirli tabloları geri yükle
BACKUP_FILE="/backup/database/spark_trading_full_YYYYMMDD_HHMMSS.sql.gz"

# Önce backup dosyasını geçici olarak aç
gunzip -c "$BACKUP_FILE" > /tmp/backup_temp.sql

# Belirli tabloları geri yükle (örnek: executions ve trades tabloları)
sudo -u postgres psql spark_trading -c "DROP TABLE IF EXISTS executions CASCADE;"
sudo -u postgres psql spark_trading -c "DROP TABLE IF EXISTS trades CASCADE;"

# Backup dosyasından sadece bu tabloları çıkar ve geri yükle
sed -n '/CREATE TABLE executions/,/^$/p' /tmp/backup_temp.sql | sudo -u postgres psql spark_trading
sed -n '/CREATE TABLE trades/,/^$/p' /tmp/backup_temp.sql | sudo -u postgres psql spark_trading

# Veri ekleme komutlarını bul ve uygula
grep -A 1000 "COPY executions" /tmp/backup_temp.sql | head -n 1000 | sudo -u postgres psql spark_trading
grep -A 1000 "COPY trades" /tmp/backup_temp.sql | head -n 1000 | sudo -u postgres psql spark_trading

# Geçici dosyayı temizle
rm /tmp/backup_temp.sql
```

## Yedek Doğrulama

Geri yükleme işleminden önce yedek dosyasının bütünlüğünü kontrol edin:

```bash
# Yedek dosyasının checksum'ını kontrol et
BACKUP_FILE="/backup/database/spark_trading_full_YYYYMMDD_HHMMSS.sql.gz"
META_FILE="/backup/database/spark_trading_full_YYYYMMDD_HHMMSS.meta"

# Metadata dosyasından beklenen checksum'ı al
EXPECTED_CHECKSUM=$(grep "^CHECKSUM=" "$META_FILE" | cut -d'=' -f2)

# Gerçek checksum'ı hesapla
ACTUAL_CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)

# Karşılaştır
if [ "$EXPECTED_CHECKSUM" = "$ACTUAL_CHECKSUM" ]; then
    echo "Backup integrity verified ✓"
else
    echo "ERROR: Backup integrity check failed ✗"
    exit 1
fi
```

## Restore Sonrası Kontroller

Geri yükleme işleminden sonra aşağıdaki kontrolleri yapın:

```bash
# 1. Veritabanı bağlantısını test et
sudo -u postgres psql spark_trading -c "SELECT version();"

# 2. Tablo sayısını kontrol et
sudo -u postgres psql spark_trading -c "\dt"

# 3. Kayıt sayılarını kontrol et
sudo -u postgres psql spark_trading -c "SELECT COUNT(*) FROM executions;"
sudo -u postgres psql spark_trading -c "SELECT COUNT(*) FROM trades;"

# 4. En son kayıtları kontrol et
sudo -u postgres psql spark_trading -c "SELECT * FROM executions ORDER BY started_at DESC LIMIT 5;"
sudo -u postgres psql spark_trading -c "SELECT * FROM trades ORDER BY ts DESC LIMIT 5;"

# 5. Uygulama bağlantısını test et
curl -X GET http://localhost:4001/api/public/health
```

## Otomatik Restore Script'i

Aşağıdaki script, otomatik restore işlemi için kullanılabilir:

```bash
#!/bin/bash
# auto_restore.sh

set -e

BACKUP_DIR="/backup/database"
DB_NAME="spark_trading"
DB_USER="postgres"

# En son tam yedeği bul
LATEST_FULL_BACKUP=$(find "$BACKUP_DIR" -name "spark_trading_full_*.sql.gz" -type f | sort | tail -n 1)

if [ -z "$LATEST_FULL_BACKUP" ]; then
    echo "ERROR: No full backup found in $BACKUP_DIR"
    exit 1
fi

echo "Restoring from: $LATEST_FULL_BACKUP"

# Veritabanını yeniden oluştur
sudo -u postgres dropdb --if-exists "$DB_NAME"
sudo -u postgres createdb "$DB_NAME"

# Yedeği geri yükle
gunzip -c "$LATEST_FULL_BACKUP" | sudo -u postgres psql "$DB_NAME"

echo "Restore completed successfully"
```

## Sorun Giderme

### Yaygın Hatalar ve Çözümleri

1. **Yetki Hatası**
   ```bash
   # PostgreSQL kullanıcısına gerekli yetkileri ver
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE spark_trading TO spark_user;"
   ```

2. **Disk Alanı Yetersiz**
   ```bash
   # Disk kullanımını kontrol et
   df -h
   
   # Eski yedekleri temizle
   find /backup/database -name "*.sql.gz" -mtime +30 -delete
   ```

3. **PostgreSQL Servis Hatası**
   ```bash
   # PostgreSQL durumunu kontrol et
   sudo systemctl status postgresql
   
   # Servisi yeniden başlat
   sudo systemctl restart postgresql
   ```

4. **Backup Dosyası Bozuk**
   ```bash
   # Dosya bütünlüğünü kontrol et
   gunzip -t /backup/database/spark_trading_full_YYYYMMDD_HHMMSS.sql.gz
   
   # Alternatif yedek kullan
   find /backup/database -name "spark_trading_full_*.sql.gz" -type f | sort | tail -n 2
   ```

## Güvenlik Notları

- Restore işlemi sırasında uygulamayı durdurun
- Production ortamında restore işlemini test ortamında önce deneyin
- Restore işleminden önce mevcut verileri yedekleyin
- Restore sonrası uygulama loglarını kontrol edin
- Kullanıcı yetkilerini ve bağlantı ayarlarını doğrulayın

## İletişim

Restore işlemi sırasında sorun yaşarsanız:
- Sistem loglarını kontrol edin: `sudo journalctl -u postgresql`
- Backup loglarını kontrol edin: `tail -f /backup/logs/backup.log`
- Uygulama loglarını kontrol edin: `tail -f /var/log/spark-trading/app.log` 