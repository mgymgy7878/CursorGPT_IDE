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
  const out = {
    ts: Date.now(),
    sample: {
      strategies: strategies.slice(0, 20),
      orders: openOrders.slice(0, 20),
      alerts: alertsArr.slice(0, 20)
    }
  };
  return new Response(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json" } });
}


