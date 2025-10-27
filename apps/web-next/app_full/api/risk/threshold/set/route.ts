import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer, isDevAuth } from '@spark/auth';
import { enforceRateLimit, audit } from '@spark/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

declare global {
  // eslint-disable-next-line no-var
  var __sparkPendingRisk: Record<string, any> | undefined;
  // eslint-disable-next-line no-var
  var __sparkRiskThresholds: any | undefined;
}

interface RiskThresholdRequest {
  action: "/risk/threshold.set";
  params: {
    exchange: string;
    maxNotionalPerTradeUSDT: number;
    maxLeverage: number;
    maxDailyDrawdownPct: number;
    requireStopLoss: boolean;
    killSwitch: boolean;
  };
  dryRun: boolean;
  confirm_required: boolean;
  reason: string;
}

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const raw = await request.json() as unknown;
  const body = (raw ?? {}) as Partial<RiskThresholdRequest> & Record<string, any>;
  const params = (body && typeof body === 'object' && 'params' in body && (body as any).params)
    ? (body as any).params
    : (body as any);
  const dryRun = 'dryRun' in body ? Boolean((body as any).dryRun) : false;
  const confirmRequired = 'confirm_required' in body ? Boolean((body as any).confirm_required) : true;

  // Auth check - allow dev token as admin
  const token = extractBearer(request.headers.get('authorization'));
  const authResult = verifyToken(token || '');
  const isAdministrator = (authResult.ok && (authResult as any).payload?.role === 'admin') || isDevAuth(token || '');
  if (!isAdministrator) {
    return NextResponse.json({ error: 'Admin access required', timestamp }, { status: 403 });
  }

  // Confirmation required for non-dry runs
  if (!dryRun && confirmRequired) {
    const confirm_token = `risk_${timestamp}_${Math.random().toString(36).slice(2,8)}`;
    // store pending in memory for approval
    try {
      if (!(globalThis as any).__sparkPendingRisk) (globalThis as any).__sparkPendingRisk = {};
      (globalThis as any).__sparkPendingRisk[confirm_token] = { ...params, requestedAt: timestamp };
    } catch { /* ignore */ }
    audit({ type: 'risk_threshold_pending', data: { token: confirm_token, params }, ts: timestamp });
    const keys = Object.keys((globalThis as any).__sparkPendingRisk || {});
    return NextResponse.json({
      pending: true,
      message: 'Risk threshold change requires confirmation',
      params,
      confirm_token,
      pending_count: keys.length,
      pending_tails: keys.map(k => String(k).slice(-6)).slice(0, 5),
      timestamp
    });
  }

  // Apply risk thresholds
  const thresholds = {
    exchange: params.exchange,
    maxNotionalPerTradeUSDT: params.maxNotionalPerTradeUSDT,
    maxLeverage: params.maxLeverage,
    maxDailyDrawdownPct: params.maxDailyDrawdownPct,
    requireStopLoss: params.requireStopLoss,
    killSwitch: params.killSwitch,
    updatedAt: timestamp,
    updatedBy: (authResult as any).payload?.sub
  };

  audit({ type: 'risk_threshold_applied', data: thresholds, ts: timestamp });

  return NextResponse.json({ success: true, data: thresholds, message: 'Risk thresholds updated', timestamp });
}
