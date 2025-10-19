import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

// Proxy: executor /tools/get_orders → { items: [...] }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=> ({}));
    const r = await fetch(`${EXECUTOR_BASE}/tools/get_orders`, {
      method: "POST",
      headers: { "content-type":"application/json","X-Spark-Actor":"ui","X-Spark-Source":"dashboard","X-Spark-Intent":"get-orders" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`executor ${r.status}`);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e:any) {
    // Graceful fallback
    return NextResponse.json({ items: [], _err: e?.message ?? "proxy-fail" }, { status: 200 });
  }
}
