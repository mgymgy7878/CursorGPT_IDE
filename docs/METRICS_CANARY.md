# D2 SMOKE / Metrics Canary

**Amaç:** UI'nin canlı veri akışı ve tazelik (staleness) sağlığını 4 sn aralıklı iki ölçümle kanıtlamak.

**Tarih:** 2025-10-25  
**Durum:** Production Ready

---

## 📊 Metrikler

### Counters
- **`spark_ws_btcturk_msgs_total`** → WebSocket mesaj sayacı (BTCTurk feed)
  - **REAL mode:** 4 sn delta ≥ 1 (aktif feed)
  - **MOCK mode:** 4 sn delta = 0 (mock data)

- **`ui_msgs_total`** → UI tarafı mesaj sayacı (mock/real)
  - Her iki modda da artış gösterir

### Gauges
- **`spark_ws_staleness_seconds`** → Son mesajdan bu yana geçen süre
  - **Threshold:** < 4 sn (healthy)
  - **Warning:** 4-60 sn (degraded)
  - **Critical:** > 60 sn (stale)

- **`p95_ms`** → API latency (95th percentile)
  - **Target:** < 100 ms

---

## 🚀 Kullanım

### Lokal Test
```powershell
# Default (port 3003, 3004, 4 sn wait)
pwsh scripts/d2-smoke-check.ps1

# Custom ports ve wait time
pwsh scripts/d2-smoke-check.ps1 -Ports 3003,3005 -WaitSeconds 5
```

### CI/CD
```yaml
# .github/workflows/ui-smoke-test.yml
- name: D2 SMOKE Check
  run: pwsh scripts/d2-smoke-check.ps1
```

---

## 📋 Beklenen Çıktı

### Mock Mode (Development)
```
port: 3003
msgs_total delta: 0
staleness s: 0.549
SMOKE: ATTENTION
```

**Açıklama:** Mock mode'da `msgs_total` delta=0 **normaldir** çünkü gerçek feed yok. Staleness fresh olduğu sürece ✅.

---

### Real Mode (Production)
```
port: 3003
msgs_total delta: 12
staleness s: 2.1
SMOKE: PASS
```

**Açıklama:** Real BTCTurk feed aktif, 4 saniyede ≥1 mesaj alınıyor, staleness < 4 sn.

---

## 🎯 Pass/Fail Kriterleri

| Kriter | Threshold | Mock | Real |
|--------|-----------|------|------|
| **Delta (4s)** | ≥ 1 msg | 0 (OK) | ≥ 1 (PASS) |
| **Staleness** | < 4 sn | < 1 sn (PASS) | < 4 sn (PASS) |
| **Sonuç** | - | ATTENTION (OK) | PASS |

**Not:** Mock mode'da "ATTENTION" çıktısı **beklenen** davranıştır ve sorun değildir.

---

## 🔍 Troubleshooting

### ❌ Endpoint Down
```
endpoint down
Exit code: 1
```

**Çözüm:**
```powershell
# Dev server başlat
pnpm --filter web-next dev

# Port kontrolü
Get-NetTCPConnection -LocalPort 3003 -State Listen
```

---

### ⚠️ High Staleness (Real mode)
```
staleness s: 65.2
SMOKE: ATTENTION
```

**Çözüm:**
1. WebSocket reconnect kontrol et: `$m2.counters.spark_ws_btcturk_reconnects_total`
2. Backend executor durumu: `pnpm --filter @spark/executor dev`
3. Network connectivity kontrol et

---

### 🟡 Zero Delta (Real mode)
```
msgs_total delta: 0
SMOKE: ATTENTION
```

**Olası Sebepler:**
- Feed paused (UI'da pause toggle aktif)
- Backend executor kapalı
- BTCTurk API rate limit

**Çözüm:**
```powershell
# Pause durumu kontrol et
curl http://127.0.0.1:3003/api/market/status

# Executor logs
pnpm --filter @spark/executor dev
```

---

## 📚 İlgili Dökümanlar

- `WEB_VS_ELECTRON_ISSUES.md` — Mock vs. Real mode açıklaması
- `docs/FEATURES.md` — WebSocket özellikleri
- `docs/ARCHITECTURE.md` — İki ajanlı mimari
- `.github/workflows/ui-smoke-test.yml` — CI workflow

---

## 🎯 Next Steps

1. **Mock → Real geçiş:**
   ```bash
   # .env.local'i real mode'a çevir
   NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
   
   # Backend executor başlat
   pnpm --filter @spark/executor dev
   
   # D2 SMOKE tekrar çalıştır (PASS beklenir)
   pwsh scripts/d2-smoke-check.ps1
   ```

2. **Grafana Dashboard:**
   - `spark_ws_staleness_seconds` gauge ekle
   - Alert rule: staleness > 60s
   - Histogram: `msgs_total` rate

3. **Automated Monitoring:**
   - Cron job (5 dakikada bir)
   - Slack notification (ATTENTION/FAIL durumunda)
   - PagerDuty integration

---

**Son Güncelleme:** 2025-10-25  
**Maintainer:** Spark Eng (Platform)  
**Status:** Stable
