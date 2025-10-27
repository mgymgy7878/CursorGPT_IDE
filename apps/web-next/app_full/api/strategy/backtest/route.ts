export async function POST(req: Request) {
	const body = await req.json().catch(() => ({} as any));
	return Response.json({ pnl: 123, bars: (body?.candles?.length ?? 0) });
} 
