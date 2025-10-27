# Alert Review Notları (7g)

- Precision Miss Rate:
  - Hedef: ≈0
  - Panel: `Precision Miss Rate (5m)` (Grafana dashboard `ops/grafana/dashboards/spark-core.json`)
  - Aksiyon: Miss görülürse fixture/precision registry güncellemesi ve ingest akışı doğrulaması

- Order Rejects:
  - Hedef: Düşüş trendi
  - Panel: `Order Hygiene`
  - Aksiyon: Rounding ve minQty kontrolleri, risk guard ayarlarının gözden geçirilmesi 