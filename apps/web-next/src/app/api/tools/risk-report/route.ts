/**
 * Daily Risk Report API
 * GET /api/tools/risk-report?emitZip=true
 * 
 * Generates daily evidence package (health, metrics, canary)
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

// Risk Report Types
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type ReportStatus = 'OK' | 'DEGRADED' | 'CRITICAL';

interface RiskSummary {
  status: ReportStatus;
  canaryPass: number;
  canaryTotal: number;
  riskLevel: RiskLevel;
  issues: string[];
  recommendation: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emitZip = searchParams.get('emitZip') === 'true';

  try {
    const baseUrl = 'http://localhost:3003';

    // Collect evidence
    const [health, canary, metrics] = await Promise.allSettled([
      fetch(`${baseUrl}/api/healthz`).then(r => r.json()),
      fetch(`${baseUrl}/api/tools/canary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'mock', autoOk: true })
      }).then(r => r.json()),
      fetch(`${baseUrl}/api/tools/metrics`).then(r => r.json())
    ]);

    // Assess risk level
    let riskLevel: RiskLevel = 'LOW';
    const issues: string[] = [];
    let reportStatus: ReportStatus = 'OK';

    const canaryPass = canary.status === 'fulfilled' ? canary.value.pass : 0;
    const canaryTotal = canary.status === 'fulfilled' ? canary.value.total : 6;

    if (health.status === 'fulfilled' && health.value.slo) {
      const slo = health.value.slo;
      const thresholds = health.value.thresholds;

      if (slo.latencyP95 > thresholds.latencyP95Target) {
        issues.push(`High latency: ${slo.latencyP95}ms`);
        riskLevel = 'MEDIUM';
        reportStatus = 'DEGRADED';
      }

      if (slo.errorRate > thresholds.errorRateTarget) {
        issues.push(`High error rate: ${slo.errorRate}%`);
        riskLevel = 'HIGH';
        reportStatus = 'CRITICAL';
      }

      if (slo.stalenessSec > thresholds.stalenessTarget) {
        issues.push(`Stale data: ${slo.stalenessSec}s`);
        if (riskLevel === 'LOW') {
          riskLevel = 'MEDIUM';
          reportStatus = 'DEGRADED';
        }
      }
    }

    if (canaryTotal > 0 && canaryPass < canaryTotal) {
      issues.push(`Canary failures: ${canaryTotal - canaryPass}`);
      riskLevel = 'HIGH';
      reportStatus = 'CRITICAL';
    }

    const summary: RiskSummary = {
      status: reportStatus,
      canaryPass,
      canaryTotal,
      riskLevel,
      issues,
      recommendation: riskLevel === 'LOW' 
        ? 'System healthy, safe to deploy'
        : riskLevel === 'MEDIUM'
        ? 'Monitor closely, defer non-critical deploys'
        : 'Do not deploy, investigate issues'
    };

    const report = {
      generated: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      summary,
      health: health.status === 'fulfilled' ? health.value : { error: health.reason },
      canary: canary.status === 'fulfilled' ? canary.value : { error: canary.reason },
      metrics: metrics.status === 'fulfilled' ? metrics.value : { error: metrics.reason },
      metadata: {
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        baseUrl,
      }
    };

    if (emitZip) {
      // Return as downloadable JSON (client-side can zip)
      const filename = `spark-risk-report-${report.date}.json`;
      
      return new Response(JSON.stringify(report, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      });
    } else {
      return new Response(JSON.stringify(report), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to generate risk report',
        message: error.message,
        generated: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
