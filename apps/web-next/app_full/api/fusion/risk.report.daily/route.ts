import { NextRequest, NextResponse } from 'next/server';
import { extractBearer, verifyToken } from '@spark/auth';
import { audit } from '@spark/security';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const token = extractBearer(request.headers.get('authorization'));
  const auth = verifyToken(token || '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  audit({ type: 'risk_report_daily_requested', data: body, ts: timestamp });

  // Stub: return artifact descriptors
  const artefacts = [
    { kind: 'CSV', name: 'latency.csv' },
    { kind: 'CSV', name: 'fills.csv' },
    { kind: 'CSV', name: 'pnl.csv' },
    { kind: 'CSV', name: 'drawdown.csv' },
    { kind: 'PDF', name: 'daily_risk_summary.pdf' }
  ];
  return NextResponse.json({ ok: true, data: { artefacts }, timestamp });
}


