# DAY-8 Strategy Automation Pack - 48h Report Pipeline

## Amaç
48 saatlik otomatik performans raporu sistemi. Sistem durumunu, metriklerini ve PnL verilerini düzenli olarak toplar ve analiz eder.

## Çalıştırma

### Otomatik 48 Saatlik Rapor
```cmd
cd runtime
.\report_48h.cmd
```

### Tek Seferlik Hızlı Rapor
```cmd
cd runtime
.\report_once.cmd
```

### Manuel API Çağrıları
```bash
# Session başlat
curl -X POST http://127.0.0.1:4001/api/private/report/session \
  -H "Content-Type: application/json" -d "{}"

# Snapshot al
curl -X POST http://127.0.0.1:4001/api/private/report/snapshot

# Raporu finalize et
curl -X POST http://127.0.0.1:4001/api/private/report/finalize

# Son raporu oku
curl http://127.0.0.1:4001/api/private/report/latest
```

## Dosya Yapısı

```
runtime/reports/
├── rpt-2025-08-16T16-45-30-123Z/
│   ├── index.json          # Session bilgileri
│   ├── report.json         # Finalize edilmiş rapor
│   ├── report.csv          # CSV formatında veriler
│   └── snapshots/
│       ├── 1734444330123.json
│       ├── 1734444330124.json
│       └── ...
└── latest.json             # En son rapor özeti
```

## API Endpoints

### POST /api/private/report/session
Yeni rapor session'ı başlatır.

**Request:**
```json
{
  "id": "optional-custom-id"
}
```

**Response:**
```json
{
  "id": "rpt-2025-08-16T16-45-30-123Z",
  "dir": "runtime/reports/rpt-2025-08-16T16-45-30-123Z"
}
```

### POST /api/private/report/snapshot
Mevcut session için snapshot alır.

**Response:**
```json
{
  "id": "rpt-2025-08-16T16-45-30-123Z",
  "wrote": "1734444330123.json"
}
```

### POST /api/private/report/finalize
Session'ı finalize eder ve rapor oluşturur.

**Response:**
```json
{
  "id": "rpt-2025-08-16T16-45-30-123Z",
  "startedAt": "2025-08-16T16:45:30.123Z",
  "endedAt": "2025-08-16T18:45:30.123Z",
  "samples": 8,
  "metrics": {
    "private_calls_total": 150,
    "private_errors_total": 2,
    "ws_disconnects_total": 0,
    "risk_breaches_total": 0,
    "twap_slices_total": 45,
    "avg_unrealized": 125.50,
    "avg_realized": 45.25,
    "max_unrealized": 250.00,
    "max_drawdown": -50.00
  },
  "ok": true
}
```

### GET /api/private/report/latest
En son raporu döner.

**Response:**
```json
{
  "id": "rpt-2025-08-16T16-45-30-123Z",
  "summary": {
    // finalize response ile aynı
  }
}
```

### GET /api/private/report/list
Tüm rapor ID'lerini listeler.

**Response:**
```json
{
  "items": [
    "rpt-2025-08-16T16-45-30-123Z",
    "rpt-2025-08-16T14-30-15-456Z"
  ]
}
```

### GET /api/private/report/:id
Belirli bir raporu döner.

**Response:**
```json
{
  // finalize response ile aynı
}
```

## Toplanan Veriler

### Snapshot İçeriği
Her snapshot şu verileri içerir:

- **PnL Summary**: Unrealized/Realized P&L
- **Positions**: Açık pozisyonlar
- **WebSocket Status**: Bağlantı durumu
- **Risk Rules**: Aktif risk kuralları
- **Symbols**: İşlem yapılan semboller
- **Metrics**: Prometheus metrikleri
  - `spark_private_calls_total`
  - `spark_private_errors_total`
  - `spark_twap_slice_sent_total`
  - `spark_ws_disconnects_total`
  - `spark_risk_breach_total`

### Rapor Metrikleri
Finalize edilmiş raporda:

- **Total Calls**: Toplam API çağrısı
- **Error Rate**: Hata oranı
- **WebSocket Stability**: Bağlantı kararlılığı
- **Risk Compliance**: Risk uyumluluğu
- **Performance**: P&L performansı
- **Drawdown**: Maksimum drawdown

## Konfigürasyon

### Environment Variables
```bash
# .env.local
REPORTS_DIR=runtime/reports
REPORT_INTERVAL_MIN=15
REPORT_DURATION_HOURS=48
REPORT_HTTP_BASE=http://127.0.0.1:4001
```

### 48 Saatlik Loop
- **Interval**: 15 dakika
- **Duration**: 48 saat (192 snapshot)
- **Total Size**: ~50MB (tahmini)

## Sık Hatalar

### 1. Metrics Endpoint Erişilemez
**Symptom:** Snapshot'ta metrics null
**Cause:** Prometheus endpoint down
**Solution:** Sistem sağlığını kontrol et

### 2. Private API Endpoints Down
**Symptom:** PnL/positions null
**Cause:** Private API servisleri çalışmıyor
**Solution:** Executor servisini yeniden başlat

### 3. Disk Space
**Symptom:** Write error
**Cause:** Disk dolu
**Solution:** Eski raporları temizle

### 4. Emergency Stop Aktif
**Symptom:** Düşük P&L değişimi
**Cause:** Emergency stop açık
**Solution:** Normal davranış, beklenen

## Monitoring

### Grafana Panelleri
- **Report Runs**: `increase(spark_report_runs_total[1h])`
- **Report Errors**: `increase(spark_report_errors_total[1h])`
- **Success Rate**: `1 - (rate(spark_report_errors_total[30m]) / clamp_min(rate(spark_report_runs_total[30m]),1e-9))`

### Health Checks
```bash
# Rapor servisi çalışıyor mu?
curl http://127.0.0.1:4001/api/private/report/latest

# Son rapor ne zaman?
ls -la runtime/reports/latest.json

# Disk kullanımı
du -sh runtime/reports/
```

## Troubleshooting

### Rapor Oluşturulmuyor
1. Executor servisini kontrol et
2. Disk space kontrol et
3. Log'ları incele
4. Manual snapshot test et

### Veri Eksik
1. Private API endpoints kontrol et
2. Prometheus metrics kontrol et
3. Network connectivity kontrol et
4. Emergency stop durumunu kontrol et

### Performance Issues
1. Snapshot frequency azalt
2. Disk I/O kontrol et
3. Memory usage kontrol et
4. Network latency kontrol et

## Best Practices

1. **Regular Cleanup**: Eski raporları düzenli temizle
2. **Monitoring**: Grafana panellerini aktif tut
3. **Backup**: Önemli raporları yedekle
4. **Testing**: Production öncesi test et
5. **Documentation**: Değişiklikleri dokümante et

## Emergency Procedures

### Acil Durum Stop
```bash
# Tüm raporlama durdur
pkill -f "report_48h.cmd"

# Emergency stop aktif
curl -X POST http://127.0.0.1:4001/api/signal/risk/emergency-stop \
  -H "Content-Type: application/json" -d '{"active":true}'
```

### Recovery
```bash
# Servisleri yeniden başlat
cd services/executor && pnpm dev

# Raporlama yeniden başlat
cd runtime && .\report_48h.cmd
```

## Changelog

### v1.0.0 (2025-08-16)
- İlk release
- 48h otomatik raporlama
- Crash-safe snapshot yazımı
- CSV ve JSON formatları
- UI integration
- Emergency stop uyumluluğu 