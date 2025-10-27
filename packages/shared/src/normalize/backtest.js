/** Girdi tuple/obje karışık olsa da güvenli modele dönüştür. */
export const asTrades = (rows) => (rows ?? []).map((r) => {
    if (Array.isArray(r)) {
        const [ts, price, qty, side] = r;
        return { ts: Number(ts), price: Number(price), qty: Number(qty), side: (side ?? "BUY").toString().toUpperCase() };
    }
    return { ts: Number(r?.ts ?? r?.time ?? Date.now()), price: Number(r?.price ?? r?.p ?? 0), qty: Number(r?.qty ?? r?.q ?? 0), side: (r?.side ?? "BUY").toString().toUpperCase() };
});
export const asEquity = (rows) => (rows ?? []).map((r) => Array.isArray(r)
    ? ({ ts: Number(r[0]), value: Number(r[1]) })
    : ({ ts: Number(r?.ts ?? r?.time ?? Date.now()), value: Number(r?.value ?? r?.v ?? r?.equity ?? 0) }));
