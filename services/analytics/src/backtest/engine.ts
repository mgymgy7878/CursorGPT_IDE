import { SMA, EMA, RSI, ATR } from "../indicators/ta";

export type Bar = { t:number; o:number; h:number; l:number; c:number; v:number };

export type Config = {
  symbol:string; 
  timeframe:string;
  indicators:{ emaFast?:number; emaSlow?:number; rsi?:number; atr?:number };
  entry:{ type:"crossUp"|"crossDown"; fast:"EMA"|"SMA"; slow:"EMA"|"SMA" };
  exit:{ atrMult?:number; takeProfitRR?:number };
  feesBps?:number; 
  slippageBps?:number; 
  side?:"both"|"long"|"short";
};

export type Result = { 
  trades:number; 
  winrate:number; 
  pnl:number; 
  sharpe:number; 
  maxdd:number; 
  equity:number[]; 
  timestamps:number[] 
};

export function runBacktest(bars:Bar[], cfg:Config):Result{
  const c = bars.map(b=>b.c), h=bars.map(b=>b.h), l=bars.map(b=>b.l);
  const fast = cfg.entry.fast==="EMA" ? EMA(c, cfg.indicators.emaFast||12) : SMA(c, cfg.indicators.emaFast||12);
  const slow = cfg.entry.slow==="EMA" ? EMA(c, cfg.indicators.emaSlow||26) : SMA(c, cfg.indicators.emaSlow||26);
  const atr  = ATR(h,l,c, cfg.indicators.atr||14);
  const fee  = (cfg.feesBps||5)/10000, slip=(cfg.slippageBps||1)/10000;

  let pos=0, entryPx=0, peakEq=0, eq=10000, maxDD=0, wins=0, trades=0;
  const eqSeries:number[]=[]; const ts:number[]=[];
  
  for(let i=1;i<bars.length;i++){
    const crossUp   = fast[i-1]<=slow[i-1] && fast[i]>slow[i];
    const crossDown = fast[i-1]>=slow[i-1] && fast[i]<slow[i];
    const px = c[i]*(1+(pos!==0? (pos>0?-slip:slip):0));
    
    // exit by ATR stop or TP RR
    if(pos!==0){
      const rr = cfg.exit.takeProfitRR||1.5;
      const atrStop = atr[i]*(cfg.exit.atrMult||2);
      if(pos>0){
        if(bars[i].l < entryPx-atrStop || bars[i].h > entryPx+rr*atrStop){ 
          eq *= (px/entryPx)*(1-fee); 
          wins += +(px>entryPx); 
          pos=0; 
          trades++; 
        }
      } else {
        if(bars[i].h > entryPx+atrStop || bars[i].l < entryPx-rr*atrStop){ 
          eq *= (entryPx/px)*(1-fee); 
          wins += +(px<entryPx); 
          pos=0; 
          trades++; 
        }
      }
    }
    
    // entry
    if(cfg.side!=="short" && crossUp && pos<=0){ pos=1; entryPx=c[i]*(1+slip); }
    if(cfg.side!=="long" && crossDown&& pos>=0){ pos=-1; entryPx=c[i]*(1-slip); }

    peakEq = Math.max(peakEq, eq); 
    maxDD = Math.max(maxDD, (peakEq>0?(peakEq-eq)/peakEq:0));
    eqSeries.push(eq); 
    ts.push(bars[i].t);
  }
  
  const rets = []; 
  for(let i=1;i<eqSeries.length;i++) rets.push((eqSeries[i]-eqSeries[i-1])/eqSeries[i-1]);
  const avg = rets.reduce((a,b)=>a+b,0)/Math.max(1,rets.length);
  const sd  = Math.sqrt(rets.reduce((a,b)=>a+(b-avg)**2,0)/Math.max(1,rets.length));
  const sharpe = sd>0? avg/sd*Math.sqrt(252):0;
  
  return { 
    trades, 
    winrate: trades? wins/trades:0, 
    pnl: eq-10000, 
    sharpe, 
    maxdd: maxDD*100, 
    equity:eqSeries, 
    timestamps:ts 
  };
}

