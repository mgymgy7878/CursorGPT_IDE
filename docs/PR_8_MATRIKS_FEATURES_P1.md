# PR-8: Matriks IQ P1 Özellikleri — AI Assistant + Rule Builder + Portfolio Multi-Actions

**Tarih:** 29 Ekim 2025
**Kapsam:** P1 — Fark yaratan akıllı katman
**Kaynak:** [Matriks IQ Yardım — Codi (AI Kod Asistanı)](https://iqyardim.matriksdata.com/docs/non-knowledgebase/yenilikler/versiyon-5-4-0)

---

## 📋 Özet

Matriks IQ'nun AI destekli özelliklerinin Spark Trading'e entegrasyonu:

1. **AI Kod Asistanı** — Strategy Lab içinde doğal dil → TypeScript çeviri (Codi benzeri)
2. **Formül/Rule Builder** — Sürükle-bırak kural yazımı ve backtest entegrasyonu
3. **Portföy Çoklu Aksiyonlar** — Toplu emir iptali, TP/SL/Trailing uygulama

---

## 🎯 Özellik Detayları

### 1. AI Kod Asistanı

**Hedef:** Strategy Lab'da AI destekli kod üretimi ve yönetimi

**Özellikler:**
- ✅ Doğal dilden Spark DSL'ine/TypeScript strateji iskeletine çeviri
- ✅ "Açıkla" — Kod açıklaması oluştur
- ✅ "Refactor" — Kodu iyileştir
- ✅ "Optimize Et" — Performans optimizasyonu
- ✅ Derleme hatası açıklama

**UI Entegrasyonu:**
```typescript
// Strategy Lab Generate tab'ına AI panel eklenecek
<StrategyLabTabs>
  <TabPanel id="generate">
    <AIAssistantPanel /> {/* yeni */}
    <StrategyDescriptionInput />
    <GenerateButton />
  </TabPanel>
  ...
</StrategyLabTabs>
```

**AI Prompt'ları:**
```typescript
type AIAction =
  | { type: 'generate', description: string }
  | { type: 'explain', code: string }
  | { type: 'refactor', code: string, context: string }
  | { type: 'optimize', code: string }
  | { type: 'explain-error', error: string, code: string };
```

**Backend:**
```
POST /api/copilot/strategy-generate
POST /api/copilot/strategy-explain
POST /api/copilot/strategy-refactor
POST /api/copilot/strategy-optimize
```

---

### 2. Formül/Rule Builder

**Hedef:** Sürükle-bırak ile strateji kuralı yazımı

**Özellikler:**
- ✅ RSI/MACD/MA/Volume gibi bloklardan kural oluşturma
- ✅ Visual block editor (React Flow benzeri)
- ✅ Geri-teste yollama (backtest engine ile entegrasyon)
- ✅ "Kaydet" — Kuralı şablon olarak kaydet

**Block Types:**
```typescript
type BlockType =
  | 'indicator' // RSI, MACD, MA, BB
  | 'comparison' // >, <, =, >=, <=
  | 'operator' // AND, OR, NOT
  | 'action' // Buy, Sell, ClosePosition
  | 'value'; // Number, Percent, Price

type RuleBlock = {
  id: string;
  type: BlockType;
  params: Record<string, any>;
  connections: string[]; // connected block IDs
};
```

**UI:**
```tsx
<RuleBuilder />
  <BlockPalette /> {/* sol panel — kullanılabilir bloklar */}
  <Canvas /> {/* orta — drag & drop alanı */}
  <Properties /> {/* sağ panel — seçili blok özellikleri */}
</RuleBuilder>
```

**Backtest Entegrasyonu:**
```typescript
// Rule Builder → Backtest'e gönder
const runBacktest = async (rule: RuleBlock) => {
  const strategyCode = ruleBlockToCode(rule); // Visual rule → TypeScript
  await fetch('/api/backtest/run', {
    method: 'POST',
    body: JSON.stringify({ code: strategyCode })
  });
};
```

---

### 3. Portföy Çoklu Aksiyonlar

**Hedef:** Toplu emir yönetimi ve hızlı aksiyonlar

**Özellikler:**
- ✅ Toplu bekleyen emir iptali (checkbox ile seçim)
- ✅ Toplu TP/SL/Trailing uygulama
- ✅ Satır-içi hızlı aksiyonlar (her pozisyon için: Kapat, Tersine Çevir)

**UI Güncellemeleri:**
```
PortfolioTable:
+ Checkbox column (bulk selection)
+ Bulk action bar (üstte: "Toplu İptal", "Toplu TP/SL Uygula")
+ Inline actions (her satır: [X] Kapat, [↻] Tersine Çevir)
```

**API Endpoints:**
```
POST /api/portfolio/bulk-cancel    → Toplu emir iptali
POST /api/portfolio/bulk-tpsl      → Toplu TP/SL uygula
POST /api/portfolio/close-position → Pozisyon kapat
POST /api/portfolio/reverse-position → Pozisyon tersine çevir
```

**Veri Modeli:**
```typescript
type BulkAction = {
  type: 'cancel' | 'tpsl' | 'close' | 'reverse';
  orderIds: string[];
  config?: {
    tp?: number; // % target profit
    sl?: number; // % stop loss
    trailing?: boolean; // trailing stop
  };
};
```

---

## 📂 Dosya Yapısı

### Yeni Component'ler

```
apps/web-next/src/components/
├── lab/
│   ├── AIAssistantPanel.tsx (yeni — AI prompt interface)
│   ├── AIActionButtons.tsx (yeni — Açıkla/Refactor/Optimize)
│   ├── RuleBuilder.tsx (yeni — visual rule editor)
│   ├── BlockPalette.tsx (yeni — kullanılabilir bloklar)
│   └── RuleCanvas.tsx (yeni — drag & drop canvas)
├── portfolio/
│   ├── BulkActionBar.tsx (yeni — toplu aksiyonlar)
│   ├── PositionRowActions.tsx (yeni — satır-içi aksiyonlar)
│   └── BulkSelector.tsx (yeni — checkbox + select all)
└── copilot/
    └── StrategyCopilot.tsx (yeni — strategy-specific AI)
```

### API Endpoints

```
apps/web-next/src/app/api/
├── copilot/
│   ├── strategy-generate/route.ts (yeni)
│   ├── strategy-explain/route.ts (yeni)
│   ├── strategy-refactor/route.ts (yeni)
│   └── strategy-optimize/route.ts (yeni)
├── strategy/
│   ├── rule-builder/route.ts (yeni — rule → code)
│   └── rule-presets/route.ts (yeni — kural şablonları)
└── portfolio/
    ├── bulk-cancel/route.ts (yeni)
    ├── bulk-tpsl/route.ts (yeni)
    ├── close-position/route.ts (yeni)
    └── reverse-position/route.ts (yeni)
```

---

## 🔧 Implementation Adımları

### Phase 1: AI Kod Asistanı (3 saat)

1. **UI Components**
   - [ ] AIAssistantPanel (Strategy Lab Generate tab)
   - [ ] AIActionButtons (Açıkla/Refactor/Optimize)
   - [ ] Loading states + error handling

2. **Backend API**
   - [ ] `/api/copilot/strategy-generate` endpoint
   - [ ] LLM integration (Claude/OpenAI)
   - [ ] Prompt engineering (Spark DSL context)

3. **Integration**
   - [ ] Strategy Lab'a AI panel ekle
   - [ ] Code generation → Monaco editor
   - [ ] Error explanation modal

### Phase 2: Rule Builder (3.5 saat)

1. **Library Integration**
   - [ ] React Flow install (`react-flow-renderer`)
   - [ ] Block types definition
   - [ ] Connection logic

2. **UI Components**
   - [ ] RuleBuilder container
   - [ ] BlockPalette (left sidebar)
   - [ ] RuleCanvas (drag & drop)
   - [ ] Properties panel (right sidebar)

3. **Code Generation**
   - [ ] Rule block → TypeScript converter
   - [ ] Backtest integration
   - [ ] Rule presets (save/load)

### Phase 3: Portfolio Multi-Actions (2 saat)

1. **Table Güncellemesi**
   - [ ] Checkbox column
   - [ ] BulkSelector (select all/none)
   - [ ] Inline action buttons

2. **Bulk Actions**
   - [ ] BulkActionBar (floating)
   - [ ] API endpoints (bulk-cancel, bulk-tpsl)
   - [ ] Confirmation modal

3. **Individual Actions**
   - [ ] Close position
   - [ ] Reverse position
   - [ ] Toast notifications

---

## 🧪 Test Planı

### Manual Tests

- [ ] AI Assistant: "BTCUSDT 1h EMA crossover" → Code generation
- [ ] AI Assistant: "Açıkla" → Code explanation
- [ ] Rule Builder: Drag RSI > 70 → Generate code
- [ ] Rule Builder: Run backtest
- [ ] Portfolio: Select 3 orders → Bulk cancel
- [ ] Portfolio: Apply TP 2% to all positions

### Unit Tests

```typescript
// Rule Builder block → code conversion
test('RSI > 70 → TypeScript code', () => {
  const block = { type: 'indicator', name: 'RSI', value: 70 };
  const code = blockToCode(block);
  expect(code).toContain('rsi > 70');
});

// AI prompt generation
test('Generate prompt for strategy description', () => {
  const prompt = buildPrompt({ type: 'generate', description: 'EMA crossover' });
  expect(prompt).toContain('EMA');
  expect(prompt).toContain('Spark DSL');
});
```

---

## 📊 Metrikler

**Beklenen Çıktılar:**
- Strateji yazma süresi: 30 dakika → 5 dakika (85% azalma)
- Kural yazma: Sürükle-bırak ile 2 dakika
- Toplu işlem: 10 emir iptali 30 saniye → 5 saniye (85% hız)

---

## 🔗 İlgili Dokümanlar

- PR-6: `PR_6_MATRIKS_FEATURES_P0.md`
- PR-7: `PR_7_MATRIKS_FEATURES_P0_PT2.md`
- Matriks Codi: https://iqyardim.matriksdata.com/
- React Flow: https://reactflow.dev/

---

**Status:** 🟡 PLANNED
**Branch:** feat/pr8-matriks-p1-features
**ETA:** ~8.5 saat

