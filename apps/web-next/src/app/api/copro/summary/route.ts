export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

async function postJSON(url: string, body: any) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store" as any,
  }).catch(() => null);
  if (!r || !r.ok) return null;
  return await r.json().catch(() => null);
}

export async function POST() {
  const [status, orders, alerts] = await Promise.all([
    postJSON(`${EXEC}/tools/get_status`, {}),
    postJSON(`${EXEC}/tools/get_orders`, {}),
    fetch(`${EXEC}/alerts/list`, { cache: "no-store" as any }).then(r => r.ok ? r.json() : null).catch(()=>null),
  ]);

  const strategies = Array.isArray(status?.strategies) ? status.strategies : (status?.data ?? []);
  const openOrders = Array.isArray(orders?.orders) ? orders.orders : (orders?.data ?? []);
  const alertsArr = Array.isArray(alerts) ? alerts : (alerts?.data ?? alerts?.rows ?? []);

  const amber = strategies.filter((s:any)=> String(s?.health ?? s?.state ?? s?.status).toLowerCase().includes("amber")).length;
  const red   = strategies.filter((s:any)=> String(s?.health ?? s?.state ?? s?.status).toLowerCase().includes("red")).length;

  const out = {
    ts: Date.now(),
    counts: {
      strategies: strategies.length || 0,
      amber, red,
      openOrders: openOrders.length || 0,
      alertsActive: alertsArr?.filter((a:any)=> !a?.muted && (a?.enabled ?? true)).length || 0,
    },
    sample: {
      strategies: strategies.slice(0,5),
      orders: openOrders.slice(0,5),
      alerts: alertsArr?.slice?.(0,5) ?? [],
    }
  };
  return new Response(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json" } });
}


