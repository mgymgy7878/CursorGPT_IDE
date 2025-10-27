import client from "prom-client";

const r = new client.Registry();
client.collectDefaultMetrics({ register: r });

export async function GET() {
  return new Response(await r.metrics(), {
    headers: { "content-type": r.contentType },
  });
}
