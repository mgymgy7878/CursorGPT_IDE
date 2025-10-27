import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const executorOrigin = process.env.EXEC_ORIGIN || "http://127.0.0.1:4001";
    const response = await fetch(`${executorOrigin}/evidence/latest`, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Executor responded with ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Spark-Trace-Id': `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: String(error?.message ?? error)
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 