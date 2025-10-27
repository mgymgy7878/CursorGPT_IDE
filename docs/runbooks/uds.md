# UDS Runbook (Futures UserDataStream)

## Amaç
Binance Futures UDS create/keepalive/close yaşam döngüsünü izlemek ve aksaklıkları gidermek.

## Sinyaller
- Metric: `futures_uds_last_keepalive_ts` (epoch)
- Sayaç: `futures_uds_lifecycle_total{action=...}`
- Alert: **UDSKeepaliveMiss** — `time() - futures_uds_last_keepalive_ts > 2100` (≈35dk)

## Operasyon
1. **Durum**: `/api/public/metrics` → metrikte son keepalive epoch artıyor mu?
2. **Manuel Keepalive**: `PUT /api/futures/userDataStream {listenKey}` (Ops panelinden de tetiklenebilir).
3. **Yeniden Kur**: `DELETE` ardından `POST` ile yeni listenKey oluştur.
4. **WS Sağlık**: executor log’da `connected/reconnected/backoff` satırları; ilk mesaj <5 sn, max backoff <30 sn.

## Triage
- **Alert aktif** → Keepalive gelmiyor:
  - Ağ/cred hatası? Executor error log kontrol.
  - ListenKey expired? DELETE→POST döngüsü.
  - Ratelimit? Kısa süreli backoff, otomatik retry.

## İyileştirme
- Keepalive interval 30dk; watchdog alarmı sürdürülebilir.
- Grafana paneli: “Last Keepalive Age (s)” ve lifecycle rate.
