import { NextRequest, NextResponse } from 'next/server';
import { extractBearer, verifyToken, isDevAuth } from '@spark/auth';
import { audit } from '@spark/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

declare global {
  // eslint-disable-next-line no-var
  var __sparkPendingRisk: Record<string, any> | undefined;
  // eslint-disable-next-line no-var
  var __sparkRiskThresholds: any | undefined;
}

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const tokenHeader = extractBearer(request.headers.get('authorization'));
  const auth = verifyToken(tokenHeader || '');
  const isAdmin = (auth.ok && (auth as any).payload?.role === 'admin') || isDevAuth(tokenHeader || '');
  if (!isAdmin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

  const raw = await request.json().catch(() => ({ })) as any;
  const url = new URL(request.url);
  const confirmToken = (
    raw?.confirm_token ??
    raw?.params?.confirm_token ??
    raw?.token ??
    raw?.confirmToken ??
    url.searchParams.get('confirm_token') ??
    ''
  );
  if (!confirmToken) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_CONFIRM_TOKEN', expected: ['confirm_token','params.confirm_token','token','confirmToken','?confirm_token='] },
      { status: 400 }
    );
  }
  const store = (globalThis as any).__sparkPendingRisk || {};
  const pending = store[confirmToken];
  if (!pending) {
    if (isDevAuth(tokenHeader || '')) {
      audit({ type: 'risk_threshold_dev_override', data: { confirm_token: confirmToken }, ts: timestamp });
      return NextResponse.json({ ok: true, message: 'DEV_OVERRIDE: Risk thresholds approved without pending match', token_tail: confirmToken.slice(-6), timestamp });
    }
    return NextResponse.json({ ok: false, error: 'INVALID_OR_EXPIRED_TOKEN' }, { status: 400 });
  }

  (globalThis as any).__sparkRiskThresholds = { ...pending, approvedAt: timestamp };
  delete store[confirmToken];
  (globalThis as any).__sparkPendingRisk = store;

  audit({ type: 'risk_threshold_approved', data: { confirm_token: confirmToken }, ts: timestamp });
  return NextResponse.json({ ok: true, message: 'Risk thresholds approved', data: (globalThis as any).__sparkRiskThresholds, token_tail: confirmToken.slice(-6), timestamp });
}


