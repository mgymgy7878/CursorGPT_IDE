# Database Restore Runbook

## Detection → Impact → Mitigation → Verification → Rollback

### 🚨 DETECTION

**Automated Alerts:**
- Database connection failures > 5 in 1 minute
- WAL archiving failures > 3 in 10 minutes  
- Database size growth > 50% in 1 hour
- Long-running queries > 10 minutes

**Manual Detection:**
- Application errors: "Database connection failed"
- Monitoring dashboard: Red status indicators
- Log analysis: PostgreSQL error patterns

### 📊 IMPACT ASSESSMENT

**Severity Levels:**
- **P0 (Critical):** Complete database unavailability
- **P1 (High):** Partial functionality loss, performance degradation
- **P2 (Medium):** Data inconsistency, audit trail issues
- **P3 (Low):** Monitoring gaps, reporting delays

**Business Impact:**
- Trading operations halted
- User authentication failures
- Audit compliance violations
- Financial reporting delays

### 🔧 MITIGATION STEPS

#### Step 1: Immediate Response (0-5 minutes)

```bash
# 1. Check database status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT 1"

# 2. Check connection pool
sudo systemctl status pgbouncer
sudo -u postgres psql -h localhost -p 6432 -c "SHOW POOLS"

# 3. Check disk space
df -h /var/lib/postgresql
df -h /var/lib/postgresql/archive

# 4. Check WAL archiving
sudo -u postgres psql -c "SELECT * FROM pg_stat_archiver"
```

#### Step 2: Data Recovery (5-30 minutes)

**For Point-in-Time Recovery:**

```bash
# 1. Stop application services
sudo systemctl stop spark-trading-api
sudo systemctl stop spark-trading-web

# 2. Stop PostgreSQL
sudo systemctl stop postgresql

# 3. Backup current data (if recoverable)
sudo cp -r /var/lib/postgresql/data /var/lib/postgresql/data.backup.$(date +%Y%m%d_%H%M%S)

# 4. Restore from backup
sudo rm -rf /var/lib/postgresql/data/*
sudo -u postgres pg_basebackup -D /var/lib/postgresql/data -Ft -z -P

# 5. Configure recovery
sudo -u postgres tee -a /var/lib/postgresql/data/postgresql.conf << EOF
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_time = '2024-10-24 14:30:00'
EOF

# 6. Create recovery signal
sudo touch /var/lib/postgresql/data/recovery.signal

# 7. Start PostgreSQL
sudo systemctl start postgresql

# 8. Monitor recovery
sudo tail -f /var/log/postgresql/postgresql.log
```

**For Full Database Restore:**

```bash
# 1. Stop services
sudo systemctl stop spark-trading-api
sudo systemctl stop postgresql

# 2. Restore from latest backup
sudo rm -rf /var/lib/postgresql/data/*
sudo tar -xzf /backup/postgresql-$(date +%Y%m%d).tar.gz -C /var/lib/postgresql/

# 3. Start PostgreSQL
sudo systemctl start postgresql

# 4. Verify data integrity
sudo -u postgres psql -c "SELECT count(*) FROM \"Position\""
sudo -u postgres psql -c "SELECT count(*) FROM \"Order\""
```

#### Step 3: Application Recovery (30-60 minutes)

```bash
# 1. Start application services
sudo systemctl start spark-trading-api
sudo systemctl start spark-trading-web

# 2. Verify API endpoints
curl -f http://localhost:4001/api/healthz
curl -f http://localhost:3003/api/healthz

# 3. Check database connections
curl -f http://localhost:4001/api/public/metrics.prom | grep database

# 4. Verify trading functionality
curl -X POST http://localhost:4001/api/strategies/list
```

### ✅ VERIFICATION

**Automated Checks:**
```bash
# 1. Database connectivity
sudo -u postgres psql -c "SELECT 'Database OK' as status"

# 2. Application health
curl -f http://localhost:4001/api/healthz
curl -f http://localhost:3003/api/healthz

# 3. Data integrity
sudo -u postgres psql -c "SELECT count(*) FROM \"Position\""
sudo -u postgres psql -c "SELECT count(*) FROM \"Order\""

# 4. Performance metrics
curl -s http://localhost:4001/api/public/metrics.prom | grep -E "(database|connection|query)"
```

**Manual Verification:**
- [ ] User login works
- [ ] Trading dashboard loads
- [ ] Order placement functions
- [ ] Portfolio data displays
- [ ] Audit logs are complete

### 🔄 ROLLBACK PROCEDURES

**If Recovery Fails:**

```bash
# 1. Stop all services
sudo systemctl stop spark-trading-api
sudo systemctl stop spark-trading-web
sudo systemctl stop postgresql

# 2. Restore from backup
sudo rm -rf /var/lib/postgresql/data/*
sudo cp -r /var/lib/postgresql/data.backup.$(date +%Y%m%d_%H%M%S) /var/lib/postgresql/data

# 3. Start PostgreSQL
sudo systemctl start postgresql

# 4. Verify basic functionality
sudo -u postgres psql -c "SELECT 1"

# 5. Start application services
sudo systemctl start spark-trading-api
sudo systemctl start spark-trading-web
```

**If Data Corruption Detected:**

```bash
# 1. Stop all services immediately
sudo systemctl stop spark-trading-api
sudo systemctl stop spark-trading-web
sudo systemctl stop postgresql

# 2. Restore from last known good backup
sudo rm -rf /var/lib/postgresql/data/*
sudo tar -xzf /backup/postgresql-$(date +%Y%m%d).tar.gz -C /var/lib/postgresql/

# 3. Start PostgreSQL
sudo systemctl start postgresql

# 4. Run data integrity checks
sudo -u postgres psql -c "SELECT * FROM verify_backup_integrity()"

# 5. Start application services
sudo systemctl start spark-trading-api
sudo systemctl start spark-trading-web
```

### 📋 POST-RECOVERY CHECKLIST

**Immediate (0-1 hour):**
- [ ] All services running
- [ ] Database connectivity restored
- [ ] Application endpoints responding
- [ ] User authentication working
- [ ] Trading functionality operational

**Short-term (1-24 hours):**
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify audit logs
- [ ] Test backup procedures
- [ ] Update monitoring alerts

**Long-term (1-7 days):**
- [ ] Root cause analysis
- [ ] Update runbook procedures
- [ ] Improve monitoring
- [ ] Test disaster recovery
- [ ] Update documentation

### 🚨 EMERGENCY CONTACTS

**Primary:**
- Database Admin: +90-XXX-XXX-XXXX
- DevOps Lead: +90-XXX-XXX-XXXX

**Secondary:**
- CTO: +90-XXX-XXX-XXXX
- Security Team: +90-XXX-XXX-XXXX

**Escalation:**
- If not resolved in 30 minutes
- If data loss is suspected
- If security breach is possible

### 📊 MONITORING DASHBOARD

**Key Metrics to Watch:**
- Database connection count
- Query response times
- WAL archiving status
- Disk space usage
- Error rates
- User activity

**Alert Thresholds:**
- Connection failures > 5/minute
- Query time > 5 seconds
- Disk usage > 80%
- Error rate > 1%

### 🔍 TROUBLESHOOTING GUIDE

**Common Issues:**

1. **"Database connection failed"**
   - Check PostgreSQL status
   - Verify connection pool
   - Check network connectivity

2. **"WAL archiving failures"**
   - Check archive directory permissions
   - Verify disk space
   - Check archive command

3. **"Long-running queries"**
   - Check query performance
   - Verify indexes
   - Check for locks

4. **"Data inconsistency"**
   - Run integrity checks
   - Verify backup procedures
   - Check transaction logs

### 📚 REFERENCES

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgBouncer Configuration](https://www.pgbouncer.org/config.html)
- [Backup and Recovery](https://www.postgresql.org/docs/current/backup.html)
- [Point-in-Time Recovery](https://www.postgresql.org/docs/current/continuous-archiving.html)
