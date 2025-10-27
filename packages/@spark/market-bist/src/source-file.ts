// BIST File Source
// Placeholder: dosyadan/pipe'tan okuma

import { EventEmitter } from 'events';
import { BISTEvent } from './index.js';

export class BISTFileSource extends EventEmitter {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastEventTs: number = 0;

  constructor(private filePath: string) {
    super();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // TODO: Implement real file reading
    // For now, simulate data with interval
    this.interval = setInterval(() => {
      this.simulateData();
    }, 1000); // 1 second interval
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  private simulateData(): void {
    // TODO: Parse real BIST data format
    const now = Date.now();
    this.lastEventTs = now;
    
    const event: BISTEvent = {
      ts: now,
      type: 'bar',
      symbol: 'BIST100',
      data: {
        symbol: 'BIST100',
        timestamp: now,
        open: 1000 + Math.random() * 100,
        high: 1000 + Math.random() * 100,
        low: 1000 + Math.random() * 100,
        close: 1000 + Math.random() * 100,
        volume: Math.random() * 1000000
      }
    };
    
    this.emit('data', event);
  }

  async ping(): Promise<boolean> {
    // Mock health check - always return true for file source
    return true;
  }

  getLastEventTs(): number {
    return this.lastEventTs;
  }
}
