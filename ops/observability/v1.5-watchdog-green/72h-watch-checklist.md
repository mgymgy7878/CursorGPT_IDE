# 72 Saatlik Watch Checklist

## Critical Monitoring (0-24h)
- [ ] **RunnerMetricsDown alert** tetiklenmiyor (yanlış pozitif yok)
- [ ] **Confidence score median** ≥ 0.85
- [ ] **Predictive alerts 24h** artışı beklenen aralıkta (0–3)
- [ ] **Exec p95** ≤ 60s
- [ ] **Failure rate (10m)** ≤ 0.2

## System Health (24-48h)
- [ ] **Daily report ZIP** ve manifest arşivde (14g rotasyon işliyor)
- [ ] **Evidence collection** düzenli çalışıyor
- [ ] **Self-check heartbeat** her saat çalışıyor
- [ ] **Threshold drift** normal aralıkta
- [ ] **Memory patterns** analizi çalışıyor

## Production Stability (48-72h)
- [ ] **No false positives** in alerting
- [ ] **Confidence score** stabil (drift < 0.1)
- [ ] **Predictive accuracy** > 80%
- [ ] **Executor uptime** > 99.9%
- [ ] **Evidence rotation** 14 gün saklama aktif

## Alert Hygiene Check
- [ ] **RunnerMetricsDown**: Critical (5m for) - No false positives
- [ ] **PredictiveBreachSoon**: Warning (0m for) - Accurate predictions
- [ ] **ConfidenceDrops**: Warning (15m for) - Stable confidence

## Performance Metrics
- [ ] **P95 Execution Time**: ≤ 60s
- [ ] **Stall Rate**: ≤ 0.1%
- [ ] **Failure Rate**: ≤ 0.2%
- [ ] **Skip Rate**: ≤ 1%

## Evidence & Reporting
- [ ] **Daily Reports**: Generated and archived
- [ ] **Evidence Rotation**: 14-day retention active
- [ ] **Manifest Updates**: SHA256 hash validation
- [ ] **GREEN Validation**: 6/6 tests passing

## Automation Schedule
- [ ] **Hourly**: Self-check heartbeat
- [ ] **Daily**: Report generation + evidence collection
- [ ] **Weekly**: Confidence review + chaos testing
- [ ] **Monthly**: Deep analysis + optimization

## Signal Fusion Integration
- [ ] **Risk Scoring**: Confidence score → risk scoring
- [ ] **Strategy Automation**: Risk-skorlu devreye alma/durdurma
- [ ] **Model Fusion**: Top model entegrasyonu
- [ ] **Autonomous Decision Making**: Otonom karar verme sistemi

## Final Validation
- [ ] **All systems GREEN**: 6/6 validation tests
- [ ] **Production Lock**: Complete
- [ ] **Canary→Prod**: Approved
- [ ] **Autonomous NS**: Active and stable
