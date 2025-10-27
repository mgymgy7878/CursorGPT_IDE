import { NextRequest, NextResponse } from "next/server";
import { getRaw } from "@/lib/vault";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN;
  if (!origin) {
    metrics.incExecutorSyncFailed();
    return NextResponse.json({ error: "missing_EXECUTOR_ORIGIN" }, { status: 500 });
  }

  try {
    // Vault'tan EXECUTOR_TOKEN'ı al
    const token = getRaw("EXECUTOR_TOKEN");
    if (!token) {
      metrics.incExecutorSyncFailed();
      return NextResponse.json({ 
        error: "no_token", 
        message: "EXECUTOR_TOKEN vault'ta bulunamadı" 
      }, { status: 400 });
    }

    // Executor'a token'ı gönder
    const response = await fetch(`${origin}/api/private/settings`, {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "token_sync",
        token: token
      }),
      cache: "no-store"
    });

    if (response.ok) {
      metrics.incExecutorSyncSuccess();
      return NextResponse.json({ 
        ok: true, 
        message: "Token executor'a başarıyla aktarıldı" 
      });
    } else {
      metrics.incExecutorSyncFailed();
      return NextResponse.json({ 
        error: "executor_sync_failed", 
        message: "Executor sync başarısız",
        status: response.status 
      }, { status: 502 });
    }

  } catch (error: any) {
    metrics.incExecutorSyncFailed();
    return NextResponse.json({ 
      error: "sync_error", 
      message: error?.message || "Sync hatası" 
    }, { status: 500 });
  }
} 