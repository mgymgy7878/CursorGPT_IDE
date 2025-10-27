# Spark Trading Platform v0.2.0 — Paper Trading MVP

## Öne Çıkanlar
- Paper broker ve /api/paper/* rotaları
- Exchange toggle (mock↔binance) + dayanıklı adapter
- Prometheus metrikleri (spark_exchange_*, spark_paper_*)
- Control ve Portföy UI entegrasyonu
- RSI strategy entegrasyonu
- Mock feed simülasyonu

## Kanıtlar
- reality: runtime/reality_codes.txt, runtime/reality_bodies.log
- exchange: runtime/exchange_real_smoke.log
- paper demo: runtime/paper_demo.log
- smoke test: runtime/paper_smoke.cmd

## Yükseltme
1) pnpm -w install
2) runtime\start_executor_real.cmd & runtime\exchange_real_smoke.cmd
3) runtime\paper_trade_demo.cmd (opsiyonel)

## Bilinen Notlar
- CI mock modda çalışır (EXCHANGE_MODE=mock)
- Windows ortamında PowerShell kaçışları için CMD scriptleri sağlandı
- Paper trading offline-safe (mock feed ile tam çalışır)

## Teknik Detaylar
- @spark/paper-broker paketi oluşturuldu
- Executor /api/paper/* rotaları aktif
- UI: Control, Portföy, Gözlem sayfaları güncellendi
- Metrikler: spark_paper_* Prometheus gauge/counter'ları
- Demo: 30s otomatik trading simülasyonu 