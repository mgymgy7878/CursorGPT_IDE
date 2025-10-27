export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.EXECUTOR_URL ?? "http://127.0.0.1:4001";
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 3000);

  try {
    const upstream = await fetch(`${base}/metrics`, {
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "content-type": "text/plain; version=0.0.4" },
    });
  } catch (e) {
    return new Response("metrics_unavailable", { status: 503 });
  } finally {
    clearTimeout(t);
  }
}
