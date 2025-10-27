// BIST Market Data Reader
// BIST reader iskeleti (kaynak seçimi, parse stub)

import { EventEmitter } from 'events';
import { BISTFileSource } from './source-file.js';
import { BISTBar, BISTTicker } from './types.js';

export interface BISTConfig {
  source: 'file' | 'pipe' | 'api';
  filePath?: string;
  apiUrl?: string;
}

export interface BISTEvent {
  ts: number;
  type: 'bar' | 'ticker';
  symbol: string;
  data: BISTBar | BISTTicker;
}

export class BISTReader extends EventEmitter {
  private source: BISTFileSource;
  private isRunning = false;

  constructor(private config: BISTConfig) {
    super();
    
    switch (config.source) {
      case 'file':
        this.source = new BISTFileSource(config.filePath || '/tmp/bist-data.json');
        break;
      default:
        throw new Error(`Unsupported BIST source: ${config.source}`);
    }
    
    this.source.on('data', (event: BISTEvent) => {
      this.emit('event', event);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    await this.source.start();
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    await this.source.stop();
    this.emit('stopped');
  }

  onEvent(callback: (event: BISTEvent) => void): void {
    this.on('event', callback);
  }
}
