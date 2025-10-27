import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In a real app, this would read from a database or config file
    const settings = {
      EXEC_ORIGIN: process.env.EXEC_ORIGIN || "http://127.0.0.1:4001",
      PRODUCTION_CAP_USD: process.env.PRODUCTION_CAP_USD || "10000",
      refreshInterval: "5000",
      featureFlags: {
        canaryMode: true,
        evidenceCollection: true,
        guardrails: true
      }
    };

    return NextResponse.json({ 
      ok: true, 
      settings 
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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