import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Try to read PSI snapshot from evidence
    const psiPath = join(process.cwd(), '..', '..', 'evidence', 'ml', 'psi_snapshot.json');
    const psiData = readFileSync(psiPath, 'utf-8');
    const snapshot = JSON.parse(psiData);
    
    // Transform to UI-friendly format
    const features = Object.entries(snapshot.features || {}).map(([name, data]: [string, any]) => ({
      name,
      psi: data.psi,
      status: data.status,
      current_dist: data.current_dist,
      reference_dist: data.reference_dist
    }));
    
    return NextResponse.json({
      overall_psi: snapshot.overall_psi,
      overall_status: snapshot.overall_status,
      features,
      thresholds: snapshot.thresholds,
      timestamp: snapshot.timestamp,
      slo_check: snapshot.slo_check
    });
  } catch (error) {
    // Fallback to known values if file not available
    return NextResponse.json({
      overall_psi: 1.25,
      overall_status: 'critical',
      features: [
        { name: 'mid', psi: 4.87, status: 'critical' },
        { name: 'spreadBp', psi: 0.05, status: 'stable' },
        { name: 'vol1m', psi: 0.01, status: 'stable' },
        { name: 'rsi14', psi: 0.08, status: 'stable' }
      ],
      thresholds: {
        stable: '< 0.1',
        warning: '0.1 - 0.2',
        critical: '> 0.2'
      },
      timestamp: new Date().toISOString(),
      slo_check: {
        psi_under_0_2: false,
        pass: false
      },
      fallback: true
    });
  }
}

