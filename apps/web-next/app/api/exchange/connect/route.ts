import { NextRequest } from 'next/server';
import { forward } from '../../_utils/forward';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const body = await req.text();
  const resp = await forward('/exchange/connect', { method: 'POST', body, headers: { 'content-type':'application/json' }});
  return new Response(await resp.text(), { status: resp.status });
}
