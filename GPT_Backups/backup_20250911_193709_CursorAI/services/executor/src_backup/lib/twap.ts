import crypto from "node:crypto";
import { privateClient } from "./privateClient";
import { getExchangeInfo, getSymbolFilters } from "./exchangeInfo";
import promClient from "prom-client";

// Metrics
const twapStartedTotal = new promClient.Counter({
  name: 'spark_twap_started_total',
  help: 'Total TWAP orders started',
  labelNames: ['symbol', 'side'] as const,
});

const twapSliceSentTotal = new promClient.Counter({
  name: 'spark_twap_slice_sent_total',
  help: 'Total TWAP slices sent',
  labelNames: ['symbol', 'side'] as const,
});

const twapCancelTotal = new promClient.Counter({
  name: 'spark_twap_cancel_total',
  help: 'Total TWAP orders cancelled',
  labelNames: ['symbol', 'side'] as const,
});

const twapErrorsTotal = new promClient.Counter({
  name: 'spark_twap_errors_total',
  help: 'Total TWAP errors',
  labelNames: ['symbol', 'side', 'error_type'] as const,
});

export type TwapPlan = {
  id: string;
  symbol: string;
  side: "BUY"|"SELL";
  totalQty: number;
  slices: number;
  minMs: number;
  maxMs: number;
  type: "MARKET"|"LIMIT";
  limitPrice?: number;
};

type TwapState = { cancelled?: boolean; sent: number; filled: number; };

const plans = new Map<string, { plan:TwapPlan; state:TwapState }>();

export function createTwap(plan: Omit<TwapPlan,"id">){
  const id = "twap-"+Date.now()+"-"+crypto.randomBytes(3).toString("hex");
  plans.set(id, { plan: { id, ...plan }, state: { sent: 0, filled:0 } });
  
  // Increment metrics
  twapStartedTotal.inc({ symbol: plan.symbol, side: plan.side });
  
  runTwap(id).catch((error) => { 
    twapErrorsTotal.inc({ symbol: plan.symbol, side: plan.side, error_type: 'execution_error' });
    console.error(`TWAP execution error for ${id}:`, error);
  });
  
  return id;
}

export function cancelTwap(id: string){
  const st = plans.get(id);
  if (st) {
    st.state.cancelled = true;
    twapCancelTotal.inc({ symbol: st.plan.symbol, side: st.plan.side });
  }
  return !!st;
}

async function runTwap(id: string){
  const entry = plans.get(id); 
  if (!entry) return;
  
  const { plan, state } = entry;
  
  try {
    const info = await getExchangeInfo(process.env.BINANCE_API_BASE!);
    const f = getSymbolFilters(info, plan.symbol);
    const step = Number(f.lotSize?.stepSize || "0.000001");

    for (let i=0; i<plan.slices; i++){
      if (state.cancelled) break;

      // qty dilimleme + step'e yuvarla
      let qty = plan.totalQty / plan.slices;
      qty = Math.max(qty, step);
      qty = Number(qty.toFixed((step.toString().split(".")[1]||"").length));

      const body:any = {
        symbol: plan.symbol,
        side: plan.side,
        type: plan.type,
        quantity: String(qty),
        newClientOrderId: `twap-${id}-${i}`
      };
      if (plan.type==="LIMIT") body.price = String(plan.limitPrice);

      // gönder
      await privateClient.newOrder(body);
      state.sent++;
      twapSliceSentTotal.inc({ symbol: plan.symbol, side: plan.side });

      // jitterli bekleme
      const wait = rand(plan.minMs, plan.maxMs);
      await sleep(wait);
    }
  } catch (error) {
    twapErrorsTotal.inc({ symbol: plan.symbol, side: plan.side, error_type: 'slice_error' });
    throw error;
  }
}

function sleep(ms:number){ return new Promise(r=>setTimeout(r, ms)); }
function rand(a:number,b:number){ return Math.floor(Math.random()*(b-a+1))+a; } 