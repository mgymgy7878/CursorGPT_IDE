export const dynamic = "force-dynamic";

type Pos = {
  symbol: string; side: string; qty: number; entry: number;
  pnl?: number; unrealizedPnl?: number; updatedAt?: string | null;
};

export async function GET() {
  const base = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
  try {
    const r = await fetch(`${base}/api/portfolio/positions`, { cache: "no-store" });
    const arr = r.ok ? await r.json() : [];
    const norm = (Array.isArray(arr) ? arr : []).map((p: any): Pos => ({
      symbol: p?.symbol ?? "—",
      side: p?.side ?? "—",
      qty: Number(p?.qty ?? 0),
      entry: Number(p?.entry ?? 0),
      pnl: Number(p?.pnl ?? 0),
      unrealizedPnl: Number(p?.unrealizedPnl ?? 0),
      updatedAt: p?.updatedAt ?? null,
    }));
    return Response.json(norm, { status: 200 });
  } catch {
    return Response.json([], { status: 200 });
  }
}
