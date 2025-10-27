import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EXECUTOR_ROOT = process.env.EXECUTOR_ROOT || path.join(process.cwd(), '../../services/executor');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const slugArray = slug || [];
    const filePath = path.join(EXECUTOR_ROOT, ...slugArray);

    // Security: prevent path traversal
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(EXECUTOR_ROOT);
    if (!resolvedPath.startsWith(resolvedRoot)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read and return file
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const filename = path.basename(resolvedPath);
    const ext = path.extname(filename);

    const contentType = ext === '.json' ? 'application/json' : 'text/csv';

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[Artifacts] Download error:', error);
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    );
  }
}
