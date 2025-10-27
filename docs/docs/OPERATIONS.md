## İçindekiler
- [Çalıştırma](#çalıştırma)
- [Prometheus/Grafana](#prometheusgrafana)
- [Alertmanager Kuralları ve Alıcılar](#alertmanager-kuralları-ve-alıcılar)
- [Yedek/Snapshot Prosedürü](#yedeksnapshot-prosedürü)

## Çalıştırma
- Dev: `npm --prefix apps/web-next run dev` (gerekirse önce `scripts/kill-port.ps1 -Ports 3003`).
- Typecheck: `npm --prefix apps/web-next run typecheck`.
- Build: Windows’ta dev server kapalıyken `NEXT_IGNORE_ESLINT=1` ile build alın. EPERM hatasında `.next` klasörünü silip tekrar deneyin.

## Prometheus/Grafana
- Scrape: `metrics_path: /api/metrics/prom`, örnek:

```yaml
scrape_configs:
  - job_name: cursor_gpt_ide
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:3003']
    metrics_path: /api/metrics/prom
```

- Dashboard: WS uptime, publish/skip ratio, EMA (1m/5m/15m) ve error budget miss rate panelleri; renk eşikleri: uptime < 0.8 kırmızı, 0.8–0.9 sarı; delay1m > 1s sarı, > 2s kırmızı.

## Alertmanager Kuralları ve Alıcılar
- Kurallar (Prometheus rule file):

```yaml
- alert: ErrorBudgetExceeded
  expr: error_budget_miss_rate_5m > 5
  for: 2m
  labels:
    severity: warning
  annotations:
    description: "429 rate yüksek"
- alert: LowWsUptime
  expr: ws_uptime_ratio < 0.8
  for: 10m
  labels:
    severity: critical
  annotations:
    description: "WS uptime düşük"
- alert: HighDelay
  expr: last_message_delay_ms_ema_1m > 1000
  for: 2m
  labels:
    severity: warning
  annotations:
    description: "WS gecikmesi yüksek"
```

- Alıcılar (Alertmanager):

```yaml
receivers:
  - name: 'tg'
    telegram_configs:
      - bot_token: 'XXXX'
        chat_id: 'YYYY'
  - name: 'discord'
    webhook_configs:
      - url: 'https://discord.com/api/webhooks/...'
```

- Route örneği:

```yaml
route:
  group_by: ['alertname']
  receiver: 'discord'
  routes:
    - matchers: ['severity="critical"']
      receiver: 'tg'
```

## Yedek/Snapshot Prosedürü
- Tercih edilen: `scripts/safe-backup.ps1 -Tag v_report_<YYYYMMDD_HHmm> -NoLint -SkipBuild`.
- Alternatif (git):
  1. `git add -A`
  2. `git commit -m "chore: report & ops snapshot"`
  3. `git tag -a v_report_<YYYYMMDD_HHmm> -m "report snapshot"`
  4. `git push --follow-tags` (remote tanımlıysa) 