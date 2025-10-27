export type BTInput = { symbol:string; tf:string; window:string; name?:string; seed?:number };
export type BTPoint = { t:number; equity:number };
export type BTTrade = { t:number; side:'BUY'|'SELL'; price:number; qty:number };
export type BTOUT = { tldr:string; points:BTPoint[]; trades:BTTrade[]; pnl_pct:number };

function prng(seed:number){ let s=seed|0||42; return ()=> (s = (s*1664525+1013904223)|0, ((s>>>0)%1e6)/1e6); }

export async function runBacktest(p:BTInput, onProgress?:(pct:number)=>void):Promise<BTOUT>{
  const start = Date.now();
  const rnd = prng(p.seed ?? 1337);
  const N = 240;
  const points:BTPoint[] = [];
  const trades:BTTrade[] = [];
  let equity = 1_000;
  
  // Guard: minimum data check
  if (N <= 0) {
    return { tldr: "No data", points: [], trades: [], pnl_pct: 0 };
  }
  
  for (let i=0;i<N;i++){
    const drift = (rnd()-0.5)*4;
    equity = Math.max(800, equity + drift);
    points.push({ t: start - (N-i)*3600_000, equity: Math.round(equity*100)/100 });
    if (rnd() > 0.96){
      const side = rnd()>0.5?'BUY':'SELL' as const;
      const price = Math.round((1000 + (i*0.5) + (rnd()-0.5)*20)*100)/100;
      const lastPoint = points[points.length-1];
      if (lastPoint) {
        trades.push({ t: lastPoint.t, side, price, qty: 0.01 });
      }
    }
    if (onProgress && i%24===0) onProgress(Math.round((i/N)*100));
    await new Promise(r=>setTimeout(r, 0));
  }
  const pnl_pct = Math.round(((equity-1000)/1000)*1000)/10;
  const tldr = `Backtest ${p.symbol} ${p.tf} ${p.window}: PnL=${pnl_pct}% (${points.length} bar, ${trades.length} trade)`;
  return { tldr, points, trades, pnl_pct };
} 