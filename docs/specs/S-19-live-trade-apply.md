# S-19 — /canary/live-trade.apply (ONAY GEREKİR)

## Amaç
Plan-only kapıdan gerçek emir akışına geçiş için güvenlik kapıları:
- Thresholds OK, token, RBAC=admin, kill-switch=off, minNotional≥X, shadow→tiny-live.
- `confirm_required=true`; audit trail + evidence.

## Rota
POST /canary/live-trade.apply

Headers: `x-confirm-token`, `x-user-role`

Body:
```json
{ "nonce": "...", "symbol": "BTCUSDT", "qty": 0.00005, "side": "BUY", "allowLive": true }
```

## Davranış
1) Gates check (plan/latency’den).
2) Policy check (token, RBAC, kill-switch, minNotional).
3) Eğer accepted:
   - Shadow önce (opsiyonel), sonra tiny-live tek market emri (binance testnet).
   - Evidence: `live_apply.json` (request, checks, order ack, ws fill).
4) Hata → BLOCK + reason.

## Onay
- `confirm_required=true`; UI’da “Tiny Live (ONAY)” modalı → ‘Uygula’ basılınca isteği gönderir.

## Notlar
- Testnet-only, kill-switch bağlı.
- Rollback planı: başarısızlıkta `cancel_all` + evidence kaydı. 