import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@spark/auth';
import { enforceRateLimit, audit } from '@spark/security';

export const dynamic = 'force-dynamic';

interface AlertRule {
  kind: 'price' | 'metric';
  symbol?: string;
  name?: string;
  op: 'lt' | 'gt' | 'eq';
  value: number;
  ttl: string;
}

interface AlertCreateRequest {
  action: "/alerts/create";
  params: AlertRule[];
  dryRun: boolean;
  confirm_required: boolean;
  reason: string;
}

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const raw = await request.json() as unknown;
  const body = (raw ?? {}) as Partial<AlertCreateRequest> & Record<string, any>;
  const rules: AlertRule[] = Array.isArray(body) ? (body as any) : (Array.isArray((body as any).params) ? (body as any).params : []);
  
  // Auth check
  const authHeader = extractBearer(request.headers.get('authorization'));
  const authResult = verifyToken(authHeader || '');
  
  if (!authResult.ok) {
    return NextResponse.json({ error: 'Unauthorized', timestamp }, { status: 401 });
  }

  // Rate limiting
  const rateLimit = enforceRateLimit(undefined, 1);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Rate limited', retryAfterMs: rateLimit.retryAfterMs, timestamp }, { status: 429 });
  }

  // Create alerts
  const alertIds: string[] = [];
  const results: any[] = [];

  for (const alertRule of rules) {
    const alertId = `alert_${timestamp}_${Math.random().toString(36).slice(2,8)}`;
    alertIds.push(alertId);
    
    const alert = {
      id: alertId,
      kind: alertRule.kind,
      symbol: alertRule.symbol,
      metric_name: alertRule.name,
      operator: alertRule.op,
      threshold: alertRule.value,
      ttl: alertRule.ttl,
      active: true,
      created_at: timestamp,
      created_by: (authResult as any).payload?.sub
    };
    
    results.push(alert);

    // Audit each alert creation
    audit({ type: 'alert_created', data: alert, ts: timestamp });
  }

  return NextResponse.json({ success: true, data: { alerts: results, count: results.length, alert_ids: alertIds }, message: `${results.length} alert(s) created successfully`, timestamp });
}
