// BTCTurk Spot Exchange Integration
// Public API: start/stop, onEvent(cb)

import { EventEmitter } from 'events';
import { BTCTurkREST } from './rest.js';
import { BTCTurkWS } from './ws.js';

export interface BTCTurkConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  wsUrl?: string;
}

export interface BTCTurkEvent {
  ts: number;
  type: 'ticker' | 'trade' | 'orderbook';
  symbol: string;
  data: any;
}

export class BTCTurkClient extends EventEmitter {
  private rest: BTCTurkREST;
  private ws: BTCTurkWS;
  private isRunning = false;

  constructor(private config: BTCTurkConfig) {
    super();
    this.rest = new BTCTurkREST(config);
    this.ws = new BTCTurkWS(config);
    
    this.ws.on('event', (event: BTCTurkEvent) => {
      this.emit('event', event);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    await this.ws.connect();
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    await this.ws.disconnect();
    this.emit('stopped');
  }

  onEvent(callback: (event: BTCTurkEvent) => void): void {
    this.on('event', callback);
  }
}
