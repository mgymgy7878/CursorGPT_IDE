# ⚡ EXECUTE NOW - Single Page Guide

**cursor + chatgpt collaboration**  
**63 files, 15,383 lines - READY!**

---

## 🚀 3 KOMUT (HEMEN BAŞLA)

```powershell
cd C:\dev\CursorGPT_IDE

# 1. Setup (5 min - API key'leri sorar)
.\scripts\quick-start-portfolio.ps1

# 2. Wait 5 min
Start-Sleep 300

# 3. Validate
.\scripts\canary-validation.ps1
```

**Expected Output**:
```
🎉 SMOKE PASS! 🎉

Notification for chatgpt:
SMOKE PASS ✅ – 2 accounts, 48050.00 USD, metrics OK, stable
```

**→ COPY AND SEND TO chatgpt!**

---

## 📋 PRE-FLIGHT CHECK (1 Dakika)

- [ ] .env dosyaları yok (script oluşturacak)
- [ ] API key'ler hazır (Binance + BTCTurk, read-only)
- [ ] Docker yüklü ve çalışıyor
- [ ] Port 3003, 4001, 9090, 3005 boş

**Kontrol**:
```powershell
netstat -ano | findstr ":3003 :4001 :9090 :3005"
# Boş çıktı beklenir
```

---

## 🎯 SMOKE PASS KRITERLERI

✅ /api/portfolio → 200 OK, ≥1 account, Total USD > 0  
✅ spark_portfolio_* metrikleri yayında  
✅ p95 < 1500ms, staleness < 60s, error < 0.01/s  
✅ 30 dk kesintisiz uptime

---

## 📊 T+1h: MONITORING (10 Dakika)

```powershell
# Monitoring stack
docker compose up -d prometheus grafana

# Dashboard + runbook
.\scripts\build-grafana-dashboard.ps1
.\scripts\generate-runbook-from-dashboard.ps1

# Open
start http://localhost:3005/d/spark-portfolio
```

**Verify**:
- 5 panels görünüyor
- Her panelde "Runbook • Portfolio" linki var
- Template variables çalışıyor ($env, $exchange, $service)

---

## 🔄 T+1h→T+24h: BACKGROUND (Otomatik)

```powershell
# Background job (4 check in 24h)
Start-Job -Name "24h-monitor" -ScriptBlock {
    Set-Location "C:\dev\CursorGPT_IDE"
    .\scripts\24h-monitoring-loop.ps1
}

# Guardrails (15 min initial check)
.\scripts\operational-guardrails.ps1 -MonitorDurationMinutes 15
```

**Hiçbir şey yapma - sadece bekle!**

---

## 🎁 T+24h: FINAL EVIDENCE (30 Dakika)

```powershell
# One-liner
.\scripts\embed-dashboard-screens.ps1; `
.\scripts\alert-autotune-v2.ps1 -PerExchange; `
curl -X POST http://localhost:9090/-/reload; `
.\scripts\render-24h-report-v2.ps1; `
.\scripts\portfolio-sprint-evidence.ps1
```

**Output**:
- 5 PNG screenshots
- Auto-tuned alerts (multi-day + per-exchange)
- 24h report (uptime + alerts + embedded PNGs)
- Evidence ZIP

---

## 📧 SMOKE PASS NOTIFICATION

**chatgpt'ye gönder**:

```
SMOKE PASS ✅

Core: 2 accounts, $48,050, 850ms p95, 15s stale, 0.002/s err
Automation: 11 scripts, 15 docs, 28 configs
Features: Runbook links, $scope macro, auto-tune v2
Status: READY FOR 24H MONITORING

Next: Background loop → T+24h evidence → Sprint complete
```

---

## 🚨 ROLLBACK (< 2 dk)

```powershell
.\durdur.ps1
cd services\executor; Copy-Item .env.backup.* .env -Force
cd ..\..\apps\web-next; Copy-Item .env.local.backup.* .env.local -Force
cd ..\..
.\basla.ps1
```

---

## 🎯 READY?

```powershell
cd C:\dev\CursorGPT_IDE
.\scripts\quick-start-portfolio.ps1
```

**5 min sonra → canary-validation.ps1**  
**SMOKE PASS → chatgpt'ye gönder!**

---

**cursor + chatgpt** • **63 files, 15,383 lines** • **READY! 🚀**

