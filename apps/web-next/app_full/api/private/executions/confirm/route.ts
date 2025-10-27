import { NextRequest, NextResponse } from "next/server";
import { verifyToken, readCookie } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const token = readCookie(request);
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Trade confirm permission kontrolü
    if (!hasPermission(payload.role.toLowerCase(), "execute")) {
      return NextResponse.json({ error: "forbidden", message: "Trade confirmation permission required" }, { status: 403 });
    }

    const body = await request.json();
    const { executionId, approve = true } = body;

    if (!approve) {
      return NextResponse.json({ status: "cancelled", executionId }, { status: 200 });
    }

    // Executor'a confirm gönder
    const executorOrigin = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";

    const executorResponse = await fetch(`${executorOrigin}/api/public/strategy/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: "BTCUSDT", qty: 0.00012, side: "BUY", type: "MARKET" })
    });

    if (executorResponse.status === 202) {
      const result = await executorResponse.json();
      return NextResponse.json({
        status: "placed",
        executionId,
        orderId: result.exchange?.orderId || `ord_${Date.now()}`,
        clientId: result.clientId,
        shadow: result.shadow
      }, { status: 200 });
    }

    return NextResponse.json({ error: "executor_error" }, { status: 500 });

  } catch (error) {
    console.error("Execution confirm error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
} 