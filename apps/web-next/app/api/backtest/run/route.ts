import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Mock response for now - will be replaced with actual backtest engine
    const res = {
      ok: true,
      cash: body.initial || 10000,
      sameBarFills: 0,
      trades: 0,
      maxDrawdown: 0.05,
      sharpe: 1.2,
      runtime: 150
    };
    
    return new Response(JSON.stringify(res), { 
      headers: { "content-type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ 
      ok: false, 
      error: e?.message 
    }), { 
      status: 500, 
      headers: { "content-type": "application/json" }
    });
  }
}
