// Use local TradeSide internally to avoid clashing with shared/types TradeSide
type TradeSide = "BUY" | "SELL";
export type Trade = { ts: number; price: number; qty: number; side: TradeSide };
export type EquityPoint = { ts: number; value: number };

/** Girdi tuple/obje karışık olsa da güvenli modele dönüştür. */
export const asTrades = (rows: any[]): Trade[] =>
  (rows ?? []).map((r: any) => {
    if (Array.isArray(r)) {
      const [ts, price, qty, side] = r;
      return { ts: Number(ts), price: Number(price), qty: Number(qty), side: (side ?? "BUY").toString().toUpperCase() as TradeSide };
    }
    return { ts: Number(r?.ts ?? r?.time ?? Date.now()), price: Number(r?.price ?? r?.p ?? 0), qty: Number(r?.qty ?? r?.q ?? 0), side: (r?.side ?? "BUY").toString().toUpperCase() as TradeSide };
  });

export const asEquity = (rows: any[]): EquityPoint[] =>
  (rows ?? []).map((r: any) => Array.isArray(r)
    ? ({ ts: Number(r[0]), value: Number(r[1]) })
    : ({ ts: Number(r?.ts ?? r?.time ?? Date.now()), value: Number(r?.value ?? r?.v ?? r?.equity ?? 0) })
  ); 
