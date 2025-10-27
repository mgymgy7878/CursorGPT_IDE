import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@spark/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const window = searchParams.get("window") || "24h";
    
    // Window'u saat cinsine çevir
    let hours = 24;
    if (window === "1h") hours = 1;
    else if (window === "6h") hours = 6;
    else if (window === "12h") hours = 12;
    else if (window === "24h") hours = 24;
    else if (window === "7d") hours = 24 * 7;
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const prisma = getPrisma();

    // Son değerleri al (sayaçlar için son değer, diğerleri için ortalama)
    const [liveTrades, blockedTotal, rbacBlocked] = await Promise.all([
      // Live trades (son değer)
      prisma.metricsSample.findFirst({
        where: {
          name: "live_trades_total",
          ts: { gte: since }
        },
        orderBy: { ts: "desc" }
      }),
      
      // Blocked total (toplam)
      prisma.metricsSample.aggregate({
        where: {
          name: { startsWith: "live_blocked_total" },
          ts: { gte: since }
        },
        _sum: { value: true }
      }),
      
      // RBAC blocked (son değer)
      prisma.metricsSample.findFirst({
        where: {
          name: "rbac_blocked_total",
          ts: { gte: since }
        },
        orderBy: { ts: "desc" }
      })
    ]);

    return NextResponse.json({
      ok: true,
      window,
      summary: {
        liveTrades24h: liveTrades?.value || 0,
        blocked24h: blockedTotal._sum.value || 0,
        rbacBlocked24h: rbacBlocked?.value || 0
      }
    });
  } catch (error) {
    console.error("Metrics summary error:", error);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
} 