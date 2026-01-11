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

Copilot: NL → LLM → Tool Router → Policy/Guardrails → Tools → Audit Log
Strategy: NL → LLM → DSL → Validate → Codegen → Backtest → Score → Approve → Deploy
```

## Katmanlar

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  Dashboard │ MarketData │ StrategyLab │ Portfolio │ Alerts  │
│  CopilotDock (Tool calls via SSE)                           │
├─────────────────────────────────────────────────────────────┤
│                      State Layer                             │
│           Zustand Store │ RafBatch │ Memoization            │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  WS Provider │ API Routes │ Metrics │ AI Services           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Copilot Backend:                                      │  │
│  │  /api/copilot/chat (SSE) → LLM Provider              │  │
│  │  → Tool Router → Policy/Guardrails → Tools           │  │
│  │  → Audit Log                                          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Strategy Pipeline:                                    │  │
│  │  LLM → DSL → Validator → Codegen → Backtest          │  │
│  │  → Score → Approval UI → Deploy (Paper→Live)         │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  Integration Layer                           │
│          Binance │ BTCTurk │ (BIST) │ Executor              │
└─────────────────────────────────────────────────────────────┘
```

## Notlar

- "Tek strateji yaz" değil, "strateji üret → test et → optimize et → canary → deploy" hattı hedeflenir.
- Prod etkili aksiyonlar için onay kapısı zorunludur.
- Tüm state değişiklikleri audit log'a düşer.

## Copilot Backend (v0.1 - P0)

**Durum:** 📋 Tasarım aşaması → Implementation başlıyor

**Mimari:**
- **Provider Layer:** LLM provider interface (OpenAI/Anthropic "tak-çıkar")
- **Tool Router:** Function calling / tool use registry
- **Policy/Guardrails:** RBAC, Risk Gate, Exchange Health Gate
- **Audit:** Her tool çağrısı → audit_log (requestId, actor, inputs/outputs hash)

**Tool Categories:**
- **Read-only:** `getMarketSnapshot`, `getStrategies`, `getStrategy`, `getPortfolioSummary`, `getRuntimeHealth`
- **Stateful (dry-run default):** `runBacktest`, `runOptimize`, `createAlert`, `proposeStrategyChange`, `startStrategy/pauseStrategy/stopStrategy`

**Detaylar:** `docs/COPILOT_TOOLS.md`

## Strategy DSL Pipeline (v0.1 - P0)

**Durum:** 📋 Tasarım aşaması → Implementation başlıyor

**Zincir:**
```
DSL (JSON Schema) → Validator → Codegen → Backtest → Score → Approval UI → Deploy
```

**DSL Features:**
- Entry/Exit rules (signal, crossover, divergence, breakout, custom)
- Risk management (SL/TP, position sizing, max positions, daily loss limit)
- Filters (time, volume, trend)
- Indicators configuration
- Custom code (opsiyonel)

**LLM Integration:**
- LLM → DSL generation
- Iterative refinement (validate errors → LLM feedback → regenerate)

**Detaylar:** `docs/STRATEGY_SPEC.md`

## Runtime Health + Evidence Log

**Tek Gerçeklik Kaynağı:** Runtime durumu her zaman dokümante edilir.

**Evidence Export:**
- Feed health: last message ts, staleness, reconnect count
- Executor health: queue lag, db latency, error budget
- Copilot health: provider latency, tool error rate
- Single-click export: `evidence_runtime_<ts>.json`

**Drift Önleme:**
- Raporlar tarihsel durum içerebilir, ama runtime health tek kaynak
- Copilot kararları: neden-start/pause yaptı, hangi veriye dayanarak
