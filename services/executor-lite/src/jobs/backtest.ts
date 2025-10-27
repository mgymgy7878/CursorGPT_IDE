import { runBacktest, smaCross, Candle } from "../../../../packages/backtest-engine/dist";
import fs from "fs";
import path from "path";

// Örnek fixture (Iteration 1'de gerçek reader yok)
function makeFixture(): Candle[] {
  const out: Candle[] = [];
  const start = Date.now() - 1000 * 60 * 60 * 24;
  let price = 100;
  for (let i = 0; i < 500; i++) {
    const t = start + i * 60_000;
    const o = price;
    price += (Math.sin(i / 20) * 0.5) + (Math.random() - 0.5) * 0.2;
    const c = price;
    const h = Math.max(o, c) + Math.random() * 0.2;
    const l = Math.min(o, c) - Math.random() * 0.2;
    const v = 1;
    out.push({ t, o, h, l, c, v });
  }
  return out;
}

export async function runBacktestJob(payload: any) {
  const symbol = payload.pair ?? "BTCUSDT";
  const tf = payload.timeframe ?? "1m";
  const params = payload.params ?? { fast: 10, slow: 30 };
  const candles = makeFixture();

  const { id, report } = await runBacktest({
    symbol, 
    tf, 
    candles, 
    strategy: smaCross, 
    params
  });

  const dir = path.join(process.cwd(), "..", "..", "evidence", "backtest");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${id}.json`), 
    JSON.stringify({ id, symbol, tf, report }, null, 2)
  );
  
  return { 
    id, 
    status: "done", 
    summary: { 
      pnl: report.pnl, 
      trades: report.trades.length 
    } 
  };
}

