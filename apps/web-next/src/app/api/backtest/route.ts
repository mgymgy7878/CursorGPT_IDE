import { NextRequest, NextResponse } from 'next/server';
import { spawn, exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, tf, from, to, initial, feeBps, slippageBps, strategy } = body;

    // Validate inputs
    if (!symbol || !tf || !from || !to || !strategy) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // For now, use existing data file (in production, this would fetch fresh data)
    const dataFile = `./packages/marketdata/data/${symbol}_${tf}.csv`;
    
    // Build backtest command
    const cmd = [
      'pnpm', '-F', '@spark/backtest', 'exec',
      '--strategy', strategy,
      '--file', dataFile,
      '--initial', initial.toString(),
      '--fee-bps', feeBps.toString(),
      '--slippage-bps', slippageBps.toString(),
      '--cash-mode', 'strict',
      '--next-bar-open', 'true'
    ];

    console.log('Running backtest:', cmd.join(' '));

    // Execute backtest
    const { stdout, stderr } = await exec(cmd.join(' '), {
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });

    if (stderr) {
      console.error('Backtest stderr:', stderr);
    }

    // Parse JSON result
    const result = JSON.parse(stdout.trim());
    
    // Validate result
    if (!result.ok) {
      return NextResponse.json({ error: 'Backtest failed', details: result }, { status: 500 });
    }

    // Check for negative cash (invalid result)
    if (result.cash < 0) {
      return NextResponse.json({ 
        error: 'Invalid backtest result: negative cash detected',
        result 
      }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Backtest API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
