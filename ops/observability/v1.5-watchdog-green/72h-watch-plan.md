# 72 Saatlik Gözetim Planı - Production Lock v1.5

## Gece-Gündüz Açık Net Sınırlar

### Alarm Hijyeni (0-24h)
- **False-positive = 0 tolerans**: Hiçbir yanlış alarm kabul edilmez
- **Flappy durumlar**: Birden fazla "down/up" durumunda root-cause etiketle
- **Alert correlation**: İlişkili alarmları grupla ve tek seferde çöz

### SLO Devriyeleri (24-48h)
- **Exec P95 ≤ 60s**: Execution time 95. percentile
- **Stall Rate ≤ 0.02**: Stall oranı %2 altında
- **Failure Rate (10m) ≤ 0.2**: 10 dakikalık pencerede %0.2 altında
- **Predictive 24h ∈ [0–3]**: 24 saatte 0-3 predictive alert

### Confidence Monitoring (48-72h)
- **7g median ≥ 0.85**: 7 günlük median confidence score
- **ConfidenceDrops otomatik tetik**: 0.6 altına düşerse
- **Runbook linki**: Otomatik incident response

### Abort Koşulları (Kritik)
- **Ardışık 2 saatte 2+ predictive breach**: Risk gate "high" moduna geç
- **Strateji pause 15m**: Otomatik strateji duraklatma
- **Manual intervention**: Platform team müdahalesi gerekli

## Risk Sinyali Yayın Akışı

### Signal Fusion Integration
- **Confidence Score → Risk Scoring**: 0-100 risk skoru
- **Predictive Alerts → Strategy Triggers**: Otomatik strateji tetikleyicileri
- **Exec P95 → Performance Gates**: Performans kapıları

### Strateji Tetikleyicileri
- **Pause**: Risk skoru > 80 → Strateji duraklat
- **Limit**: Risk skoru > 60 → Pozisyon limitleri
- **Resume**: Risk skoru < 40 → Normal operasyon

### Otomatik Karar Verme
- **Risk Gate "High"**: 2+ predictive breach → 15m pause
- **Risk Gate "Medium"**: 1 predictive breach → Limit mode
- **Risk Gate "Low"**: Normal operasyon → Full strategy

## Monitoring Checklist

### Hourly Checks
- [ ] Self-check heartbeat çalışıyor
- [ ] Metrics endpoint erişilebilir
- [ ] Confidence score stabil
- [ ] Predictive alerts normal aralıkta

### Daily Checks
- [ ] Daily report oluşturuldu
- [ ] Evidence rotation çalışıyor
- [ ] SLO targets karşılanıyor
- [ ] Alert hygiene temiz

### Weekly Checks
- [ ] Confidence trend analizi
- [ ] Threshold drift kontrolü
- [ ] Automation coverage review
- [ ] Performance optimization

## Abort Conditions & Escalation

### Immediate Abort (0-15 min)
- **RunnerMetricsDown**: Executor metrics down
- **Confidence Score < 0.5**: Kritik güven düşüşü
- **2+ Predictive Breach**: Ardışık predictive alerts

### Escalation Matrix
1. **Level 1**: Platform Team (0-15 min)
2. **Level 2**: DevOps Engineer (15-30 min)
3. **Level 3**: CTO (30+ min)

### Recovery Procedures
- **Executor Restart**: Service restart
- **Prometheus Reload**: Config reload
- **GREEN Validation**: 6/6 test suite
- **Strategy Resume**: Risk skoru < 40
