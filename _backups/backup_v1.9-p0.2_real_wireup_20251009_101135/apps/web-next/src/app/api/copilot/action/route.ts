import { NextRequest, NextResponse } from 'next/server';
import { enforcePolicy, getActionEndpoint } from '@/lib/copilot/policy';
import type { ActionJSON } from '@/types/copilot';
import fs from 'fs';
import path from 'path';

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

// Audit logging
function auditLog(action: ActionJSON, hasToken: boolean, result: any) {
  try {
    const logDir = path.join(process.cwd(), 'logs', 'audit');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const logFile = path.join(logDir, `copilot_${today}.log`);

    const entry = {
      timestamp: new Date().toISOString(),
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
  try {
    const action: ActionJSON = await req.json();

    // Validate action structure
    if (!action.action || typeof action.params !== 'object') {
      return NextResponse.json(
        { error: 'Invalid action structure' },
        { status: 400 }
      );
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
      auditLog(action, hasAdminToken, { success: false, error: policyCheck.error });
      return NextResponse.json(
        {
          success: false,
          error: policyCheck.error,
          needsConfirm: policyCheck.needsConfirm,
        },
        { status: hasAdminToken ? 403 : 401 }
      );
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

    // Audit log
    auditLog(action, hasAdminToken, { success: res.ok, data: result });

    // Check if confirmation needed
    if (policyCheck.needsConfirm && action.dryRun) {
      return NextResponse.json({
        success: true,
        needsConfirm: true,
        dryRunResult: result,
        message: 'Dry run complete. Send with dryRun=false to apply.',
      });
    }

    return NextResponse.json({
      success: res.ok,
      data: result,
    });
  } catch (error: any) {
    console.error('[Copilot Action] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal error',
      },
      { status: 500 }
    );
  }
}

