# COPILOT BACKEND V0 + STRATEGY DSL PIPELINE
## Implementation Plan - 2 Haftalık Sprint

**Tarih:** 2025-01-29
**Hedef:** Mock Copilot/Strategy → Gerçek LLM+Tool-Router+DSL Doğrulama Zinciri
**Durum:** 📋 BAŞLANGIÇ

---

## 🎯 P0 Deliverables (2 Hafta)

### 1. Copilot Backend (Minimum Viable)

- ✅ `/api/copilot/chat` (SSE streaming)
- ✅ Tool registry: **read-only** tool'lar + backtest/optimize trigger (dry-run)
- ✅ Strategy generate: LLM → StrategySpec (DSL) → validate → "backtest'e gönder" butonu
- ✅ Approval gate: live/stop/start gibi aksiyonlar **daima confirm_required**

### 2. Strategy DSL Pipeline (Minimum Viable)

- ✅ DSL Schema (Zod validation)
- ✅ Validator (logic checks, risk validation, indicator validation)
- ✅ Codegen (DSL → JavaScript function)
- ✅ LLM → DSL generation + iterative refinement

---

## 📦 Package Structure

```
packages/
  ai-core/              # NEW: LLM Provider interface + Tool Router
    src/
      providers/        # OpenAI, Anthropic implementations
      tools/            # Tool registry + implementations
      router/           # Tool router + policy enforcement
      audit/            # Audit logger
    package.json
    tsconfig.json

  strategy-dsl/         # NEW: Strategy DSL pipeline
    src/
      schema/           # Zod schema
      validator/        # Validation logic
      codegen/          # DSL → JS code generator
      llm/              # LLM DSL generation
    package.json
    tsconfig.json
```

---

## 🔧 Implementation Steps

### Week 1: Foundation

#### Day 1-2: packages/ai-core Setup

**Tasks:**
1. Package oluştur (`packages/ai-core/`)
2. LLM Provider interface tanımla
3. OpenAI provider implementasyonu (basit chat)
4. Tool registry skeleton

**Files:**
- `packages/ai-core/src/providers/LLMProvider.ts`
- `packages/ai-core/src/providers/OpenAIProvider.ts`
- `packages/ai-core/src/tools/registry.ts`
- `packages/ai-core/src/tools/types.ts`

**Acceptance:**
- ✅ Provider interface çalışıyor
- ✅ OpenAI API çağrısı yapılabiliyor (test)
- ✅ Tool registry kayıt/çözümleme çalışıyor

#### Day 3-4: Tool Implementations (Read-only)

**Tasks:**
1. `getMarketSnapshot` tool
2. `getStrategies` tool
3. `getStrategy` tool
4. `getRuntimeHealth` tool

**Files:**
- `packages/ai-core/src/tools/market.ts`
- `packages/ai-core/src/tools/strategy.ts`
- `packages/ai-core/src/tools/health.ts`

**Integration:**
- Zustand store'a bağlan
- Executor API'ye bağlan
- Market data API'ye bağlan

**Acceptance:**
- ✅ Her tool gerçek veri döndürüyor
- ✅ Tool registry'den çağrılabiliyor

#### Day 5: Tool Router + Policy Layer

**Tasks:**
1. Tool router implementation
2. Policy enforcement (RBAC, risk gate)
3. Audit logger

**Files:**
- `packages/ai-core/src/router/ToolRouter.ts`
- `packages/ai-core/src/router/PolicyEngine.ts`
- `packages/ai-core/src/audit/AuditLogger.ts`

**Acceptance:**
- ✅ Tool çağrıları router üzerinden geçiyor
- ✅ Policy kontrolü çalışıyor
- ✅ Audit log kaydı yapılıyor

### Week 2: Integration + Strategy DSL

#### Day 6-7: /api/copilot/chat Endpoint

**Tasks:**
1. SSE streaming endpoint
2. LLM provider integration
3. Function calling support
4. Tool execution flow

**Files:**
- `apps/web-next/src/app/api/copilot/chat/route.ts`

**Flow:**
```
User message → LLM (with tool definitions)
→ Function calls → Tool Router → Policy Check → Execute → Result
→ LLM (with tool results) → Response (SSE stream)
```

**Acceptance:**
- ✅ SSE stream çalışıyor
- ✅ LLM tool calls yapıyor
- ✅ Tool'lar execute ediliyor
- ✅ Response stream'de geliyor

#### Day 8-9: Strategy DSL Pipeline

**Tasks:**
1. packages/strategy-dsl setup
2. DSL Schema (Zod)
3. Validator implementation
4. Codegen (DSL → JS)

**Files:**
- `packages/strategy-dsl/src/schema/spec.ts`
- `packages/strategy-dsl/src/validator/StrategyValidator.ts`
- `packages/strategy-dsl/src/codegen/Codegen.ts`

**Acceptance:**
- ✅ DSL parse ediliyor (Zod)
- ✅ Validation çalışıyor (logic, risk, indicators)
- ✅ Code generation çalışıyor (testable JS function)

#### Day 10: LLM → DSL Generation

**Tasks:**
1. LLM prompt engineering (DSL generation)
2. Iterative refinement loop
3. Strategy generate endpoint güncelle

**Files:**
- `packages/strategy-dsl/src/llm/DSLGenerator.ts`
- `apps/web-next/src/app/api/copilot/strategy/generate/route.ts` (güncelle)

**Acceptance:**
- ✅ LLM DSL üretiyor
- ✅ Validation hataları → LLM feedback → regenerate
- ✅ Valid DSL → "Backtest'e gönder" butonu

#### Day 11-12: Stateful Tools + Approval Gate

**Tasks:**
1. `runBacktest` tool (dry-run default)
2. `proposeStrategyChange` tool
3. Approval UI integration

**Files:**
- `packages/ai-core/src/tools/backtest.ts`
- `packages/ai-core/src/tools/strategy-change.ts`
- UI: Approval modal (existing component güncelle)

**Acceptance:**
- ✅ Dry-run mode çalışıyor
- ✅ Confirm required flag doğru set ediliyor
- ✅ Approval UI gösteriliyor

#### Day 13-14: Testing + Polish

**Tasks:**
1. End-to-end test (Copilot → Tool → Approval → Deploy)
2. Error handling improvements
3. Documentation updates
4. Smoke tests

---

## 🔒 Policy Rules (Initial)

### RBAC

```typescript
const ROLES = {
  readonly: ['getMarketSnapshot', 'getStrategies', 'getStrategy', 'getRuntimeHealth'],
  analyst: [...ROLES.readonly, 'runBacktest', 'runOptimize'],  // dry-run only
  trader: [...ROLES.analyst, 'proposeStrategyChange', 'startStrategy', 'pauseStrategy', 'stopStrategy'],  // dry-run default
  admin: ['*'],  // All tools, can commit
};
```

### Risk Gate

```typescript
const RISK_GATES = {
  maxOpenPositions: 10,
  dailyLossLimit: 1000,  // USD
  requireHealthyFeed: true,  // Feed stale ise trade engelle
};
```

---

## 📊 Success Metrics

### Week 1
- ✅ Tool registry çalışıyor (read-only tools)
- ✅ LLM provider entegre
- ✅ Policy enforcement aktif

### Week 2
- ✅ Copilot chat endpoint çalışıyor (SSE)
- ✅ Strategy DSL generation çalışıyor
- ✅ Approval workflow çalışıyor

### End Goal
**Spark "UI demo" olmaktan çıkar, "ajanlı platform çekirdeği" olur.**

---

## 🚨 Risks & Mitigation

### Risk 1: LLM API Rate Limits
**Mitigation:** Request queuing + retry logic + fallback to mock (dev mode)

### Risk 2: Tool Execution Latency
**Mitigation:** Async execution + progress updates (SSE)

### Risk 3: DSL Generation Quality
**Mitigation:** Iterative refinement + validation feedback loop

### Risk 4: Policy Enforcement Bugs
**Mitigation:** Comprehensive tests + dry-run default + audit log

---

## 📝 Documentation Updates

- [x] `docs/COPILOT_TOOLS.md` - Tool registry documentation
- [x] `docs/STRATEGY_SPEC.md` - DSL specification
- [x] `docs/ARCHITECTURE.md` - Updated with Copilot + DSL pipeline
- [ ] `docs/COPILOT_BACKEND_API.md` - API reference (after implementation)
- [ ] `docs/RUNTIME_HEALTH.md` - Runtime health + evidence log spec

---

## 🎯 Next Steps (After V0)

1. **Tool Expansion:** Orderbook depth, portfolio analysis, risk calculation
2. **Advanced DSL:** Custom indicators, multi-timeframe strategies
3. **LLM Fine-tuning:** Domain-specific model fine-tuning
4. **Multi-scenario Testing:** Robustness scoring across scenarios
5. **Live Monitoring:** Real-time strategy performance tracking

---

**Status:** 📋 Planlama tamamlandı → Implementation başlıyor
**Owner:** Development Team
**Timeline:** 2 hafta (10 iş günü)

