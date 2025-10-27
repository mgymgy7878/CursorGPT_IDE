export const dynamic = "force-dynamic";

const DEF = { equity: 0, balance: 0, margin: 0, pnl24h: 0, updatedAt: null };

export async function GET() {
  const base = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
  try {
    const r = await fetch(`${base}/api/portfolio/summary`, { cache: "no-store" });
    const up = r.ok ? await r.json() : {};
    return Response.json({ ...DEF, ...up }, { status: 200 });
  } catch {
    return Response.json(DEF, { status: 200 });
  }
}
