import { NextRequest, NextResponse } from 'next/server';
import { enforcePolicy, getActionEndpoint } from '@/lib/copilot/policy';
import type { ActionJSON } from '@/types/copilot';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

// Audit logging - enhanced with latency, status, correlation_id
function auditLog(
  action: ActionJSON,
  hasToken: boolean,
  result: any,
  latency_ms: number,
  status_code: number,
  cid: string
) {
  try {
    const logDir = path.join(process.cwd(), 'logs', 'audit');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const logFile = path.join(logDir, `copilot_${today}.log`);

    const entry = {
      ts: new Date().toISOString(),
      cid,
      latency_ms,
      status_code,
      endpoint: 'action',
      action: action.action,
      params: action.params,
      dryRun: action.dryRun,
      hasToken,
      result: result.success ? 'success' : 'error',
      error: result.error || null,
    };

    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('[Audit] Log write failed:', err);
  }
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const cid = crypto.randomUUID();
  let status = 200;
  let body: any;
  let action: ActionJSON | null = null;

  try {
    action = await req.json();

    // Validate action structure
    if (!action.action || typeof action.params !== 'object') {
      status = 400;
      body = { success: false, error: 'Invalid action structure' };
      return NextResponse.json(body, { status });
    }

    // Check admin token
    const adminToken =
      req.headers.get('x-admin-token') ||
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      '';
    const hasAdminToken = adminToken === process.env.ADMIN_TOKEN;

    // Enforce policy
    const policyCheck = enforcePolicy(action, hasAdminToken);

    if (!policyCheck.allowed) {
      status = hasAdminToken ? 403 : 401;
      body = {
        success: false,
        error: policyCheck.error,
        needsConfirm: policyCheck.needsConfirm,
      };
      return NextResponse.json({ cid, ...body }, { status });
    }

    // Get endpoint
    const endpoint = getActionEndpoint(action.action);

    // Execute action
    const targetUrl = `${EXECUTOR_URL}${endpoint}`;
    
    const res = await fetch(targetUrl, {
      method: action.action.startsWith('tools/get_') ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(hasAdminToken ? { 'x-admin-token': adminToken } : {}),
      },
      ...(action.action.startsWith('tools/get_') ? {} : {
        body: JSON.stringify({
          ...action.params,
          dryRun: action.dryRun,
        }),
      }),
      signal: AbortSignal.timeout(10000),
    });

    const result = await res.json();
    status = res.status;

    // Check if confirmation needed
    if (policyCheck.needsConfirm && action.dryRun) {
      body = {
        success: true,
        needsConfirm: true,
        dryRunResult: result,
        message: 'Dry run complete. Send with dryRun=false to apply.',
      };
      return NextResponse.json({ cid, ...body });
    }

    body = {
      success: res.ok,
      data: result,
    };
    return NextResponse.json({ cid, ...body }, { status });
  } catch (error: any) {
    console.error('[Copilot Action] Error:', error);
    status = 500;
    body = {
      success: false,
      error: error.message || 'Internal error',
    };
    return NextResponse.json({ cid, ...body }, { status });
  } finally {
    const latency = Date.now() - started;
    auditLog(
      action || { action: 'unknown', params: {}, dryRun: true, confirm_required: false, reason: 'unknown' },
      false,
      body || {},
      latency,
      status,
      cid
    );
  }
}

