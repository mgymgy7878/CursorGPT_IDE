# ARCHITECTURE — İki Ajanlı Mimari (Hedef)

## Amaç

Doğal dilden strateji üretimi (NL→IR) ile canlı işletimi (runtime) birbirinden ayıran, güvenlik kapıları (guardrails) ve canary ile üretim kalitesinde çalışan mimari.

## Ajanlar

### AI-1: Operasyon / Süpervizör
- Piyasa izleme, alarm/strateji orkestrasyonu
- Canary (dry-run) + metrik eşikleri ile "go/no-go"
- Guardrails (riskScore, param-diff, kill switch)
- Pause/Resume, staleness bazlı otomatik aksiyon önerileri
- Audit izleri (neden bu karar verildi?)

### AI-2: Strateji-Üretici
- Kullanıcıdan niyet + enstrüman + periyot + risk profili toplar
- Strategy IR üretir (şema doğrulama)
- Backtest + optimizasyon döngüsü
- Açıklama (explain) + hata düzeltme önerileri

## Çekirdek Akış

```
WS (Binance/BTCTurk) → Provider → Store → UI
                                    ↓
Metrics → /api/public/metrics → (ileride) Prometheus/Grafana

AI-2 (Strategy IR) → Backtest/Optimize → AI-1 (Guardrails/Canary) → Deploy
```

## Katmanlar

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  Dashboard │ MarketData │ StrategyLab │ Portfolio │ Alerts  │
├─────────────────────────────────────────────────────────────┤
│                      State Layer                             │
│           Zustand Store │ RafBatch │ Memoization            │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│     WS Provider │ API Routes │ Metrics │ AI Services        │
├─────────────────────────────────────────────────────────────┤
│                  Integration Layer                           │
│          Binance │ BTCTurk │ (BIST) │ Executor              │
└─────────────────────────────────────────────────────────────┘
```

## Notlar

- "Tek strateji yaz" değil, "strateji üret → test et → optimize et → canary → deploy" hattı hedeflenir.
- Prod etkili aksiyonlar için onay kapısı zorunludur.
- Tüm state değişiklikleri audit log'a düşer.
