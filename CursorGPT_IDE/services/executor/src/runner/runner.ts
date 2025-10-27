import vm from 'vm';
import { BinanceFutures } from '../exchanges/binanceFutures';

type Ctx = {
  market: { ticker: (symbol: string) => Promise<any> },
  order: { market: (symbol: string, side: 'BUY'|'SELL', qty: number) => Promise<any> },
  risk: { maxDailyLoss: number, dryRun: boolean }
};

export async function runStrategy(code: string, bin: BinanceFutures, symbols: string[], dryRun: boolean) {
  // basit context
  const ctx: Ctx = {
    market: {
      ticker: async (symbol: string) => bin.public('/fapi/v1/ticker/price', { symbol })
    },
    order: {
      market: async (symbol: string, side: 'BUY'|'SELL', qty: number) => {
        if (dryRun) return { ok: true, dryRun: true, symbol, side, qty };
        return bin.market(symbol, side, qty);
      }
    },
    risk: { maxDailyLoss: 0.01, dryRun }
  };

  // Kullanıcı JS kodunu module.exports default = async function run(ctx) {...}
  const script = new vm.Script(code, { filename: 'strategy.js' });
  const sandbox: any = { module: { exports: {} }, exports: {}, console };
  const context = vm.createContext(sandbox);
  script.runInContext(context);
  const fn = sandbox.module?.exports?.default || sandbox.exports?.default;
  if (typeof fn !== 'function') throw new Error('Strategy must export default async function');
  const res = await fn(ctx, symbols);
  return res;
}
