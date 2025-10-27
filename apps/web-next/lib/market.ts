export function sseTicker(url: string, onTick: (p: { symbol: string; price: number; ts: number }) => void, onStatus?: (s: "LIVE" | "MOCK" | "DOWN") => void) {
  let es: EventSource | undefined;
  
  const open = () => {
    es = new EventSource(url);
    es.addEventListener("open", () => onStatus?.((url.includes("public/market") ? (process.env.NEXT_PUBLIC_EXCHANGE_MODE === "mock" ? "MOCK" : "LIVE") : "LIVE") as any));
    es.addEventListener("error", () => onStatus?.("DOWN"));
    es.addEventListener("ticker", (ev: any) => {
      try { 
        const d = JSON.parse(ev.data); 
        if (d.price) onTick(d); 
      } catch {}
    });
    es.onmessage = (ev) => {
      try { 
        const d = JSON.parse(ev.data); 
        if (d.price) onTick(d); 
      } catch {}
    };
  };
  
  open();
  return () => es?.close();
} 