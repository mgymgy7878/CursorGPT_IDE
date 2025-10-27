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
    
    // Trade execute permission kontrolü
    if (!hasPermission(payload.role.toLowerCase(), "execute")) {
      return NextResponse.json({ error: "forbidden", message: "Trade execution permission required" }, { status: 403 });
    }

    const body = await request.json();
    const { strategyId, mode = "testnet", symbol, qty, confirm = "human" } = body;

    // Validation
    if (!symbol || !qty) {
      return NextResponse.json({ error: "validation_error", message: "symbol and qty required" }, { status: 422 });
    }

    // Risk precheck
    const notional = qty * 45000; // Mock price
    if (notional > 20) {
      return NextResponse.json({ error: "risk_limit", message: "Notional exceeds limit" }, { status: 409 });
    }

    // Executor'a gönder
    const executorOrigin = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
    const executionId = `exec_${Date.now()}`;

    const executorResponse = await fetch(`${executorOrigin}/api/public/strategy/deploy-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, qty, side: "BUY", type: "MARKET" })
    });

    if (executorResponse.status === 202) {
      const result = await executorResponse.json();
      return NextResponse.json({
        status: "confirm_required",
        executionId,
        echo: result.echo
      }, { status: 202 });
    }

    if (executorResponse.status === 403) {
      const result = await executorResponse.json();
      return NextResponse.json({
        status: "blocked",
        reason: result.code,
        executionId
      }, { status: 403 });
    }

    return NextResponse.json({ error: "executor_error" }, { status: 500 });

  } catch (error) {
    console.error("Execution start error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
} 