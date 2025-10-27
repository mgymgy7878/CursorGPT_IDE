export type Account = { exchange:string; equityUSD:number; pnl24h:number; positions:number };
export type AssetRow = { asset:string; qty:number; price:number; value:number; pct:number };
export async function getPortfolioSummary(): Promise<{accounts:Account[]; byAsset:AssetRow[]}>{
  const baseUrl = process.env.NEXT_PUBLIC_EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
  const r = await fetch(`${baseUrl}/api/portfolio/summary`, { cache: 'no-store' });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}


