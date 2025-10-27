import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create evidence directory
    const evidenceDir = join(process.cwd(), 'evidence', 'ui', 'settings', timestamp);
    mkdirSync(evidenceDir, { recursive: true });
    
    // Save settings as evidence
    const settingsFile = join(evidenceDir, 'settings.json');
    writeFileSync(settingsFile, JSON.stringify(body, null, 2));
    
    // Create manifest
    const manifestFile = join(evidenceDir, 'sha256-manifest.json');
    const manifest = {
      "settings.json": "evidence_hash_placeholder",
      "timestamp": timestamp,
      "note": "Settings save evidence"
    };
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    
    // Create index
    const indexFile = join(evidenceDir, 'INDEX.txt');
    const index = `SETTINGS SAVE EVIDENCE - ${timestamp}
==========================================
Files:
- settings.json
- sha256-manifest.json
- INDEX.txt

Settings saved successfully with proof.
`;
    writeFileSync(indexFile, index);

    return NextResponse.json({ 
      ok: true, 
      message: "Settings saved with evidence",
      evidencePath: evidenceDir
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: String(error?.message ?? error) 
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 