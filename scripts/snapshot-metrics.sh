#!/bin/bash
# Metrics Snapshot Script
# Captures comprehensive metrics snapshot for evidence collection

set -e

STAGE=${1:-"unknown"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EVIDENCE_DIR="evidence"

mkdir -p "$EVIDENCE_DIR"

echo "═══════════════════════════════════════════════════════"
echo "  📊 METRICS SNAPSHOT - Stage: $STAGE"
echo "═══════════════════════════════════════════════════════"
echo ""

# 1. Prometheus metrics
echo "1/7: Capturing Prometheus metrics..."
curl -s http://localhost:4001/api/public/metrics.prom > "$EVIDENCE_DIR/rollout_stage_${STAGE}_${TIMESTAMP}.txt"
echo "✅ Prometheus metrics saved"

# 2. Database health
echo "2/7: Capturing database health..."
psql "$DATABASE_URL" -c "SELECT * FROM backup_dashboard;" > "$EVIDENCE_DIR/db_health_stage_${STAGE}_${TIMESTAMP}.txt" 2>&1 || echo "⚠️  Database not available"

# 3. pgBouncer stats
echo "3/7: Capturing pgBouncer stats..."
psql "postgresql://localhost:6432/spark_trading" -c "SHOW POOLS; SHOW STATS;" > "$EVIDENCE_DIR/pgbouncer_stage_${STAGE}_${TIMESTAMP}.txt" 2>&1 || echo "⚠️  pgBouncer not available"

# 4. Application logs (last 100 lines)
echo "4/7: Capturing application logs..."
if [ -f "/var/log/spark-trading/api.log" ]; then
    tail -n 100 /var/log/spark-trading/api.log > "$EVIDENCE_DIR/logs_stage_${STAGE}_${TIMESTAMP}.txt"
else
    docker-compose logs --tail=100 api > "$EVIDENCE_DIR/logs_stage_${STAGE}_${TIMESTAMP}.txt" 2>&1 || echo "⚠️  Logs not available"
fi
echo "✅ Logs captured"

# 5. Resource usage
echo "5/7: Capturing resource usage..."
{
    echo "=== CPU Usage ==="
    top -bn1 | head -n 5
    echo ""
    echo "=== Memory Usage ==="
    free -h
    echo ""
    echo "=== Disk Usage ==="
    df -h
    echo ""
    echo "=== Network Connections ==="
    netstat -an | grep ESTABLISHED | wc -l
} > "$EVIDENCE_DIR/resources_stage_${STAGE}_${TIMESTAMP}.txt"
echo "✅ Resource usage captured"

# 6. Key metrics summary
echo "6/7: Generating metrics summary..."
{
    echo "METRICS SUMMARY - Stage $STAGE"
    echo "Timestamp: $(date -u)"
    echo "========================================"
    echo ""
    
    # Extract key metrics
    echo "### API Latency (P95) ###"
    curl -s http://localhost:4001/api/public/metrics.prom | grep -A5 "http_request_duration_seconds" | head -n 10
    echo ""
    
    echo "### Error Rate ###"
    curl -s http://localhost:4001/api/public/metrics.prom | grep "http_requests_total" | grep "status=\"5"
    echo ""
    
    echo "### Database Connections ###"
    curl -s http://localhost:4001/api/public/metrics.prom | grep "database_connections"
    echo ""
    
    echo "### Idempotency ###"
    curl -s http://localhost:4001/api/public/metrics.prom | grep "idempotency"
    echo ""
    
    echo "### Risk Blocks ###"
    curl -s http://localhost:4001/api/public/metrics.prom | grep "spark_risk_block_total"
    echo ""
} > "$EVIDENCE_DIR/summary_stage_${STAGE}_${TIMESTAMP}.txt"
echo "✅ Summary generated"

# 7. CI/CD status
echo "7/7: Capturing CI/CD status..."
if command -v gh &> /dev/null; then
    gh run list --limit 5 > "$EVIDENCE_DIR/ci_stage_${STAGE}_${TIMESTAMP}.txt" 2>&1 || echo "⚠️  GitHub CLI not available"
else
    echo "⚠️  GitHub CLI not installed"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ SNAPSHOT COMPLETE"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Evidence files created:"
ls -lh "$EVIDENCE_DIR"/*_${TIMESTAMP}.txt
echo ""
echo "📊 Summary available at: $EVIDENCE_DIR/summary_stage_${STAGE}_${TIMESTAMP}.txt"
echo ""
