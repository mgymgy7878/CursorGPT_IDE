# SMOKE PASS NOTIFICATION - Template

**chatgpt'ye gönderilecek format**

---

## 📧 NOTIFICATION FORMAT

```
SMOKE PASS ✅

Core Metrics:
- Accounts: {X} (binance, btcturk)
- Total USD: ${Y}
- Latency p95: {Z}ms
- Staleness: {S}s
- Error rate: {E}/s
- Uptime: {M} dk stabil

Enterprise Features:
✓ 11 automation scripts
✓ 16 documentation files
✓ 28 configuration files
✓ 64 total files, 15,683 lines
✓ Runbook links (per panel)
✓ Combined filter macro ($scope)
✓ One-click doc generator
✓ Auto-fix action matrix
✓ Multi-day alert tuning
✓ Per-exchange thresholds

Evidence:
- Canary validation: evidence/portfolio/canary_{timestamp}.zip
- Dashboard: monitoring/grafana/dashboards/spark-portfolio.dashboard.json
- Alerts: prometheus/alerts/spark-portfolio-tuned.rules.yml

Status: READY FOR 24H MONITORING

İstek:
- Tooltip + annotation + Today vs Yesterday + alert timeline kurulumunu uygula.
```

---

## 📊 EXAMPLE (Filled)

```
SMOKE PASS ✅

Core Metrics:
- Accounts: 2 (binance, btcturk)
- Total USD: $48,050.00
- Latency p95: 850ms
- Staleness: 15s
- Error rate: 0.0020/s
- Uptime: 30 dk stabil

Enterprise Features:
✓ 11 automation scripts
✓ 16 documentation files
✓ 28 configuration files
✓ 64 total files, 15,683 lines
✓ Runbook links (per panel)
✓ Combined filter macro ($scope)
✓ One-click doc generator
✓ Auto-fix action matrix
✓ Multi-day alert tuning
✓ Per-exchange thresholds

Evidence:
- Canary validation: evidence/portfolio/canary_20251010_234530.zip
- Dashboard: monitoring/grafana/dashboards/spark-portfolio.dashboard.json
- Alerts: prometheus/alerts/spark-portfolio-tuned.rules.yml

Status: READY FOR 24H MONITORING

İstek:
- Tooltip + annotation + Today vs Yesterday + alert timeline kurulumunu uygula.
```

---

## 🎯 chatgpt'NİN CEVABI

chatgpt ekleyecek:
1. **Panel tooltip ipuçları** (inline runbook özetleri)
2. **Global annotation queries** (alert timeline overlay)
3. **"Today vs Yesterday" karşılaştırma panelleri**
4. **Alert geçmiş mini zaman çizelgesi paneli**

---

## 📋 VALUES TO FILL

**From canary-validation.ps1 output**:
- `{X}` - Account count (usually 2)
- `{Y}` - Total USD value
- `{Z}` - Latency p95 in ms
- `{S}` - Staleness in seconds
- `{E}` - Error rate (/s)
- `{M}` - Uptime in minutes (usually 30)
- `{timestamp}` - Timestamp from evidence directory name

**Script automatically provides these in output!**

---

**cursor + chatgpt** • **Ready to send!** 📧

