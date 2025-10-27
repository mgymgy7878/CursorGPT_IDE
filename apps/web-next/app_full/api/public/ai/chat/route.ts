// apps/web-next/app/api/public/ai/chat/route.ts
export const revalidate = 0;

export async function GET(req: Request) {
	const url = new URL(req.url);
	const prompt = url.searchParams.get('prompt') ?? '';
	const base = process.env.EXECUTOR_BASE || process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
	const upstream = `${base.replace(/\/+$/,'')}/ai/chat?prompt=${encodeURIComponent(prompt)}`;
	const lastId = req.headers.get('last-event-id') || req.headers.get('last-eventid') || req.headers.get('last-event_id') || undefined;
	const headers: Record<string,string> = { Accept: 'text/event-stream' };
	if (lastId) headers['Last-Event-ID'] = lastId;
	const r = await fetch(upstream, { headers, cache:'no-store' });
	if (!r.ok || !r.body) return new Response(`Upstream ${r.status}`, { status: 502 });

	// Flush-first proxy stream
	const stream = new TransformStream();
	const writer = stream.writable.getWriter();
	await writer.write(new TextEncoder().encode(':\n\n'));
	writer.releaseLock();
	// Pipe upstream into our stream (after initial flush)
	void r.body.pipeTo(stream.writable).catch(()=>{});

	return new Response(stream.readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive'
		}
	});
}

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(()=>({}));
		const origin = process.env.EXECUTOR_ORIGIN || process.env.EXECUTOR_BASE || 'http://127.0.0.1:4001';
		if (origin) {
			const r = await fetch(`${origin.replace(/\$/,'')}/ai/chat`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
				cache: 'no-store',
			});
			if (!r.ok) throw new Error('upstream');
			const data = await r.json().catch(()=> ({}));
			return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
		}
	} catch {}
	// Fallback: basit kural tabanlı dönüş
	const { messages = [] } = await req.json().catch(()=>({ messages: [] })) as any;
	const last = messages[messages.length-1]?.content ?? '';
	let reply = 'Hazırım. Backtest/Alerts/Strategy için komut verin: "run backtest", "create price alert @…", "suggest params".';
	if (/backtest/i.test(last)) reply = 'Backtest: /backtest → CSV yükle veya Executor Job modunu başlat. TF ve PnL/DD panelleri hazır.';
	else if (/alert/i.test(last)) reply = 'Alerts: Dashboard → Panels → Alerts. kind: price/volume/rsi/macd, repeats & tags.';
	else if (/strategy|param/i.test(last)) reply = 'Strategy Lab: Prompt → Suggest → ParamDiff → Review & Apply. Risk seviyesi seçin.';
	return new Response(JSON.stringify({ reply }), { headers: { 'content-type': 'application/json' } });
} 