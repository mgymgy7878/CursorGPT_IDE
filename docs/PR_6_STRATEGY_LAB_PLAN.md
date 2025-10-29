# PR-6: Strategy Lab İçerik Entegrasyonu

**Hedef:** Strategy Lab sekmelerini "iskelet"ten "işlevsel mock"a taşımak
**Süre:** 2-3 saat
**Tahmin:** ~12 dosya, +800 satır

---

## 🎯 Kapsam

### 1. Generate Tab (AI Strateji Üretici)

**UI Components:**

```tsx
// apps/web-next/src/app/strategy-lab/_tabs/GenerateTab.tsx

<div className="grid gap-6">
  {/* Prompt Input */}
  <div>
    <label>Strateji Açıklaması</label>
    <textarea placeholder="Örn: RSI 30'un altında al, 70'in üstünde sat..." />
  </div>

  {/* Indicator Selector */}
  <div>
    <label>İndikatörler</label>
    <MultiSelect options={["RSI", "MACD", "BB", "EMA", "SMA"]} />
  </div>

  {/* Timeframe */}
  <div>
    <label>Zaman Dilimi</label>
    <select>
      <option>1m</option>
      <option>5m</option>
      <option>15m</option>
      <option selected>1h</option>
      <option>4h</option>
      <option>1d</option>
    </select>
  </div>

  {/* Generate Button */}
  <button onClick={handleGenerate}>🤖 Strateji Üret</button>

  {/* Code Preview (if generated) */}
  {generatedCode && (
    <div className="code-preview">
      <SyntaxHighlighter language="python">{generatedCode}</SyntaxHighlighter>
      <button onClick={() => setActiveTab("backtest")}>Backtest'e Geç →</button>
    </div>
  )}
</div>
```

**State Management:**

```tsx
// apps/web-next/src/stores/strategyLabStore.ts (extend)

interface StrategyLabState {
  // ... existing
  prompt: string;
  indicators: string[];
  timeframe: string;
  generatedCode: string | null;

  setPrompt: (prompt: string) => void;
  setIndicators: (indicators: string[]) => void;
  generateStrategy: () => Promise<void>;
}
```

**Mock API:**

```tsx
// apps/web-next/src/app/api/lab/generate/route.ts

export async function POST(req: Request) {
  const { prompt, indicators, timeframe } = await req.json();

  // Mock delay
  await new Promise((r) => setTimeout(r, 1500));

  const code = `
# Auto-generated strategy
# Prompt: ${prompt}

def strategy(data):
    # Use indicators: ${indicators.join(", ")}
    # Timeframe: ${timeframe}

    rsi = calculate_rsi(data)
    if rsi < 30:
        return 'BUY'
    elif rsi > 70:
        return 'SELL'
    return 'HOLD'
  `.trim();

  return Response.json({ code, status: "success" });
}
```

---

### 2. Backtest Tab (SSE Progress + Equity)

**UI Components:**

```tsx
// apps/web-next/src/app/strategy-lab/_tabs/BacktestTab.tsx

<div className="grid gap-6">
  {/* Dataset Selector */}
  <div className="grid md:grid-cols-3 gap-4">
    <div>
      <label>Sembol</label>
      <select value={symbol} onChange={e => setSymbol(e.target.value)}>
        <option>BTCUSDT</option>
        <option>ETHUSDT</option>
        <option>BNBUSDT</option>
      </select>
    </div>
    <div>
      <label>Başlangıç</label>
      <input type="date" value={startDate} onChange={...} />
    </div>
    <div>
      <label>Bitiş</label>
      <input type="date" value={endDate} onChange={...} />
    </div>
  </div>

  {/* Parameters */}
  <div className="grid md:grid-cols-2 gap-4">
    <div>
      <label>Başlangıç Sermayesi</label>
      <input type="number" value={capital} onChange={...} />
    </div>
    <div>
      <label>Komisyon (%)</label>
      <input type="number" step="0.01" value={commission} onChange={...} />
    </div>
  </div>

  {/* Run Button */}
  <button onClick={handleRunBacktest} disabled={isRunning}>
    {isRunning ? '⏳ Çalışıyor...' : '▶️ Backtest Başlat'}
  </button>

  {/* Progress Bar (SSE) */}
  {progress && (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress.percent}%` }} />
      <span>{progress.percent}% — {progress.currentBar} / {progress.totalBars}</span>
      <span className="eta">Kalan: {progress.eta}s</span>
    </div>
  )}

  {/* Results: Equity Chart */}
  {results && (
    <div className="results">
      <div className="metrics grid md:grid-cols-4 gap-4">
        <Metric label="Net Kâr" value={results.netProfit} format="currency" />
        <Metric label="Sharpe Ratio" value={results.sharpe} />
        <Metric label="Max Drawdown" value={results.maxDrawdown} format="percent" />
        <Metric label="Win Rate" value={results.winRate} format="percent" />
      </div>

      <div className="equity-chart mt-6">
        <h3>Equity Curve</h3>
        <LineChart data={results.equityCurve} />
      </div>

      <button onClick={() => setActiveTab('optimize')}>
        Optimizasyon →
      </button>
    </div>
  )}
</div>
```

**SSE Stream:**

```tsx
// apps/web-next/src/app/api/lab/backtest-stream/route.ts

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i <= 100; i += 10) {
        const event = {
          percent: i,
          currentBar: i * 10,
          totalBars: 1000,
          eta: (100 - i) * 2,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
        await new Promise((r) => setTimeout(r, 500));
      }

      // Final result
      const result = {
        netProfit: 1250.5,
        sharpe: 1.85,
        maxDrawdown: -12.3,
        winRate: 58.5,
        equityCurve: [
          { date: "2024-01-01", value: 10000 },
          { date: "2024-01-02", value: 10150 },
          // ... mock data
        ],
      };
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "result", data: result })}\n\n`
        )
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Client Hook:**

```tsx
// apps/web-next/src/hooks/useBacktestStream.ts

export function useBacktestStream() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const start = (params: BacktestParams) => {
    setIsRunning(true);
    setProgress(null);
    setResults(null);

    const eventSource = new EventSource("/api/lab/backtest-stream");

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "result") {
        setResults(data.data);
        setIsRunning(false);
        eventSource.close();
      } else {
        setProgress(data);
      }
    };

    eventSource.onerror = () => {
      setIsRunning(false);
      eventSource.close();
    };
  };

  return { progress, results, isRunning, start };
}
```

---

### 3. Optimize Tab (Param Grid + Leaderboard)

**UI Components:**

```tsx
// apps/web-next/src/app/strategy-lab/_tabs/OptimizeTab.tsx

<div className="grid gap-6">
  {/* Parameter Ranges */}
  <div className="param-grid">
    <h3>Parametre Aralıkları</h3>
    <div className="grid gap-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label>Parametre</label>
          <input value="rsi_period" disabled />
        </div>
        <div>
          <label>Min</label>
          <input type="number" value={10} onChange={...} />
        </div>
        <div>
          <label>Max</label>
          <input type="number" value={30} onChange={...} />
        </div>
      </div>
      {/* Repeat for other params */}
    </div>
  </div>

  {/* Optimization Method */}
  <div>
    <label>Optimizasyon Yöntemi</label>
    <select>
      <option>Grid Search</option>
      <option>Random Search</option>
      <option>Bayesian</option>
    </select>
  </div>

  {/* Run Button */}
  <button onClick={handleOptimize}>
    ⚡ Optimizasyon Başlat
  </button>

  {/* Leaderboard */}
  {leaderboard && (
    <div className="leaderboard">
      <h3>En İyi Sonuçlar</h3>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Net Kâr</th>
            <th>Sharpe</th>
            <th>Drawdown</th>
            <th>Params</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, i) => (
            <tr key={i} className={i === 0 ? 'best' : ''}>
              <td>{i + 1}</td>
              <td>{row.netProfit}</td>
              <td>{row.sharpe}</td>
              <td>{row.maxDrawdown}</td>
              <td>
                <code>{JSON.stringify(row.params)}</code>
              </td>
              <td>
                {i === 0 && (
                  <button onClick={() => deployBest(row)}>
                    Dağıt →
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

**Mock API:**

```tsx
// apps/web-next/src/app/api/lab/optimize/route.ts

export async function POST(req: Request) {
  const { params, method } = await req.json();

  // Mock delay
  await new Promise((r) => setTimeout(r, 2000));

  const leaderboard = Array.from({ length: 10 }, (_, i) => ({
    params: { rsi_period: 14 + i, rsi_overbought: 70 - i },
    netProfit: 1500 - i * 50,
    sharpe: 2.0 - i * 0.1,
    maxDrawdown: -10 - i,
    winRate: 60 - i,
  }));

  return Response.json({ leaderboard });
}
```

---

### 4. Deploy Tab (Risk + Canary)

**UI Components:**

```tsx
// apps/web-next/src/app/strategy-lab/_tabs/DeployTab.tsx

<div className="grid gap-6">
  {/* Strategy Name */}
  <div>
    <label>Strateji Adı</label>
    <input value={strategyName} onChange={...} />
  </div>

  {/* Risk Limits */}
  <div className="risk-limits grid md:grid-cols-2 gap-4">
    <div>
      <label>Max Pozisyon Boyutu ($)</label>
      <input type="number" value={maxPosition} onChange={...} />
    </div>
    <div>
      <label>Günlük Zarar Limiti ($)</label>
      <input type="number" value={dailyLossLimit} onChange={...} />
    </div>
    <div>
      <label>Max Açık Pozisyon</label>
      <input type="number" value={maxOpenPositions} onChange={...} />
    </div>
    <div>
      <label>Stop Loss (%)</label>
      <input type="number" step="0.1" value={stopLoss} onChange={...} />
    </div>
  </div>

  {/* Deployment Mode */}
  <div>
    <label>Dağıtım Modu</label>
    <div className="flex gap-4">
      <label>
        <input type="radio" name="mode" value="dry" checked={mode === 'dry'} />
        Kuru Test (Dry Run)
      </label>
      <label>
        <input type="radio" name="mode" value="canary" checked={mode === 'canary'} />
        Canary (Küçük Sermaye)
      </label>
      <label>
        <input type="radio" name="mode" value="live" checked={mode === 'live'} />
        Canlı
      </label>
    </div>
  </div>

  {/* Preview */}
  <div className="preview bg-card/40 p-4 rounded-lg">
    <h3>Önizleme</h3>
    <pre>{JSON.stringify({ strategyName, riskLimits, mode }, null, 2)}</pre>
  </div>

  {/* Deploy Button */}
  <button onClick={handleDeploy} disabled={!canDeploy}>
    🚀 Dağıt
  </button>

  {/* Success Message */}
  {deployed && (
    <div className="success">
      ✅ Strateji başarıyla dağıtıldı!
      <Link href="/running">Çalışan Stratejiler →</Link>
    </div>
  )}
</div>
```

---

## 📊 Dosya Değişiklikleri

### Yeni Dosyalar (+12)

```
apps/web-next/src/app/strategy-lab/_tabs/
  - GenerateTab.tsx (yeni içerik, ~120 lines)
  - BacktestTab.tsx (SSE + chart, ~180 lines)
  - OptimizeTab.tsx (leaderboard, ~150 lines)
  - DeployTab.tsx (form + preview, ~130 lines)

apps/web-next/src/app/api/lab/
  - generate/route.ts (~40 lines)
  - backtest-stream/route.ts (SSE, ~80 lines)
  - optimize/route.ts (~50 lines)

apps/web-next/src/hooks/
  - useBacktestStream.ts (~60 lines)

apps/web-next/src/components/charts/
  - LineChart.tsx (Recharts wrapper, ~50 lines)

apps/web-next/messages/tr/common.json (+15 keys)
apps/web-next/messages/en/common.json (+15 keys)
```

### Güncellenecek Dosyalar

```
apps/web-next/src/stores/strategyLabStore.ts
  - Extend state (prompt, indicators, results, leaderboard)

apps/web-next/src/app/strategy-lab/page.tsx
  - Tab geçiş state'i zaten var (OK)
```

---

## 🧪 Test Stratejisi

### Unit Tests

```tsx
// apps/web-next/src/hooks/__tests__/useBacktestStream.test.ts
describe("useBacktestStream", () => {
  it("should parse SSE progress events", async () => {
    // ...
  });

  it("should handle final result", async () => {
    // ...
  });
});
```

### Integration Tests

```tsx
// apps/web-next/src/app/strategy-lab/_tabs/__tests__/BacktestTab.test.tsx
describe("BacktestTab", () => {
  it("should start backtest and show progress", async () => {
    render(<BacktestTab />);
    fireEvent.click(screen.getByText("Backtest Başlat"));
    await waitFor(() => expect(screen.getByText(/\d+%/)).toBeInTheDocument());
  });
});
```

### Manual Smoke Test

```powershell
# apps/web-next dev çalışırken
# 1. Strategy Lab > Generate
#    - Prompt yaz → "Üret" → kod görünür → "Backtest'e Geç" çalışır
# 2. Backtest
#    - Parametreleri doldur → "Başlat" → progress bar → sonuç grafiği
# 3. Optimize
#    - Aralıkları ayarla → "Başlat" → leaderboard görünür → "Dağıt" aktif
# 4. Deploy
#    - Strateji adı + risk limitleri → "Dağıt" → başarı mesajı
```

---

## 📦 Dependencies

### Yeni Bağımlılıklar

```json
{
  "dependencies": {
    "recharts": "^2.10.0", // Equity chart
    "react-syntax-highlighter": "^15.5.0" // Code preview
  },
  "devDependencies": {
    "@types/react-syntax-highlighter": "^15.5.11"
  }
}
```

### Kurulum

```powershell
pnpm --filter web-next add recharts react-syntax-highlighter
pnpm --filter web-next add -D @types/react-syntax-highlighter
```

---

## ⏱️ Tahmini Süre

| Görev                | Süre        |
| -------------------- | ----------- |
| GenerateTab UI       | 20 min      |
| BacktestTab UI + SSE | 40 min      |
| OptimizeTab UI       | 30 min      |
| DeployTab UI         | 25 min      |
| Mock API routes      | 20 min      |
| Chart component      | 15 min      |
| State management     | 15 min      |
| i18n keys            | 10 min      |
| Testing              | 20 min      |
| **TOPLAM**           | **~3 saat** |

---

## ✅ Kabul Kriterleri

- [ ] Generate Tab: Prompt → kod üretimi → "Backtest'e Geç" çalışıyor
- [ ] Backtest Tab: SSE progress bar → equity chart → metrikler doğru
- [ ] Optimize Tab: Leaderboard tablosu → "Best Run → Dağıt" aktif
- [ ] Deploy Tab: Form validasyonu → önizleme → başarı mesajı
- [ ] Tüm mock API'ler 200 dönüyor
- [ ] Typecheck: PASS
- [ ] Build: PASS
- [ ] Smoke test: PASS

---

**Rapor Hazırlayan:** Claude Sonnet 4.5
**Durum:** 📋 PLAN HAZIR
**Başlangıç:** PR-5 merge'ünden sonra
