import { NextRequest } from 'next/server';
import { forward } from '../../_utils/forward';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const resp = await forward('/strategy/run', { method: 'POST', body: await req.text(), headers: { 'content-type':'application/json' }});
  return new Response(await resp.text(), { status: resp.status });
}
