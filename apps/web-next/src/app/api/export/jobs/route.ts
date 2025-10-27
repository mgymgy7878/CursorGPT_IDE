import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // 1. Fetch live status from executor
    const EXECUTOR_URL = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';
    let liveJobs: any[] = [];
    
    try {
      const statusResponse = await fetch(`${EXECUTOR_URL}/export/status`, {
        signal: AbortSignal.timeout(2000)
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        liveJobs = statusData.exports || [];
      }
    } catch (e) {
      console.warn('Failed to fetch live export status:', e);
    }
    
    // 2. Scan exports directory for completed files
    const exportsDir = join(process.cwd(), '..', '..', 'exports');
    let completedJobs: any[] = [];
    
    try {
      const files = await readdir(exportsDir);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = join(exportsDir, file);
          const stats = await stat(filePath);
          return { file, stats };
        })
      );
      
      // Parse filename: export-{type}-{timestamp}.{format}
      completedJobs = fileStats
        .filter(({ file }) => file.startsWith('export-'))
        .map(({ file, stats }) => {
          const parts = file.split('-');
          const type = parts[1] || 'data';
          const timestampPart = parts[2] || '';
          const [timestamp, formatExt] = timestampPart.split('.');
          const format = formatExt || 'csv';
          
          return {
            id: file.replace(/\.[^/.]+$/, ''), // Remove extension
            type,
            format,
            size: stats.size,
            sizeKb: Math.round(stats.size / 1024),
            status: 'done',
            progress: 100,
            startedAt: stats.birthtime.toISOString(),
            finishedAt: stats.mtime.toISOString(),
            durationMs: Math.round(stats.mtime.getTime() - stats.birthtime.getTime()),
            downloadUrl: `/exports/${file}`
          };
        });
    } catch (e) {
      console.warn('Failed to scan exports directory:', e);
    }
    
    // 3. Merge live + completed (prioritize live status)
    const liveJobIds = new Set(liveJobs.map((j: any) => j.id));
    const allJobs = [
      ...liveJobs,
      ...completedJobs.filter(j => !liveJobIds.has(j.id))
    ].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    // 4. Calculate stats
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    
    const stats = {
      running: allJobs.filter(j => j.status === 'running').length,
      queued: allJobs.filter(j => j.status === 'queued').length,
      done: allJobs.filter(j => j.status === 'done').length,
      failed: allJobs.filter(j => j.status === 'failed').length,
      total24h: allJobs.filter(j => new Date(j.startedAt).getTime() > last24h).length
    };
    
    return NextResponse.json({ jobs: allJobs, stats });
  } catch (error: any) {
    console.error('Error fetching export jobs:', error);
    
    // Fallback to mock data
    const mockJobs = [
      {
        id: 'export-data-1728387600000',
        type: 'data',
        format: 'csv',
        size: 1024 * 512, // 512 KB
        status: 'done',
        progress: 100,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        finishedAt: new Date(Date.now() - 3540000).toISOString(),
        durationMs: 60000,
        downloadUrl: '/exports/export-data-1728387600000.csv'
      },
      {
        id: 'export-report-1728387650000',
        type: 'report',
        format: 'pdf',
        size: 1024 * 256, // 256 KB
        status: 'done',
        progress: 100,
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        finishedAt: new Date(Date.now() - 1750000).toISOString(),
        durationMs: 50000,
        downloadUrl: '/exports/export-report-1728387650000.pdf'
      }
    ];
    
    return NextResponse.json({
      jobs: mockJobs,
      stats: {
        running: 0,
        queued: 0,
        done: 2,
        failed: 0,
        total24h: 2
      },
      fallback: true
    });
  }
}

