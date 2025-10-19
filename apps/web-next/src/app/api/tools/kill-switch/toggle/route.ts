/**
 * Kill Switch Toggle API
 * Toggle between REAL and MOCK data modes
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const envPath = join(process.cwd(), 'apps', 'web-next', '.env.local');
    
    let currentEnv = '';
    if (existsSync(envPath)) {
      currentEnv = readFileSync(envPath, 'utf-8');
    }

    // Remove existing SPARK_REAL_DATA line
    const lines = currentEnv.split('\n').filter(line => 
      !line.includes('SPARK_REAL_DATA')
    );

    let newValue = '0'; // Default to MOCK
    if (action === 'enable' || action === 'real') {
      newValue = '1';
    }

    // Add new value
    lines.push(`SPARK_REAL_DATA=${newValue}`);
    
    const newEnv = lines.join('\n');
    writeFileSync(envPath, newEnv);

    const mode = newValue === '1' ? 'REAL' : 'MOCK';
    
    return NextResponse.json({
      success: true,
      mode,
      message: `Kill switch set to ${mode} mode`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const envPath = join(process.cwd(), 'apps', 'web-next', '.env.local');
    
    if (!existsSync(envPath)) {
      return NextResponse.json({
        success: true,
        mode: 'MOCK',
        message: 'No .env.local found, defaulting to MOCK'
      });
    }

    const envContent = readFileSync(envPath, 'utf-8');
    const realDataLine = envContent.split('\n').find(line => 
      line.includes('SPARK_REAL_DATA')
    );

    const mode = realDataLine?.includes('=1') ? 'REAL' : 'MOCK';
    
    return NextResponse.json({
      success: true,
      mode,
      message: `Current mode: ${mode}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
