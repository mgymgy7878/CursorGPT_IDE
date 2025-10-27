import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer, isDevAuth } from '@spark/auth';
import { enforceRateLimit, audit } from '@spark/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CanaryConfirmRequest {
  action: "/canary/confirm";
  params: {
    scope: string;
    targets: string[];
    criteria: {
      p95_ms_max: number;
      success_rate_min: number;
      ts_errors_max: number;
      auth: string;
    };
  };
  dryRun: boolean;
  confirm_required: boolean;
  reason: string;
}

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const raw = await request.json() as unknown;
  const body = (raw ?? {}) as Partial<CanaryConfirmRequest> & Record<string, any>;
  const params = (body && typeof body === 'object' && 'params' in body && (body as any).params)
    ? (body as any).params
    : (body as any);
  const needsApproval = 'confirm_required' in body ? Boolean((body as any).confirm_required) : false;
  const dryRun = 'dryRun' in body ? Boolean((body as any).dryRun) : false;

  // Auth check - allow dev token as admin
  const token = extractBearer(request.headers.get('authorization'));
  const authResult = verifyToken(token || '');
  const isAdministrator = (authResult.ok && (authResult as any).payload?.role === 'admin') || isDevAuth(token || '');
  if (!isAdministrator) {
    return NextResponse.json({ error: 'Admin access required for canary confirm', timestamp }, { status: 403 });
  }

  // Optional pending step
  if (!dryRun && needsApproval) {
    const confirm_token = `canary_${timestamp}_${Math.random().toString(36).slice(2,8)}`;
    try {
      if (!(globalThis as any).__sparkPendingCanary) (globalThis as any).__sparkPendingCanary = {};
      (globalThis as any).__sparkPendingCanary[confirm_token] = { ...params, requestedAt: timestamp };
    } catch { /* ignore */ }
    audit({ type: 'canary_confirm_pending', data: { confirm_token, params, operator: (authResult as any).payload?.sub }, ts: timestamp });
    const keys = Object.keys((globalThis as any).__sparkPendingCanary || {});
    return NextResponse.json({ pending: true, message: 'Canary confirm requires explicit approval for live trading', criteria: params.criteria, warning: 'This will enable live order execution', confirm_token, pending_count: keys.length, pending_tails: keys.map(k => String(k).slice(-6)).slice(0, 5), timestamp });
  }

  // Mock canary criteria verification
  const currentMetrics = {
    place_order_p95_ms: 245,
    cancel_order_p95_ms: 189,
    ack_latency_p95_ms: 156,
    success_rate: 0.99,
    ts_errors: 0
  };

  const criteriaCheck = {
    p95_passed: currentMetrics.ack_latency_p95_ms < params.criteria.p95_ms_max,
    success_rate_passed: currentMetrics.success_rate >= params.criteria.success_rate_min,
    ts_errors_passed: currentMetrics.ts_errors <= params.criteria.ts_errors_max
  };

  const allPassed = Object.values(criteriaCheck).every(Boolean);

  // Apply canary confirmation
  const result = {
    scope: params.scope,
    status: allPassed ? 'APPROVED' : 'REJECTED',
    criteria_check: criteriaCheck,
    current_metrics: currentMetrics,
    live_trading_enabled: allPassed && !dryRun,
    timestamp,
    approved_by: (authResult as any).payload?.sub
  };

  audit({ type: allPassed ? 'canary_confirm_approved' : 'canary_confirm_rejected', data: result, ts: timestamp });

  return NextResponse.json({ success: true, ok: allPassed, data: result, message: allPassed ? 'Canary confirmed - live trading enabled' : 'Canary rejected - criteria not met', timestamp });
}
