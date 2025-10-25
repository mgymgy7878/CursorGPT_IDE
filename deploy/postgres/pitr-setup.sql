-- PostgreSQL PITR (Point-in-Time Recovery) Setup
-- Enables continuous backup and point-in-time recovery
-- Run as postgres superuser

-- 1. Enable WAL archiving
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f';
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET wal_keep_segments = 64;

-- 2. Create archive directory (run as postgres user)
-- mkdir -p /var/lib/postgresql/archive
-- chown postgres:postgres /var/lib/postgresql/archive
-- chmod 700 /var/lib/postgresql/archive

-- 3. Configure backup settings
ALTER SYSTEM SET backup_standby = on;
ALTER SYSTEM SET hot_standby = on;

-- 4. Create backup user
CREATE USER backup_user WITH REPLICATION PASSWORD 'backup_secure_password_2024';

-- 5. Grant necessary permissions
GRANT CONNECT ON DATABASE spark_trading TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;

-- 6. Create backup tablespace (optional)
-- CREATE TABLESPACE backup_ts LOCATION '/var/lib/postgresql/backup_ts';

-- 7. Configure logging for backup monitoring
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET logging_collector = on;
ALTER SYSTEM SET log_directory = 'log';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_rotation_age = 1d;
ALTER SYSTEM SET log_rotation_size = 100MB;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- 8. Reload configuration
SELECT pg_reload_conf();

-- 9. Verify WAL archiving is working
SELECT pg_switch_wal();
SELECT * FROM pg_stat_archiver;

-- 10. Create backup monitoring view
CREATE OR REPLACE VIEW backup_status AS
SELECT 
    'WAL Archiving' as backup_type,
    CASE 
        WHEN archived_count > 0 THEN 'Active'
        ELSE 'Inactive'
    END as status,
    last_archived_wal,
    last_archived_time,
    archived_count,
    failed_count
FROM pg_stat_archiver
UNION ALL
SELECT 
    'Base Backup' as backup_type,
    CASE 
        WHEN pg_is_in_backup() THEN 'In Progress'
        ELSE 'Not Running'
    END as status,
    NULL as last_archived_wal,
    NULL as last_archived_time,
    NULL as archived_count,
    NULL as failed_count;

-- 11. Create backup verification function
CREATE OR REPLACE FUNCTION verify_backup_integrity()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check WAL archiving
    RETURN QUERY
    SELECT 
        'WAL Archiving'::TEXT,
        CASE 
            WHEN (SELECT count(*) FROM pg_stat_archiver WHERE archived_count > 0) > 0 
            THEN 'OK'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Archived WAL files: ' || (SELECT count(*) FROM pg_stat_archiver)::TEXT;
    
    -- Check database connectivity
    RETURN QUERY
    SELECT 
        'Database Connectivity'::TEXT,
        'OK'::TEXT,
        'Database is accessible'::TEXT;
    
    -- Check disk space (approximate)
    RETURN QUERY
    SELECT 
        'Disk Space'::TEXT,
        CASE 
            WHEN pg_database_size('spark_trading') < 1000000000 -- 1GB
            THEN 'OK'::TEXT
            ELSE 'WARN'::TEXT
        END,
        'Database size: ' || pg_size_pretty(pg_database_size('spark_trading'))::TEXT;
    
    -- Check for long-running queries
    RETURN QUERY
    SELECT 
        'Long Running Queries'::TEXT,
        CASE 
            WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes') = 0
            THEN 'OK'::TEXT
            ELSE 'WARN'::TEXT
        END,
        'Active queries: ' || (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 12. Create backup restore function
CREATE OR REPLACE FUNCTION get_restore_commands(target_time TIMESTAMP DEFAULT NULL)
RETURNS TABLE(
    step_order INTEGER,
    command TEXT,
    description TEXT
) AS $$
BEGIN
    IF target_time IS NULL THEN
        target_time := now() - interval '1 hour';
    END IF;
    
    RETURN QUERY
    SELECT 
        1::INTEGER,
        'Stop application services'::TEXT,
        'Ensure no active connections to database'::TEXT
    UNION ALL
    SELECT 
        2::INTEGER,
        'pg_ctl stop'::TEXT,
        'Stop PostgreSQL service'::TEXT
    UNION ALL
    SELECT 
        3::INTEGER,
        'rm -rf /var/lib/postgresql/data/*'::TEXT,
        'Remove current data directory contents'::TEXT
    UNION ALL
    SELECT 
        4::INTEGER,
        'pg_basebackup -D /var/lib/postgresql/data -Ft -z -P'::TEXT,
        'Restore base backup'::TEXT
    UNION ALL
    SELECT 
        5::INTEGER,
        'cp /var/lib/postgresql/archive/* /var/lib/postgresql/data/pg_wal/'::TEXT,
        'Copy WAL files to data directory'::TEXT
    UNION ALL
    SELECT 
        6::INTEGER,
        'echo "restore_command = ''cp /var/lib/postgresql/archive/%f %p''" >> /var/lib/postgresql/data/postgresql.conf'::TEXT,
        'Configure restore command'::TEXT
    UNION ALL
    SELECT 
        7::INTEGER,
        'echo "recovery_target_time = ''' || target_time::TEXT || '''" >> /var/lib/postgresql/data/postgresql.conf'::TEXT,
        'Set recovery target time'::TEXT
    UNION ALL
    SELECT 
        8::INTEGER,
        'touch /var/lib/postgresql/data/recovery.signal'::TEXT,
        'Create recovery signal file'::TEXT
    UNION ALL
    SELECT 
        9::INTEGER,
        'pg_ctl start'::TEXT,
        'Start PostgreSQL service'::TEXT
    UNION ALL
    SELECT 
        10::INTEGER,
        'Monitor recovery progress in logs'::TEXT,
        'Check PostgreSQL logs for recovery completion'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 13. Create backup monitoring dashboard query
CREATE OR REPLACE VIEW backup_dashboard AS
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size('spark_trading')) as value,
    'Current database size' as description
UNION ALL
SELECT 
    'WAL Files Archived' as metric,
    archived_count::TEXT as value,
    'Total WAL files archived' as description
FROM pg_stat_archiver
UNION ALL
SELECT 
    'Failed Archives' as metric,
    failed_count::TEXT as value,
    'Failed WAL archive attempts' as description
FROM pg_stat_archiver
UNION ALL
SELECT 
    'Last Archive Time' as metric,
    COALESCE(last_archived_time::TEXT, 'Never') as value,
    'Last successful WAL archive' as description
FROM pg_stat_archiver
UNION ALL
SELECT 
    'Active Connections' as metric,
    count(*)::TEXT as value,
    'Current active connections' as description
FROM pg_stat_activity
WHERE state = 'active';

-- 14. Create backup alerting function
CREATE OR REPLACE FUNCTION check_backup_alerts()
RETURNS TABLE(
    alert_level TEXT,
    alert_message TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    -- Check for failed archives
    IF (SELECT failed_count FROM pg_stat_archiver) > 0 THEN
        RETURN QUERY
        SELECT 
            'CRITICAL'::TEXT,
            'WAL archiving failures detected'::TEXT,
            'Check archive_command and disk space'::TEXT;
    END IF;
    
    -- Check for old last archive time
    IF (SELECT last_archived_time FROM pg_stat_archiver) < now() - interval '1 hour' THEN
        RETURN QUERY
        SELECT 
            'WARNING'::TEXT,
            'WAL archiving appears stalled'::TEXT,
            'Check archive_command and archive directory'::TEXT;
    END IF;
    
    -- Check database size
    IF pg_database_size('spark_trading') > 10000000000 THEN -- 10GB
        RETURN QUERY
        SELECT 
            'INFO'::TEXT,
            'Database size is large'::TEXT,
            'Consider more frequent base backups'::TEXT;
    END IF;
    
    -- Check for long-running queries
    IF (SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '10 minutes') > 0 THEN
        RETURN QUERY
        SELECT 
            'WARNING'::TEXT,
            'Long-running queries detected'::TEXT,
            'Monitor query performance'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 15. Grant permissions
GRANT SELECT ON backup_status TO backup_user;
GRANT SELECT ON backup_dashboard TO backup_user;
GRANT EXECUTE ON FUNCTION verify_backup_integrity() TO backup_user;
GRANT EXECUTE ON FUNCTION get_restore_commands(TIMESTAMP) TO backup_user;
GRANT EXECUTE ON FUNCTION check_backup_alerts() TO backup_user;

-- 16. Create backup status check
SELECT 'PITR Setup Complete' as status;
SELECT * FROM backup_status;
SELECT * FROM backup_dashboard;
SELECT * FROM check_backup_alerts();
