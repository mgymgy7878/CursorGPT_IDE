import { Candle, Order, Trade } from "./types";
import { randomUUID } from "crypto";

export function runDeterministicSim(candles: Candle[], orders: Order[]): { trades: Trade[], pnl: number } {
  const trades: Trade[] = [];
  let position: Trade | null = null;

  for (const o of orders) {
    if (o.side === "buy") {
      if (!position) {
        position = {
          id: randomUUID(),
          side: "long",
          entry: o.price ?? candles.find(c => c.t >= o.ts)?.c ?? candles[candles.length-1].c,
          tsEnter: o.ts,
        };
      }
    } else if (o.side === "sell" && position) {
      const exit = o.price ?? candles.find(c => c.t >= o.ts)?.c ?? candles[candles.length-1].c;
      position.exit = exit;
      position.tsExit = o.ts;
      position.pnl = (exit - position.entry);
      trades.push(position);
      position = null;
    }
  }

  // Pozisyon açık kalmışsa kapatma yok → realized pnl yok
  const pnl = trades.reduce((a, t) => a + (t.pnl ?? 0), 0);
  return { trades, pnl };
}

