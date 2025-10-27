import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Simple health check for smoke tests and monitoring
 */

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'spark-web-next',
    version: process.env.BUILD_ID || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

