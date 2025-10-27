## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Klasör Yapısı](#klasör-yapısı)
- [Bileşen Bağımlılıkları](#bileşen-bağımlılıkları)
- [Hub ve WS Yaşam Döngüsü](#hub-ve-ws-yaşam-döngüsü)
- [Metrik Üretim Modeli](#metrik-üretim-modeli)

## Genel Bakış
Monorepo: `apps/*`, `packages/*`. Ana uygulama `apps/web-next`. Sunucu tarafı hub, Bybit/OKX private WS akışlarından beslenir, diff tabanlı snapshot üretir ve SSE ile UI’a aktarır. REST fallback ile süreklilik sağlanır.

## Klasör Yapısı
Metin diyagram:

```
CursorGPT_IDE/
  apps/
    web-next/
      pages/                # Next.js sayfaları (Türkçe UI)
      server/               # hub, ws istemcileri, util, creds, log
      components/           # UI bileşenleri
      stores/               # Zustand store'lar
      styles/               # UI stilleri
  packages/
    agents|backtester|...   # Paylaşılan paketler ve çekirdek modüller
  services/                 # Borsa servisleri (REST imzalama)
  scripts/                  # Dev/backup yardımcı betikler
  docs/                     # Operasyon ve mimari dokümantasyonu
```

## Bileşen Bağımlılıkları
- `Gozlem.tsx` → `/api/metrics/stream` (SSE), `/api/metrics/prom` (Prometheus)
- `PortfoyYonetimi.tsx` → `/api/broker/*` (REST), `/api/portfolio/stream` (SSE)
- `Ayarlar.tsx` → `/api/broker/*/creds`
- `portfolioHub.ts` → `ws/BybitWS.ts`, `ws/OKXWS.ts`, `services/*`, `server/util.ts`

## Hub ve WS Yaşam Döngüsü
- Başlangıç: Hub başlar, Bybit/OKX WS bağlanır (varsa testnet seçimine göre).
- Auth: Key/secret ile WS auth; subscribe (orders, positions)
- Akış: Mesajlar parse → snapshot update → publish kararında JSON diff uygulanır.
- Reconnect: Hata/kopmada exponential backoff; sayaçlar (connects/reconnects/disconnects) artar.
- Fallback: WS yoksa periyodik REST poll; `fallbackRestPolls` sayaçlarına yansır.

## Metrik Üretim Modeli
- Snapshot: Hub her değişimde tek yapıdan metrik seti oluşturur (publish/skip counters, lastMessageAt, sseClients vb.).
- EMA: `last_message_delay_ms` için 1m/5m/15m EMA güncellenir.
- Uptime/Ratio: `ws_uptime_ratio`, `publish_skip_ratio` gauge’ları ve `_last_updated` timestamp’leri tutulur.
- Error Budget: `bumpErrorBudgetMiss()` ile 429 atakları 5 dk pencerede sayılarak `error_budget_miss_rate_5m` hesaplanır. 