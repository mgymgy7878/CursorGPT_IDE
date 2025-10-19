# Strategy Control RFC (start / stop / pause)

**Amaç:** UI’daki “Çalışan Stratejiler” kartına **Start/Stop/Pause/Resume** butonları eklemek için gerekli en küçük backend API yüzeyini tanımlamak.

## Önerilen Executor Uçları

### 1) `/tools/strategy.control` (POST, **ONAY GEREKLİ**)
İstek:
```json
{ "action":"strategy.control",
  "params": { "name":"ema_crossover_v1", "op":"start|stop|pause|resume", "scope":"paper|live" },
  "dryRun": false,
  "confirm_required": true,
  "reason": "dashboard quick control"
}
```
Yanıt (örnek):
```json
{ "accepted": true, "auditId": "ctrl_2025-10-12_001", "status":"pending-approval" }
```

### 2) `/tools/strategy.preview` (POST, **ONAY GEREKMEZ**)
Dry-run; planı ve etki alanını özetler (kaç emir iptal/yer değiştirir vb.)
```json
{ "action":"strategy.preview",
  "params": { "name":"ema_crossover_v1", "op":"stop" },
  "dryRun": true, "confirm_required": false, "reason": "preflight"
}
```
Yanıt:
```json
{ "impact": { "orders_to_cancel": 3, "positions_to_close": 1 }, "duration_sec": 0.3 }
```

## UI Entegrasyonu (özet)
- Dashboard → “Çalışan Stratejiler” tablosunda her satıra **Start/Stop/Pause** ikonları.
- Tıklayınca: önce **preview** çağrısı (dry-run), ardından kullanıcıya onay modalı → **control** çağrısı (**confirm_required=true**, audit kaydı).
- Başarılı/başarısız durumda CopilotDock’a otomatik log gönderimi (öneri kartı).

## Güvenlik ve Audit
- RBAC: yalnız “trade:control” rolüne izin.
- Her çağrıda `reason`, istekçin `userId`, `ip`, `sessionId` gibi audit alanları zorunlu.
- MODEL_RISK/GATE açık ise kontrol çağrıları **yalnız öneri** üretir, uygulamaz.

> Not: Backend bu uçları sağladığında, UI patch’i  ~100 satır ek kodla hazır.
