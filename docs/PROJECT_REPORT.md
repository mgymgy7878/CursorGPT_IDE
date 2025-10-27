# Spark Trading Platform — Tam Teknik Rapor (2025-08-11)

## 1) Tam Teknik Mimari Özeti

- **Frontend (Next.js 14, TS 5)**: `apps/web-next/pages/*`, `apps/web-next/components/*`, Zustand store'lar `apps/web-next/stores/*`.
  - **Sayfalar**: `PortfoyYonetimi.tsx`, `Gozlem.tsx`, `Ayarlar.tsx`, `strategy-lab.tsx`.
  - **Bileşenler**: Strateji Lab modülleri (`components/StrategyLab/*`), grafikler (`BacktestChart.tsx`), tema ve kaydet/yükle barı.
- **Backend/API**: `apps/web-next/pages/api/**`
  - **Broker**: `/api/broker/{binance|bybit|okx}/positions|orders|balance|close|cancel|creds` → ilgili server adapter ve `services/*` REST imzalama katmanı.
  - **Metrics**: `/api/metrics` (JSON), `/api/metrics/stream` (SSE), `/api/metrics/prom` (Prometheus text).
  - **Portfolio**: `/api/portfolio/stream` (SSE, hub snapshot yayınlar).
  - **Logs**: `/api/logs/sse` (SSE; optimize/walkforward/supervisor olayları).
- **Server**: `apps/web-next/server/**`
  - **Hub**: `portfolioHub.ts` — Bybit/OKX WS bağlanır, snapshot üretir, diff bazlı publish kararı verir, metrikleri üretir.
  - **WS İstemcileri**: `ws/BybitWS.ts`, `ws/OKXWS.ts` — reconnect/backoff, orders/positions eventleri.
  - **Yardımcılar**: `util.ts` (withRetry, error budget), `log.ts` (renkli seviyeli log), `middleware.ts` (API key), `creds.ts` (dosya/env kimlik bilgileri).
- **Services**: `services/{BinanceService.ts,BybitService.ts,OKXService.ts}` — REST imzalama, temel emir/pozisyon/bakiye işlemleri, 429 ve hata yönetimi.

### Kritik Modüller ve Görevleri
- `apps/web-next/server/portfolioHub.ts`: WS mesajlarını normalize eder, cache ve diff kıyaslaması ile publish/skip kararını verir; metrik snapshot’ı üretir ve SSE abonelerine gönderir.
- `apps/web-next/pages/api/metrics/prom.ts`: `prom-client` ile default metrikler ve hub snapshot metriklerini Prometheus formatında döner (idempotent init; `globalThis`).
- `apps/web-next/pages/api/portfolio/stream.ts`: SSE başlıkları ve keep-alive ile hub snapshot’larını 1 Hz civarı yayınlar; `requireApiKey` koruması uygular.
- `apps/web-next/pages/api/logs/sse.ts`: Optimize/walkforward/supervisor olaylarını SSE ile yayınlar.
- `apps/web-next/server/ws/*`: Borsa özel WS bağlantıları (Bybit/OKX), auth ve subscribe, reconnect/backoff yönetimi.

### API/SSE/WS Akışları
- **WS (Private)** → `portfolioHub` → cache/snapshot → diff kontrolü → yayın sayacı (publish/skip) → **SSE**: UI’ye aktarım.
- **SSE Uçları**:
  - `/api/portfolio/stream`: snapshot JSON
  - `/api/metrics/stream`: 1 Hz metrik snapshot
  - `/api/logs/sse`: optimize/walkforward/supervisor olayları
- **Prometheus**: `/api/metrics/prom` — text exposition format.

### Telemetri / Prometheus Metrikleri
- Hub kaynaklı metrikler: `ws_connects_total{exchange}`, `ws_reconnects_total{exchange}`, `ws_disconnects_total{exchange}`, `publishes_total{type}`, `skips_total{type}`, `sse_clients`, `avg_ws_message_hz`, `last_message_timestamp_ms`, `last_message_delay_ms` ve EMA’ları, `error_budget_miss_count`, `error_budget_miss_rate_5m`, `ws_uptime_ratio`, `publish_skip_ratio`.
- `prom-client` default metrikleri eklenir. Response `text/plain; version=0.0.4` ve `no-store` cache başlıklarıyla gelir.

### Güvenlik ve Rate‑Limit
- **API Key**: `middleware.ts` → `DASH_API_KEY` env varsa `x-api-key` başlığı zorunlu; yoksa dev modda geçilir.
- **Rate‑limit/Retry**: `util.ts/withRetry` exponential backoff, 429 tespitinde `errorBudgetMissCount` artışı ve uyarı logları. `services/*` içinde 429 özel işleme ve hatalarda anlamlı mesajlar.
- **Kimlik Bilgileri**: Öncelik `.env` değerlerinde; yoksa `.secrets/{exchange}.json` (otomatik oluşturulur). İstemci tarafına sızdırılmaz.

## 2) Geliştirme Tarihçesi (Kronolojik Checklist)

### Tamamlananlar
- 2025-08-10: Strategy Lab iyileştirmeleri — `apps/web-next/pages/strategy-lab.tsx`, `components/StrategyLab/*`, optimize ilerleme ve Top‑N uygulanması.
- 2025-08-10: Metrics/SSE entegrasyonu — `/api/metrics`, `/api/metrics/stream`, `/api/metrics/prom`; `Gozlem.tsx` canlı kartlar ve mini trend grafiği.
- 2025-08-10: Server Supervisor ve Store güncellemeleri — `apps/web-next/server/supervisor.ts`, `stores/useStrategyLabStore.ts`.
- 2025-08-10 21:14: `Ayarlar.tsx` ve `PortfoyYonetimi.tsx` eklendi; nav ve parametre paneli güncellendi; `next.config.js` düzenlemeleri.
- 2025-08-09: Monorepo genişlemeleri, API/strateji uçları, bileşen seti ve tsconfig düzenlemeleri.

### Sıradakiler
- 2025-08-12: Grafana dashboard JSON sağlanması (Prometheus metrikleri için paneller, eşik renkleri, açıklamalar).
- 2025-08-12: Alertmanager entegrasyonu (Telegram kritik, Discord uyarı); `ws_uptime_ratio` ve `last_message_delay_ms` için alarmlar.
- 2025-08-12: SSE olay adlarının standartlaştırılması ve tutarlılığı kontrolü (`/api/logs/sse`).
- 2025-08-12: CI pipeline (typecheck + build + prom-lint) ve Linux runner hazırlığı.

### Bekleyen/Askıda
- 2025-08-15: Binance WS’in hub’a doğrudan entegrasyonu (özel yayın/skip ayrıştırması ve delay p95/p99).
- 2025-08-15: Portföy UI’da satır bazlı delta highlight, skeleton yüklemeler ve render azaltımı.
- 2025-08-15: Rate‑limit bütçe görselleştirmesi ve kapasite planlama rehberi.

## 3) Son Değişiklikler (diff ve commit özeti)
- Değişen dosya kümeleri (son 24 saat içinde plan kaydına göre):
  - `apps/web-next/pages/strategy-lab.tsx`, `components/StrategyLab/*`, `components/Nav.tsx`, `components/OptimizePanel.tsx`, `components/StrategyLab/ParameterPanel.tsx` — Strategy Lab UX ve metrik görünümü.
  - `apps/web-next/pages/api/market-data.ts`, `apps/web-next/server/supervisor.ts`, `apps/web-next/stores/useStrategyLabStore.ts` — veri akışı ve yönetim.
  - `apps/web-next/pages/Ayarlar.tsx`, `apps/web-next/pages/PortfoyYonetimi.tsx` — yeni sayfalar ve broker uçları ile entegrasyon.
  - `apps/web-next/next.config.js`, `tsconfig.json` — konfig güncellemeleri.
- Kritik kod parçaları (SSE başlıkları):
  - `/api/portfolio/stream` SSE:
    - Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`
  - `/api/metrics/stream` SSE:
    - 1 Hz interval ile `{ ts, metrics }` yayın.

## 4) Uygulanan Mikro‑Düzeltmeler
- `apps/web-next/pages/api/metrics/prom.ts`: `prom-client` init global guard ile idempotent yapıldı; default metrikler eklendi.
- `apps/web-next/server/util.ts`: `withRetry` 429 özel muamelesi, exponential backoff ve structured logging; error budget sayaçları (5 dk pencereli oran).
- `apps/web-next/pages/api/*/stream`: SSE keep‑alive ve `no-transform`/`X-Accel-Buffering: no` başlıkları ile proxy tamponlaması engellendi.
- `apps/web-next/server/creds.ts`: `.secrets` otomatik oluşturma ve env önceliklendirmesi.

## 5) Backup Talimatları

### Bash (Linux/macOS/WSL)
```bash
# Proje kökünde çalıştırın
EXCLUDES=(--exclude=node_modules --exclude=.next --exclude=dist --exclude=.git)
TS=$(date +%Y%m%d_%H%M%S)
tar -czf GPT_Backups/backup_${TS}.tar.gz "${EXCLUDES[@]}" .
```

### PowerShell (Windows)
```powershell
# Proje kökünde çalıştırın
$ts = Get-Date -Format yyyyMMdd_HHmmss
$dest = "GPT_Backups/backup_$ts.tar.gz"
$ex = @('--exclude=node_modules','--exclude=.next','--exclude=dist','--exclude=.git')
& tar -czf $dest $ex .
Write-Host "Backup: $dest"
```

### Geri Yükleme
```bash
# Temiz bir çalışma dizinine açın
tar -xzf GPT_Backups/backup_YYYYMMDD_HHMMSS.tar.gz -C ./restore_dir
```

Not: Mevcut `scripts/safe-backup.ps1` betiği de (tag ve seçeneklerle) güvenli yedek almayı destekler.

## 6) Prometheus / Grafana Entegrasyon Notları

- **Metrics endpointleri**: `/api/metrics/prom` (Prometheus), `/api/metrics` (JSON), `/api/metrics/stream` (SSE).
- **prometheus.yml örneği**
```yaml
scrape_configs:
  - job_name: 'spark-web'
    scrape_interval: 5s
    static_configs:
      - targets: ['127.0.0.1:3003']
    metrics_path: /api/metrics/prom
    scheme: http
    honor_labels: true
```
- **Alert kuralları (örnek)**
```yaml
groups:
- name: spark.rules
  rules:
  - alert: SparkWSUptimeLow
    expr: ws_uptime_ratio < 0.8
    for: 2m
    labels: { severity: critical }
    annotations:
      summary: 'WS Uptime düşük (<80%)'
  - alert: SparkLastMessageDelayHigh
    expr: last_message_delay_ms > 2000
    for: 1m
    labels: { severity: warning }
    annotations:
      summary: 'WS mesaj gecikmesi 2s üzeri'
```
- **Alertmanager alıcı örnekleri**
```yaml
receivers:
- name: 'telegram'
  telegram_configs:
    - bot_token: '<BOT_TOKEN>'
      chat_id: '<CHAT_ID>'
      disable_notifications: false
- name: 'discord'
  webhook_configs:
    - url: 'https://discord.com/api/webhooks/<id>/<token>'
      send_resolved: true
route:
  receiver: 'telegram'
  routes:
    - matchers: [ severity = 'warning' ]
      receiver: 'discord'
```

—
Dosya yolları ve teknik terimler güncel repo yapısına göre doğrulanmış; güvenlik (API key), rate‑limit ve telemetri ayrıntıları ilgili modüllerde uygulanmaktadır. 