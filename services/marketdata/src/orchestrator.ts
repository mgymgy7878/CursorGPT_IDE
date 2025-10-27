// Feed Orchestrator
// btcturk + bist kaynaklarını başlat/durdur, event fwd

import { EventEmitter } from 'events';
// import { BTCTurkClient } from '@spark/exchange-btcturk';
// import { BISTReader } from '@spark/market-bist';
// import { normalize, isSupportedPair } from '@spark/symbols';
import { feedEventsTotal, wsReconnectsTotal, feedLatencyMs } from './metrics.js';
import { DBSink } from './db/sink.js';
import { loadConfig } from './config.js';

export class FeedOrchestrator extends EventEmitter {
  private isRunning = false;
  private config = loadConfig();
  private lastEventTs: { [source: string]: number } = {};
  private lastDbWriteTs: { [source: string]: number } = {};
  private lastError: { [source: string]: string } = {};

  constructor() {
    super();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Market data orchestrator started (mock mode)');
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('Market data orchestrator stopped');
    this.emit('stopped');
  }

  getStatus(): { btcturk: boolean; bist: boolean } {
    return {
      btcturk: false,
      bist: false
    };
  }

  getHealthStatus(): { [source: string]: { lastEventTs: number; lastDbWriteTs: number; lastError?: string } } {
    return {
      btcturk: { lastEventTs: 0, lastDbWriteTs: 0 },
      bist: { lastEventTs: 0, lastDbWriteTs: 0 }
    };
  }
}
