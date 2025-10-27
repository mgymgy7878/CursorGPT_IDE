import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  
  try {
    // 1. Try to fetch from executor first (for live jobs)
    const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';
    
    try {
      const statusResponse = await fetch(`${EXECUTOR_URL}/export/status`, {
        signal: AbortSignal.timeout(2000)
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const job = (statusData.exports || []).find((j: any) => j.id === jobId);
        if (job) {
          return NextResponse.json(job);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch live job status:', e);
    }
    
    // 2. Try to find in exports directory (for completed jobs)
    const exportsDir = join(process.cwd(), '..', '..', 'exports');
    const possibleExtensions = ['csv', 'pdf'];
    
    for (const ext of possibleExtensions) {
      try {
        const filePath = join(exportsDir, `${jobId}.${ext}`);
        const fileContent = await readFile(filePath);
        const stats = await require('fs/promises').stat(filePath);
        
        return NextResponse.json({
          id: jobId,
          type: jobId.split('-')[1] || 'data',
          format: ext,
          size: stats.size,
          sizeKb: Math.round(stats.size / 1024),
          status: 'done',
          progress: 100,
          startedAt: stats.birthtime.toISOString(),
          finishedAt: stats.mtime.toISOString(),
          durationMs: Math.round(stats.mtime.getTime() - stats.birthtime.getTime()),
          downloadUrl: `/exports/${jobId}.${ext}`,
          preview: ext === 'csv' ? fileContent.toString().split('\n').slice(0, 10).join('\n') : undefined
        });
      } catch (e) {
        // Continue to next extension
      }
    }
    
    // 3. Not found
    return NextResponse.json(
      { error: 'Export job not found', id: jobId },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

