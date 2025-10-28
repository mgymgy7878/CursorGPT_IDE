import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Simple health check for smoke tests and monitoring
 */

export async function GET() {
  const commitSha = process.env.BUILD_ID || process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
  const repoUrl = 'https://github.com/mgymgy7878/CursorGPT_IDE';
  
  return NextResponse.json({
    status: 'ok',
    service: 'spark-web-next',
    version: commitSha,
    commitUrl: commitSha !== 'dev' ? `${repoUrl}/commit/${commitSha}` : null,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

